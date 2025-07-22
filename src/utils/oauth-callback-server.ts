import http from 'node:http';
import { URL } from 'node:url';

/**
 * OAuth callback server utilities
 * Handles the local HTTP server for OAuth2 PKCE flow callbacks
 */

/**
 * Start a local HTTP server to handle OAuth callbacks
 * @param preferredPort - Preferred port to listen on (defaults to 8989)
 * @returns Promise that resolves to the HTTP server instance
 */
export async function startCallbackServer(preferredPort: number = 8989): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();

    server.listen(preferredPort, 'localhost', () => {
      resolve(server);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        // Try a random port if preferred port is in use
        server.listen(0, 'localhost', () => {
          resolve(server);
        });
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Wait for OAuth callback and extract authorization code
 * @param server - HTTP server instance to listen on
 * @param timeoutMs - Timeout in milliseconds (defaults to 5 minutes)
 * @returns Promise that resolves to the authorization code
 */
export async function waitForCallback(
  server: http.Server,
  timeoutMs: number = 5 * 60 * 1000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Authentication timeout - no callback received within the specified time'));
    }, timeoutMs);

    const requestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        // Handle OAuth callback
        if (url.pathname === '/') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');

          if (error) {
            const errorMsg = errorDescription || error;

            // Send error response to browser
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(generateErrorPage(errorMsg));

            cleanup();
            reject(new Error(`Authentication failed: ${errorMsg}`));
            return;
          }

          if (code) {
            // Send success response to browser
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(generateSuccessPage());

            cleanup();
            resolve(code);
            return;
          }
        }

        // Handle other paths (favicon, etc.)
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      server.removeListener('request', requestHandler);
    };

    server.on('request', requestHandler);
  });
}

/**
 * Generate HTML error page for authentication failures
 * @param errorMessage - Error message to display
 * @returns HTML string
 */
function generateErrorPage(errorMessage: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Failed - Aignostics Platform SDK</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
          .error { color: #d32f2f; }
          .container { max-width: 600px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Authentication Failed</h1>
          <p>Error: ${errorMessage}</p>
          <p>Please try again or check your authentication settings.</p>
          <p>You can close this browser window.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML success page for successful authentication
 * @returns HTML string
 */
function generateSuccessPage(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Successful - Aignostics Platform SDK</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
          .success { color: #2e7d32; }
          .container { max-width: 600px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✅ Authentication Successful!</h1>
          <p>You have successfully authenticated with the Aignostics Platform.</p>
          <p>You can now close this browser window and return to your terminal.</p>
          <p>The SDK is ready to use! 🚀</p>
        </div>
      </body>
    </html>
  `;
}
