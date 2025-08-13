export type ErrorCode =
  | 'AUTHENTICATION_ERROR'
  | 'API_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'UNEXPECTED_ERROR';

interface BaseErrorOptions {
  context?: Record<string, unknown>;
  originalError?: unknown;
}
/**
 * Base error class for all SDK-related errors
 *
 * This class serves as the foundation for all custom error types in the SDK,
 * providing consistent error handling and additional context information.
 */
export class BaseError extends Error {
  /**
   * Error code for programmatic error handling
   */
  public readonly code: ErrorCode;

  /**
   * Additional context or metadata related to the error
   */
  public readonly context?: Record<string, unknown>;

  /**
   * Original error that caused this error, if applicable
   */
  public readonly originalError?: unknown;

  /**
   * Creates a new BaseError instance
   *
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param context - Additional error context or metadata
   */
  constructor(message: string, code: ErrorCode, { context, originalError }: BaseErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Authentication-related error
 *
 * Thrown when authentication fails or when no valid authentication
 * credentials are available for API requests.
 */
export class AuthenticationError extends BaseError {
  /**
   * Creates a new AuthenticationError instance
   *
   * @param message - Human-readable error message describing the authentication issue
   * @param options - Additional options about the authentication failure
   * @param options.context - Additional context about the authentication failure
   * @param options.originalError - Original error that caused this authentication error
   */
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'AUTHENTICATION_ERROR', options);
  }
}

/**
 * API-related error
 *
 * Thrown when API requests fail due to server errors, network issues,
 * or invalid responses from the Aignostics Platform API.
 */
export class APIError extends BaseError {
  /**
   * HTTP status code from the failed API request
   */
  public readonly statusCode?: number;

  /**
   * Creates a new APIError instance
   *
   * @param message - Human-readable error message describing the API issue
   * @param statusCode - HTTP status code from the failed request
   * @param context - Additional context about the API failure
   */
  constructor(message: string, options: BaseErrorOptions & { statusCode?: number } = {}) {
    super(message, 'API_ERROR', options);
    this.statusCode = options.statusCode;
  }
}

/**
 * Configuration-related error
 *
 * Thrown when SDK configuration is invalid or missing required parameters.
 */
export class ConfigurationError extends BaseError {
  /**
   * Creates a new ConfigurationError instance
   *
   * @param message - Human-readable error message describing the configuration issue
   * @param context - Additional context about the configuration problem
   */
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'CONFIGURATION_ERROR', options);
  }
}

export class UnexpectedError extends BaseError {
  /**
   * Creates a new UnexpectedError instance
   *
   * @param message - Human-readable error message describing the unexpected issue
   * @param context - Additional context about the unexpected error
   */
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'UNEXPECTED_ERROR', options);
  }
}
