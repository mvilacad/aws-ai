import { AttributeValue } from '@aws-sdk/client-dynamodb';

export interface DynamoDBTableConfig {
  TableName: string;
  KeySchema: Array<{
    AttributeName: string;
    KeyType: 'HASH' | 'RANGE';
  }>;
  AttributeDefinitions: Array<{
    AttributeName: string;
    AttributeType: 'S' | 'N' | 'B';
  }>;
  BillingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
  GlobalSecondaryIndexes?: Array<{
    IndexName: string;
    KeySchema: Array<{
      AttributeName: string;
      KeyType: 'HASH' | 'RANGE';
    }>;
    Projection: {
      ProjectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
      NonKeyAttributes?: string[];
    };
  }>;
  StreamSpecification?: {
    StreamEnabled: boolean;
    StreamViewType?:
      | 'KEYS_ONLY'
      | 'NEW_IMAGE'
      | 'OLD_IMAGE'
      | 'NEW_AND_OLD_IMAGES';
  };
  Tags?: Array<{
    Key: string;
    Value: string;
  }>;
}

export const USERS_TABLE: DynamoDBTableConfig = {
  TableName: 'aws-ai-users',
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'email-index',
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  Tags: [
    { Key: 'Project', Value: 'aws-ai' },
    { Key: 'Environment', Value: 'development' },
  ],
};

export const CHAT_SESSIONS_TABLE: DynamoDBTableConfig = {
  TableName: 'aws-ai-chat-sessions',
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'userId', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'user-sessions-index',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  Tags: [
    { Key: 'Project', Value: 'aws-ai' },
    { Key: 'Environment', Value: 'development' },
  ],
};

export const CHAT_MESSAGES_TABLE: DynamoDBTableConfig = {
  TableName: 'aws-ai-chat-messages',
  KeySchema: [
    { AttributeName: 'sessionId', KeyType: 'HASH' },
    { AttributeName: 'timestamp', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'sessionId', AttributeType: 'S' },
    { AttributeName: 'timestamp', AttributeType: 'S' },
    { AttributeName: 'id', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'message-id-index',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  Tags: [
    { Key: 'Project', Value: 'aws-ai' },
    { Key: 'Environment', Value: 'development' },
  ],
};

export const DOCUMENTS_TABLE: DynamoDBTableConfig = {
  TableName: 'aws-ai-documents',
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'uploadedBy', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'user-documents-index',
      KeySchema: [{ AttributeName: 'uploadedBy', KeyType: 'HASH' }],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
    {
      IndexName: 'status-index',
      KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
  Tags: [
    { Key: 'Project', Value: 'aws-ai' },
    { Key: 'Environment', Value: 'development' },
  ],
};

export const VIOLATION_CASES_TABLE: DynamoDBTableConfig = {
  TableName: 'aws-ai-violation-cases',
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'subjectId', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'severity', AttributeType: 'S' },
    { AttributeName: 'detectedAt', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'subject-violations-index',
      KeySchema: [
        { AttributeName: 'subjectId', KeyType: 'HASH' },
        { AttributeName: 'detectedAt', KeyType: 'RANGE' },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
    {
      IndexName: 'status-severity-index',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'severity', KeyType: 'RANGE' },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
  Tags: [
    { Key: 'Project', Value: 'aws-ai' },
    { Key: 'Environment', Value: 'development' },
  ],
};

export const MONITORING_SUBJECTS_TABLE: DynamoDBTableConfig = {
  TableName: 'aws-ai-monitoring-subjects',
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'assignedOfficer', AttributeType: 'S' },
    { AttributeName: 'monitoringStatus', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'officer-subjects-index',
      KeySchema: [{ AttributeName: 'assignedOfficer', KeyType: 'HASH' }],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
    {
      IndexName: 'status-index',
      KeySchema: [{ AttributeName: 'monitoringStatus', KeyType: 'HASH' }],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  Tags: [
    { Key: 'Project', Value: 'aws-ai' },
    { Key: 'Environment', Value: 'development' },
  ],
};

export const EVENTS_TABLE: DynamoDBTableConfig = {
  TableName: 'aws-ai-events',
  KeySchema: [
    { AttributeName: 'streamId', KeyType: 'HASH' },
    { AttributeName: 'timestamp', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'streamId', AttributeType: 'S' },
    { AttributeName: 'timestamp', AttributeType: 'S' },
    { AttributeName: 'eventType', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'event-type-index',
      KeySchema: [
        { AttributeName: 'eventType', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_IMAGE',
  },
  Tags: [
    { Key: 'Project', Value: 'aws-ai' },
    { Key: 'Environment', Value: 'development' },
  ],
};

export const ALL_TABLES = [
  USERS_TABLE,
  CHAT_SESSIONS_TABLE,
  CHAT_MESSAGES_TABLE,
  DOCUMENTS_TABLE,
  VIOLATION_CASES_TABLE,
  MONITORING_SUBJECTS_TABLE,
  EVENTS_TABLE,
];

export type DynamoDBItem = Record<string, AttributeValue>;
