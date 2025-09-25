export const API_ROUTES = {
  HEALTH: '/health',
  CHAT: '/chat',
  ANALYSIS: '/analysis',
  DOCUMENTS: '/documents',
  VIOLATIONS: '/violations',
  USERS: '/users',
  SESSIONS: '/sessions',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const;

export const RATE_LIMITS = {
  CHAT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 30,
  },
  ANALYSIS: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10,
  },
  DOCUMENT_UPLOAD: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 5,
  },
  GENERAL: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
  },
} as const;

export const FILE_LIMITS = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/json',
  ],
  ALLOWED_EXTENSIONS: ['.txt', '.md', '.pdf', '.doc', '.docx', '.csv', '.json'],
} as const;

export const ANALYSIS_LIMITS = {
  MAX_TEXT_LENGTH: 50000,
  MIN_TEXT_LENGTH: 10,
  MAX_BATCH_SIZE: 10,
} as const;

export const CHAT_LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_SESSION_MESSAGES: 100,
  MAX_SESSIONS_PER_USER: 10,
} as const;

export const CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://*.amazonaws.com',
  'https://*.cloudfront.net',
] as const;

export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  X_API_KEY: 'X-API-Key',
  X_REQUEST_ID: 'X-Request-ID',
  X_CORRELATION_ID: 'X-Correlation-ID',
  X_USER_ID: 'X-User-ID',
  X_SESSION_ID: 'X-Session-ID',
  X_RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  X_RATE_LIMIT_RESET: 'X-RateLimit-Reset',
} as const;
