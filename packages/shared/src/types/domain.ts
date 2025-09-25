import { DocumentReference } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  preferences?: UserPreferences;
}

export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    inApp: boolean;
  };
  dashboard: {
    defaultView: string;
    refreshInterval: number;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    sources?: DocumentReference[];
  };
}

export interface Document {
  id: string;
  title: string;
  content: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentStatus;
  tags: string[];
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

export type DocumentStatus = 'uploading' | 'processing' | 'indexed' | 'failed';

export interface ViolationCase {
  id: string;
  subjectId: string;
  subjectName: string;
  description: string;
  severity: ViolationSeverity;
  status: ViolationStatus;
  detectedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  evidence: Evidence[];
  analysis: ViolationAnalysis;
  timeline: ViolationEvent[];
  tags: string[];
}

export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ViolationStatus =
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'dismissed';

export interface Evidence {
  id: string;
  type: EvidenceType;
  source: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type EvidenceType =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'data'
  | 'witness_statement';

export interface ViolationAnalysis {
  riskScore: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
  similarCases: string[];
  aiConfidence: number;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
  evidence: string[];
}

export interface ViolationEvent {
  id: string;
  type: EventType;
  description: string;
  timestamp: string;
  actor: string;
  metadata?: Record<string, unknown>;
}

export type EventType =
  | 'detected'
  | 'assigned'
  | 'status_changed'
  | 'evidence_added'
  | 'note_added'
  | 'escalated'
  | 'resolved'
  | 'dismissed';

export interface MonitoringSubject {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  dateOfBirth: string;
  convictionDetails: ConvictionDetails;
  monitoringStatus: MonitoringStatus;
  riskProfile: RiskProfile;
  assignedOfficer: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isVerified: boolean;
}

export interface ConvictionDetails {
  charges: string[];
  convictionDate: string;
  sentenceLength: string;
  conditions: string[];
  courtJurisdiction: string;
}

export type MonitoringStatus = 'active' | 'inactive' | 'completed' | 'violated';

export interface RiskProfile {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  lastAssessment: string;
  nextReviewDate: string;
}
