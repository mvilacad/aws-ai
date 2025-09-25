import { ERROR_CODES, ERROR_MESSAGES } from '@aws-ai/shared';
import { APIGatewayProxyResult } from 'aws-lambda';

import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public code: string,
    message?: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(
      message ||
        ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] ||
        'Unknown error'
    );
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    details?: Record<string, unknown>
  ) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 400, {
      field,
      ...details,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(ERROR_CODES.NOT_FOUND, message, 404, {
      resource,
      identifier,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(ERROR_CODES.FORBIDDEN, message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ERROR_CODES.CONFLICT, message, 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(ERROR_CODES.RATE_LIMITED, 'Rate limit exceeded', 429, {
      retryAfter,
    });
  }
}

export class BedrockError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ERROR_CODES.BEDROCK_ERROR, message, 502, details);
  }
}

export class OpenSearchError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ERROR_CODES.OPENSEARCH_ERROR, message, 502, details);
  }
}

export class DynamoDBError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ERROR_CODES.DYNAMODB_ERROR, message, 502, details);
  }
}

// Error response builder
export function createErrorResponse(
  error: Error,
  requestId?: string
): APIGatewayProxyResult {
  let statusCode = 500;
  let code: string = ERROR_CODES.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: Record<string, unknown> | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  }

  // Log error for monitoring
  logger.error('Request failed', error, {
    requestId,
    statusCode,
    errorCode: code,
  });

  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    requestId: requestId || 'unknown',
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(errorResponse),
  };
}

// Success response builder
export function createSuccessResponse<T = any>(
  data: T,
  statusCode = 200,
  requestId?: string
): APIGatewayProxyResult {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: requestId || 'unknown',
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(response),
  };
}

// Paginated response builder
export function createPaginatedResponse<T = any>(
  items: T[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  requestId?: string
): APIGatewayProxyResult {
  const response = {
    success: true,
    data: items,
    pagination,
    timestamp: new Date().toISOString(),
    requestId: requestId || 'unknown',
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(response),
  };
}

// Error handling middleware
export function withErrorHandling<
  T extends (...args: any[]) => Promise<APIGatewayProxyResult>,
>(handler: T): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const requestId = args[0]?.requestContext?.requestId;
      return createErrorResponse(error as Error, requestId);
    }
  }) as T;
}

// Async error catcher
export function asyncCatch<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return ((...args: any[]) => {
    const result = fn(...args);
    if (result && typeof result.catch === 'function') {
      return result.catch((error: Error) => {
        logger.error('Async operation failed', error);
        throw error;
      });
    }
    return result;
  }) as T;
}

// AWS SDK error mapper
export function mapAWSError(error: any): AppError {
  const errorCode = error.code || error.__type || 'UnknownError';
  const message = error.message || 'An AWS service error occurred';

  switch (errorCode) {
    case 'ValidationException':
      return new ValidationError(message);
    case 'ResourceNotFoundException':
      return new NotFoundError('Resource', error.resourceId);
    case 'ConditionalCheckFailedException':
      return new ConflictError('Resource conflict detected');
    case 'ProvisionedThroughputExceededException':
    case 'ThrottlingException':
      return new RateLimitError();
    case 'AccessDeniedException':
      return new ForbiddenError('AWS access denied');
    case 'UnauthorizedOperation':
      return new UnauthorizedError('AWS operation not authorized');
    default:
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return new AppError(ERROR_CODES.BAD_REQUEST, message, error.statusCode);
      }
      return new AppError(ERROR_CODES.INTERNAL_ERROR, message);
  }
}
