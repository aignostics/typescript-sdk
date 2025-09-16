# Aignostics Platform SDK Demo

This demo application showcases the integration of the Aignostics TypeScript SDK with OAuth2.0 authentication using NextAuth.js.

## Features

- OAuth2.0 Authorization Code Flow authentication
- List applications from the Aignostics Platform
- Select applications to view results (placeholder implementation)
- TypeScript SDK integration
- Responsive UI with Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+
- Access to Aignostics Platform with OAuth2.0 credentials

### Environment Configuration

1. Copy the example environment file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your OAuth2.0 provider details:

   ```env
   NEXTAUTH_URL=http://localhost:4200
   NEXTAUTH_SECRET=your-secret-key-here

   # OAuth2.0 Provider Configuration
   OAUTH_CLIENT_ID=your-client-id
   OAUTH_CLIENT_SECRET=your-client-secret
   OAUTH_AUTHORIZATION_URL=https://your-provider.com/authorize
   OAUTH_TOKEN_URL=https://your-provider.com/oauth/token
   OAUTH_USERINFO_URL=https://your-provider.com/userinfo

   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=https://platform.aignostics.com
   ```

### Running the Demo

From the workspace root:

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
nx serve demo

# Or using npm
npm run nx serve demo
```

The application will be available at `http://localhost:4200`.

### Building for Production

```bash
# Build the application
nx build demo

# Export static files (optional)
nx export demo
```

## Usage

1. Open the application in your browser
2. Click "Sign In with Aignostics" to authenticate
3. Once authenticated, you'll see your applications list
4. Click on any application to select it
5. View the placeholder results section for the selected application

## Architecture

- **Next.js 14** with App Router for the frontend framework
- **NextAuth.js** for OAuth2.0 authentication
- **@aignostics/sdk** for API interactions
- **Tailwind CSS** for styling
- **TypeScript** for type safety

## File Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts           # NextAuth configuration
│   ├── layout.tsx             # Root layout with SessionProvider
│   └── page.tsx               # Main page with application listing
├── hooks/
│   └── useSDK.ts             # Custom hook for SDK integration
└── types/
    └── next-auth.d.ts        # NextAuth type augmentation
```

## Development Notes

- The application uses the Nx monorepo structure
- SDK integration is handled through the `useSDK` hook
- Authentication state is managed by NextAuth.js
- The results visualization is currently a placeholder for future implementation

## Troubleshooting

- Ensure all environment variables are properly set
- Check that your OAuth2.0 provider is configured correctly
- Verify that the API base URL is accessible
- Check browser console for authentication errors

## Next Steps

- Implement actual data visualization for selected applications
- Add error handling and retry mechanisms
- Implement application filtering and search
- Add more detailed application information display
