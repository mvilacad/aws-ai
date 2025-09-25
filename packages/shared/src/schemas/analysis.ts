import { z } from 'zod';

export const ViolationDetectionSchema = z.object({
  type: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  location: z.object({
    start: z.number().min(0),
    end: z.number().min(0),
    text: z.string(),
  }),
  suggestedActions: z.array(z.string()),
});

export const DocumentReferenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  relevance: z.number().min(0).max(1),
  source: z.string(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const ChatResponseSchema = z.object({
  message: z.string(),
  sessionId: z.string(),
  sources: z.array(DocumentReferenceSchema).optional(),
  metadata: z
    .object({
      tokensUsed: z.number(),
      processingTime: z.number(),
      confidence: z.number(),
    })
    .optional(),
});

export const AnalysisRequestSchema = z.object({
  text: z.string().min(10).max(50000),
  documentId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AnalysisResponseSchema = z.object({
  violations: z.array(ViolationDetectionSchema),
  summary: z.string(),
  riskScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
  processingTime: z.number(),
});

export const DocumentUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z
    .string()
    .regex(
      /^(text\/|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|json|csv))$/
    ),
  size: z.number().max(10485760), // 10MB
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(2).max(5),
  notifications: z.object({
    email: z.boolean(),
    inApp: z.boolean(),
  }),
  dashboard: z.object({
    defaultView: z.string(),
    refreshInterval: z.number().min(5000),
  }),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'analyst', 'viewer']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
  preferences: UserPreferencesSchema.optional(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'analyst', 'viewer']),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'analyst', 'viewer']).optional(),
  preferences: UserPreferencesSchema.optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const SearchSchema = z.object({
  query: z.string().min(1),
  filters: z.record(z.string(), z.unknown()).optional(),
  pagination: PaginationSchema.optional(),
});

// Type exports removed to avoid conflicts with interfaces in api.ts and domain.ts
// These schemas can be used for validation, types are available from the interface files
