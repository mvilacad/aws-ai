export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  version: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentProcessedEvent extends BaseEvent {
  type: 'document.processed';
  data: {
    documentId: string;
    status: 'success' | 'failed';
    extractedText?: string;
    embedding?: number[];
    error?: string;
  };
}

export interface ViolationDetectedEvent extends BaseEvent {
  type: 'violation.detected';
  data: {
    caseId: string;
    subjectId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    violations: Array<{
      type: string;
      confidence: number;
      description: string;
    }>;
    evidenceIds: string[];
  };
}

export interface ChatSessionCreatedEvent extends BaseEvent {
  type: 'chat.session_created';
  data: {
    sessionId: string;
    userId: string;
    metadata?: Record<string, unknown>;
  };
}

export interface ChatMessageEvent extends BaseEvent {
  type: 'chat.message_sent' | 'chat.message_received';
  data: {
    sessionId: string;
    messageId: string;
    content: string;
    role: 'user' | 'assistant';
    tokensUsed?: number;
    processingTime?: number;
  };
}

export interface AnalysisCompletedEvent extends BaseEvent {
  type: 'analysis.completed';
  data: {
    analysisId: string;
    documentId?: string;
    riskScore: number;
    violations: Array<{
      type: string;
      severity: string;
      confidence: number;
    }>;
    processingTime: number;
  };
}

export interface UserActivityEvent extends BaseEvent {
  type: 'user.login' | 'user.logout' | 'user.action';
  data: {
    userId: string;
    action?: string;
    resource?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface SystemHealthEvent extends BaseEvent {
  type: 'system.health_check' | 'system.alert' | 'system.error';
  data: {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics?: Record<string, number>;
    error?: {
      code: string;
      message: string;
      stack?: string;
    };
  };
}

export type DomainEvent =
  | DocumentProcessedEvent
  | ViolationDetectedEvent
  | ChatSessionCreatedEvent
  | ChatMessageEvent
  | AnalysisCompletedEvent
  | UserActivityEvent
  | SystemHealthEvent;

export interface EventStore {
  append(streamId: string, events: DomainEvent[]): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): void;
}
