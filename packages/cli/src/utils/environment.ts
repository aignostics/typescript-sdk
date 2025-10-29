export const environmentConfig = {
  production: {
    endpoint: 'https://platform.aignostics.com',
    issuerURL: 'https://aignostics-platform.eu.auth0.com/oauth',
    clientID: 'YtJ7F9lAtxx16SZGQlYPe6wcjlXB78MM',
    audience: 'https://aignostics-platform-samia',
    scope: 'openid profile email offline_access',
  },
  staging: {
    endpoint: 'https://platform-staging.aignostics.com',
    issuerURL: 'https://aignostics-platform-staging.eu.auth0.com/oauth',
    clientID: 'fQkbvYzQPPVwLxc3uque5JsyFW00rJ7b',
    audience: 'https://aignostics-platform-staging-samia',
    scope: 'openid profile email offline_access',
  },
  develop: {
    endpoint: 'https://platform-dev.aignostics.ai',
    issuerURL: 'https://dev-8ouohmmrbuh2h4vu.eu.auth0.com/oauth',
    clientID: 'gqduveFvx7LX90drQPGzr4JGUYdh24gA',
    audience: 'https://dev-8ouohmmrbuh2h4vu-samia',
    scope: 'openid profile email offline_access',
  },
};

export type EnvironmentKey = keyof typeof environmentConfig;
