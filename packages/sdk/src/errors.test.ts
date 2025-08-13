import { describe, it, expect } from 'vitest';
import { BaseError, AuthenticationError, APIError, ConfigurationError } from './errors.js';

describe('Error Classes', () => {
  describe('BaseError', () => {
    it('should create a BaseError with all properties', () => {
      const context = { userId: '123', action: 'test' };
      const error = new BaseError('Test message', 'UNEXPECTED_ERROR', { context });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('UNEXPECTED_ERROR');
      expect(error.context).toEqual(context);
      expect(error.name).toBe('BaseError');
    });

    it('should create a BaseError without context', () => {
      const error = new BaseError('Test message', 'UNEXPECTED_ERROR');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('UNEXPECTED_ERROR');
      expect(error.context).toBeUndefined();
    });

    it('should maintain proper stack trace', () => {
      const error = new BaseError('Test message', 'UNEXPECTED_ERROR');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('BaseError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with proper inheritance', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Invalid token');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create an AuthenticationError with context', () => {
      const context = { tokenType: 'Bearer', expiry: '2024-01-01' };
      const error = new AuthenticationError('Token expired', { context });

      expect(error.message).toBe('Token expired');
      expect(error.context).toEqual(context);
    });
  });

  describe('APIError', () => {
    it('should create an APIError with status code', () => {
      const error = new APIError('Server error', { statusCode: 500 });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('Server error');
      expect(error.code).toBe('API_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('APIError');
    });

    it('should create an APIError without status code', () => {
      const error = new APIError('Network error');

      expect(error.message).toBe('Network error');
      expect(error.statusCode).toBeUndefined();
    });

    it('should create an APIError with context and status code', () => {
      const context = { endpoint: '/api/test', method: 'GET' };
      const error = new APIError('Bad request', { context, statusCode: 400 });

      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual(context);
    });
  });

  describe('ConfigurationError', () => {
    it('should create a ConfigurationError with proper inheritance', () => {
      const error = new ConfigurationError('Missing API key');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toBe('Missing API key');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.name).toBe('ConfigurationError');
    });

    it('should create a ConfigurationError with context', () => {
      const context = { configFile: 'config.json', requiredFields: ['apiKey'] };
      const error = new ConfigurationError('Invalid configuration', { context });

      expect(error.message).toBe('Invalid configuration');
      expect(error.context).toEqual(context);
    });
  });

  describe('Error serialization', () => {
    it('should serialize errors properly', () => {
      const context = { test: 'value' };
      const error = new AuthenticationError('Test error', { context });

      // Test that the error can be converted to JSON (useful for logging)
      const serialized = JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
        context: error.context,
      });

      const parsed = JSON.parse(serialized) as {
        name: string;
        message: string;
        code: string;
        context: Record<string, unknown>;
      };
      expect(parsed.name).toBe('AuthenticationError');
      expect(parsed.message).toBe('Test error');
      expect(parsed.code).toBe('AUTHENTICATION_ERROR');
      expect(parsed.context).toEqual(context);
    });
  });
});
