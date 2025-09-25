export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  requestId: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  sources?: DocumentReference[];
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    confidence: number;
  };
}

export interface AnalysisRequest {
  text: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalysisResponse {
  violations: ViolationDetection[];
  summary: string;
  riskScore: number;
  recommendations: string[];
  processingTime: number;
}

export interface ViolationDetection {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  location: {
    start: number;
    end: number;
    text: string;
  };
  suggestedActions: string[];
}

export interface DocumentReference {
  id: string;
  title: string;
  excerpt: string;
  relevance: number;
  source: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency?: number;
      error?: string;
    };
  };
}
