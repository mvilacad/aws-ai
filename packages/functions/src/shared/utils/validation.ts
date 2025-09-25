import { APIGatewayProxyEvent } from 'aws-lambda';
import { z } from 'zod';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new ValidationError(
        firstError.message,
        firstError.path.join('.'),
        firstError.code
      );
    }
    throw error;
  }
}

export function parseAndValidate<T>(
  schema: z.ZodSchema<T>,
  jsonString: string
): T {
  try {
    const data = JSON.parse(jsonString);
    return validateSchema(schema, data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON format', 'body', 'INVALID_JSON');
    }
    throw error;
  }
}

export function validateEventBody<T>(
  event: APIGatewayProxyEvent,
  schema: z.ZodSchema<T>
): T {
  if (!event.body) {
    throw new ValidationError(
      'Request body is required',
      'body',
      'MISSING_BODY'
    );
  }

  return parseAndValidate(schema, event.body);
}

export function validateQueryParams<T>(
  event: APIGatewayProxyEvent,
  schema: z.ZodSchema<T>
): T {
  const queryParams = event.queryStringParameters || {};
  return validateSchema(schema, queryParams);
}

export function validatePathParams<T>(
  event: APIGatewayProxyEvent,
  schema: z.ZodSchema<T>
): T {
  const pathParams = event.pathParameters || {};
  return validateSchema(schema, pathParams);
}

export function validateHeaders<T>(
  event: APIGatewayProxyEvent,
  schema: z.ZodSchema<T>
): T {
  const headers = event.headers || {};
  return validateSchema(schema, headers);
}

// Common validation schemas
export const CommonSchemas = {
  id: z.string().min(1, 'ID is required'),
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  url: z.string().url('Invalid URL format'),
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  nonNegativeInteger: z.number().int().min(0, 'Must be non-negative'),
  dateString: z.string().datetime('Invalid date format'),
  pagination: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    page: z.number().int().min(1).default(1),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  apiKey: z.string().regex(/^ak_[a-zA-Z0-9]{32,}$/, 'Invalid API key format'),
  sessionId: z
    .string()
    .regex(/^sess_[a-f0-9]{40}$/, 'Invalid session ID format'),
  requestId: z
    .string()
    .regex(/^req_[a-f0-9]{24}$/, 'Invalid request ID format'),
};

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/gu, '') // Remove control characters
    .replace(/[<>]/g, ''); // Remove basic HTML characters
}

export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowedFields: string[]
): Partial<T> {
  const sanitized: Partial<T> = {};

  for (const field of allowedFields) {
    if (obj[field] !== undefined) {
      const value = obj[field];
      sanitized[field as keyof T] =
        typeof value === 'string'
          ? (sanitizeString(value) as T[keyof T])
          : value;
    }
  }

  return sanitized;
}

// Rate limiting helpers
export function extractClientIdentifier(event: APIGatewayProxyEvent): string {
  // Try to get user ID from context
  if (event.requestContext.authorizer?.userId) {
    return `user:${event.requestContext.authorizer.userId}`;
  }

  // Fall back to IP address
  const ip = event.requestContext.identity?.sourceIp || 'unknown';
  return `ip:${ip}`;
}

// Request validation helpers
export function validateContentType(
  event: APIGatewayProxyEvent,
  expectedType = 'application/json'
): void {
  const contentType =
    event.headers['Content-Type'] || event.headers['content-type'];

  if (!contentType || !contentType.includes(expectedType)) {
    throw new ValidationError(
      `Content-Type must be ${expectedType}`,
      'Content-Type',
      'INVALID_CONTENT_TYPE'
    );
  }
}

export function validateRequiredHeaders(
  event: APIGatewayProxyEvent,
  requiredHeaders: string[]
): void {
  const headers = event.headers || {};
  const missingHeaders = requiredHeaders.filter(
    header => !headers[header] && !headers[header.toLowerCase()]
  );

  if (missingHeaders.length > 0) {
    throw new ValidationError(
      `Missing required headers: ${missingHeaders.join(', ')}`,
      'headers',
      'MISSING_HEADERS'
    );
  }
}

// Business logic validation
export function validateViolationSeverity(severity: string): void {
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!validSeverities.includes(severity)) {
    throw new ValidationError(
      `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
      'severity',
      'INVALID_SEVERITY'
    );
  }
}

export function validateViolationStatus(status: string): void {
  const validStatuses = ['open', 'investigating', 'resolved', 'dismissed'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      'status',
      'INVALID_STATUS'
    );
  }
}

export function validateUserRole(role: string): void {
  const validRoles = ['admin', 'analyst', 'viewer'];
  if (!validRoles.includes(role)) {
    throw new ValidationError(
      `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      'role',
      'INVALID_ROLE'
    );
  }
}

export function validateMonitoringStatus(status: string): void {
  const validStatuses = ['active', 'inactive', 'completed', 'violated'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(
      `Invalid monitoring status. Must be one of: ${validStatuses.join(', ')}`,
      'monitoringStatus',
      'INVALID_MONITORING_STATUS'
    );
  }
}
