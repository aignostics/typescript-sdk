import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { startCallbackServer, waitForCallback } from './oauth-callback-server.js';

describe('OAuth Callback Server', () => {
  let server: http.Server | null = null;

  afterEach(async () => {
    if (server) {
      await new Promise<void>(resolve => {
        server!.close(() => resolve());
      });
      server = null;
    }
  });

  describe('startCallbackServer', () => {
    it('should start server on preferred port', async () => {
      server = await startCallbackServer(9876);

      const address = server.address();
      expect(address).toBeTruthy();
      expect(typeof address === 'object' && address !== null ? address.port : null).toBe(9876);
    });

    it('should fallback to random port when preferred port is in use', async () => {
      // Start first server on port 9877
      const firstServer = await startCallbackServer(9877);

      try {
        // Try to start second server on the same port - should fallback to random port
        server = await startCallbackServer(9877);

        const address = server.address();
        expect(address).toBeTruthy();
        expect(typeof address === 'object' && address !== null ? address.port : null).not.toBe(
          9877
        );
        expect(
          typeof address === 'object' && address !== null ? address.port : null
        ).toBeGreaterThan(0);
      } finally {
        firstServer.close();
      }
    });

    it('should use default port 8989 when no port specified', async () => {
      server = await startCallbackServer();

      const address = server.address();
      expect(address).toBeTruthy();
      // Note: May fallback to random port if 8989 is in use during tests
      expect(typeof address === 'object' && address !== null ? address.port : null).toBeGreaterThan(
        0
      );
    });
  });

  describe('waitForCallback', () => {
    beforeEach(async () => {
      server = await startCallbackServer(0); // Use random port
    });

    it('should resolve with authorization code when valid callback received', async () => {
      const callbackPromise = waitForCallback(server!, 1000);

      // Simulate OAuth callback with authorization code
      const address = server!.address();
      const port = typeof address === 'object' && address !== null ? address.port : 8989;

      // Make request to callback URL
      setTimeout(() => {
        const req = http.request({
          hostname: 'localhost',
          port,
          path: '/?code=test-auth-code&state=test-state',
          method: 'GET',
        });
        req.end();
      }, 100);

      const result = await callbackPromise;
      expect(result).toBe('test-auth-code');
    });

    it('should reject with error when OAuth error received', async () => {
      const callbackPromise = waitForCallback(server!, 1000);

      // Simulate OAuth error callback
      const address = server!.address();
      const port = typeof address === 'object' && address !== null ? address.port : 8989;

      setTimeout(() => {
        const req = http.request({
          hostname: 'localhost',
          port,
          path: '/?error=access_denied&error_description=User%20denied%20access',
          method: 'GET',
        });
        req.end();
      }, 100);

      await expect(callbackPromise).rejects.toThrow('Authentication failed: User denied access');
    });

    it('should reject with timeout error when no callback received', async () => {
      const callbackPromise = waitForCallback(server!, 100); // 100ms timeout

      await expect(callbackPromise).rejects.toThrow('Authentication timeout');
    });

    it('should handle requests to non-root paths', async () => {
      const callbackPromise = waitForCallback(server!, 1000);

      // Make request to non-root path (e.g., favicon.ico)
      const address = server!.address();
      const port = typeof address === 'object' && address !== null ? address.port : 8989;

      setTimeout(async () => {
        // Request to /favicon.ico should get 404
        const req = http.request({
          hostname: 'localhost',
          port,
          path: '/favicon.ico',
          method: 'GET',
        });
        req.end();

        // Then send valid callback
        setTimeout(() => {
          const validReq = http.request({
            hostname: 'localhost',
            port,
            path: '/?code=test-code',
            method: 'GET',
          });
          validReq.end();
        }, 50);
      }, 100);

      const result = await callbackPromise;
      expect(result).toBe('test-code');
    });

    it('should handle callback with error parameter but no description', async () => {
      const callbackPromise = waitForCallback(server!, 1000);

      const address = server!.address();
      const port = typeof address === 'object' && address !== null ? address.port : 8989;

      setTimeout(() => {
        const req = http.request({
          hostname: 'localhost',
          port,
          path: '/?error=invalid_request',
          method: 'GET',
        });
        req.end();
      }, 100);

      await expect(callbackPromise).rejects.toThrow('Authentication failed: invalid_request');
    });

    it('should handle callback without code or error parameters', async () => {
      const callbackPromise = waitForCallback(server!, 1000);

      const address = server!.address();
      const port = typeof address === 'object' && address !== null ? address.port : 8989;

      setTimeout(() => {
        const req = http.request({
          hostname: 'localhost',
          port,
          path: '/?state=test-state',
          method: 'GET',
        });
        req.end();
      }, 100);

      // Should timeout since no valid code or error is provided
      await expect(callbackPromise).rejects.toThrow('Authentication timeout');
    });
  });

  describe('HTML responses', () => {
    it('should return success HTML with UTF-8 charset for valid authorization code', async () => {
      const testServer = await startCallbackServer(0);
      const callbackPromise = waitForCallback(testServer, 2000);

      const address = testServer.address();
      const port = typeof address === 'object' && address !== null ? address.port : 8989;

      // Make request and capture headers
      setTimeout(() => {
        const req = http.request(
          {
            hostname: 'localhost',
            port,
            path: '/?code=test-code',
            method: 'GET',
          },
          res => {
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toBe('text/html; charset=utf-8');
          }
        );
        req.end();
      }, 100);

      // The waitForCallback should resolve with the code
      const result = await callbackPromise;
      expect(result).toBe('test-code');

      testServer.close();
    });

    it('should return error HTML with UTF-8 charset for OAuth errors', async () => {
      const testServer = await startCallbackServer(0);
      const callbackPromise = waitForCallback(testServer, 2000);

      const address = testServer.address();
      const port = typeof address === 'object' && address !== null ? address.port : 8989;

      setTimeout(() => {
        const req = http.request(
          {
            hostname: 'localhost',
            port,
            path: '/?error=access_denied&error_description=User%20cancelled',
            method: 'GET',
          },
          res => {
            expect(res.statusCode).toBe(400);
            expect(res.headers['content-type']).toBe('text/html; charset=utf-8');
          }
        );
        req.end();
      }, 100);

      await expect(callbackPromise).rejects.toThrow('Authentication failed: User cancelled');

      testServer.close();
    });

    it('should return 404 for non-root paths', async () => {
      const testServer = await startCallbackServer(0);
      const callbackPromise = waitForCallback(testServer, 1000);

      const address = testServer.address();
      const port = typeof address === 'object' && address !== null ? address.port : 8989;

      // First make a request to a non-root path, then a valid callback
      setTimeout(async () => {
        // Request to /favicon.ico should get 404
        await new Promise<void>(resolve => {
          const req = http.request(
            {
              hostname: 'localhost',
              port,
              path: '/favicon.ico',
              method: 'GET',
            },
            res => {
              expect(res.statusCode).toBe(404);
              expect(res.headers['content-type']).toBe('text/plain');

              let data = '';
              res.on('data', chunk => (data += chunk));
              res.on('end', () => {
                expect(data).toBe('Not found');
                resolve();
              });
            }
          );
          req.end();
        });

        // Then send valid callback to complete the test
        setTimeout(() => {
          const validReq = http.request({
            hostname: 'localhost',
            port,
            path: '/?code=test-code',
            method: 'GET',
          });
          validReq.end();
        }, 50);
      }, 100);

      const result = await callbackPromise;
      expect(result).toBe('test-code');

      testServer.close();
    });
  });
});
