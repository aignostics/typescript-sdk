# Running the Aignostics Platform Demo

This guide explains how to run the demo application locally.

## Prerequisites

1. **Node.js 18+** installed
2. **OAuth2.0 credentials** for Aignostics Platform
3. Access to the **Aignostics Platform API**

## Setup Steps

### 1. Install Dependencies

From the project root:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp packages/demo/.env.local.example packages/demo/.env.local
```

Edit `packages/demo/.env.local` with your credentials:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:4200
NEXTAUTH_SECRET=your-super-secret-key-here

# OAuth2.0 Provider (replace with your actual values)
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_AUTHORIZATION_URL=https://your-provider.com/authorize
OAUTH_TOKEN_URL=https://your-provider.com/oauth/token
OAUTH_USERINFO_URL=https://your-provider.com/userinfo

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://platform.aignostics.com
```

### 3. Build Dependencies

Build the SDK first (required for the demo):

```bash
npm run build:sdk
```

### 4. Start Development Server

Run the demo application:

```bash
npm run serve:demo
```

The application will be available at: http://localhost:4200

## Available Commands

### From Project Root

- `npm run serve:demo` - Start development server
- `npm run build:demo` - Build for production
- `npm run lint:demo` - Run linting

### From Demo Directory

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linting

## Using the Demo

1. **Open** http://localhost:4200 in your browser
2. **Sign In** using your Aignostics Platform credentials
3. **Browse Applications** - View your available applications
4. **Select Application** - Click on any application to view its details
5. **View Results** - See the placeholder visualization section

## Troubleshooting

### Common Issues

1. **Build Fails**: Make sure to build the SDK first with `npm run build:sdk`
2. **Authentication Errors**: Verify your OAuth2.0 credentials in `.env.local`
3. **API Errors**: Check that `NEXT_PUBLIC_API_BASE_URL` points to the correct API
4. **Port Conflicts**: Change the port in `project.json` if 4200 is already in use

### Debug Mode

To see detailed authentication logs:

1. Open browser developer tools
2. Go to Console tab
3. Look for NextAuth and SDK related messages

### Logs Location

- **NextAuth logs**: Browser console
- **SDK logs**: Browser console
- **Build logs**: Terminal output

## Next Steps

- Implement real data visualization in the results section
- Add error boundaries and better error handling
- Customize the UI theme and branding
- Add more application management features
