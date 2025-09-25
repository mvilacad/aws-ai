import { z } from 'zod';

export const ViolationSeveritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);
export const ViolationStatusSchema = z.enum([
  'open',
  'investigating',
  'resolved',
  'dismissed',
]);
export const EvidenceTypeSchema = z.enum([
  'document',
  'image',
  'video',
  'audio',
  'data',
  'witness_statement',
]);
export const MonitoringStatusSchema = z.enum([
  'active',
  'inactive',
  'completed',
  'violated',
]);

export const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().min(2).max(3),
  isVerified: z.boolean(),
});

export const ConvictionDetailsSchema = z.object({
  charges: z.array(z.string()),
  convictionDate: z.string().datetime(),
  sentenceLength: z.string(),
  conditions: z.array(z.string()),
  courtJurisdiction: z.string(),
});

export const RiskProfileSchema = z.object({
  overallRisk: z.enum(['low', 'medium', 'high', 'critical']),
  riskFactors: z.array(z.string()),
  lastAssessment: z.string().datetime(),
  nextReviewDate: z.string().datetime(),
});

export const MonitoringSubjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: AddressSchema.optional(),
  dateOfBirth: z.string().datetime(),
  convictionDetails: ConvictionDetailsSchema,
  monitoringStatus: MonitoringStatusSchema,
  riskProfile: RiskProfileSchema,
  assignedOfficer: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const EvidenceSchema = z.object({
  id: z.string(),
  type: EvidenceTypeSchema,
  source: z.string(),
  content: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const RiskFactorSchema = z.object({
  factor: z.string(),
  weight: z.number().min(0).max(1),
  description: z.string(),
  evidence: z.array(z.string()),
});

export const ViolationAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskFactors: z.array(RiskFactorSchema),
  recommendations: z.array(z.string()),
  similarCases: z.array(z.string()),
  aiConfidence: z.number().min(0).max(1),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
});

export const ViolationEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'detected',
    'assigned',
    'status_changed',
    'evidence_added',
    'note_added',
    'escalated',
    'resolved',
    'dismissed',
  ]),
  description: z.string(),
  timestamp: z.string().datetime(),
  actor: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ViolationCaseSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  description: z.string(),
  severity: ViolationSeveritySchema,
  status: ViolationStatusSchema,
  detectedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  evidence: z.array(EvidenceSchema),
  analysis: ViolationAnalysisSchema,
  timeline: z.array(ViolationEventSchema),
  tags: z.array(z.string()),
});

export const CreateViolationCaseSchema = z.object({
  subjectId: z.string(),
  description: z.string().min(10),
  severity: ViolationSeveritySchema,
  evidence: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional(),
});

export const UpdateViolationCaseSchema = z.object({
  description: z.string().min(10).optional(),
  severity: ViolationSeveritySchema.optional(),
  status: ViolationStatusSchema.optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Type exports removed to avoid conflicts with interfaces in domain.ts
// These schemas can be used for validation, types are available from the interface files
