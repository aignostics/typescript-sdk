import NextAuth, { DefaultSession } from 'next-auth';

interface Profile {
  sub: string;
  name?: string;
  email: string;
  picture?: string;
}

declare module 'next-auth' {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      address: string;
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession['user'];
    accessToken: string;
  }
}

declare module '@auth/core' {
  interface JWT {
    accessToken: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: 'aignostics',
      name: 'Aignostics Platform',
      type: 'oauth',
      authorization: {
        url:
          process.env.OAUTH_AUTHORIZATION_URL ||
          'https://dev-8ouohmmrbuh2h4vu.eu.auth0.com/authorize',
        params: {
          scope: 'openid profile email offline_access',
          audience: 'https://dev-8ouohmmrbuh2h4vu-samia',
          response_type: 'code',
        },
      },
      token: process.env.OAUTH_TOKEN_URL || 'https://dev-8ouohmmrbuh2h4vu.eu.auth0.com/oauth/token',
      userinfo:
        process.env.OAUTH_USERINFO_URL || 'https://dev-8ouohmmrbuh2h4vu.eu.auth0.com/userinfo',
      clientId: process.env.OAUTH_CLIENT_ID || '',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
      issuer: 'https://dev-8ouohmmrbuh2h4vu.eu.auth0.com/',
      profile(profile: Profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.email,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    session({ session, token }) {
      // Send properties to the client
      session.accessToken = String(token.accessToken);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
