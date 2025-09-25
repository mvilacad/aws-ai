import { EnvironmentConfig } from './index';

export const stagingConfig: EnvironmentConfig = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stage: 'staging',

  database: {
    tablePrefix: 'aws-ai-staging',
    billingMode: 'PAY_PER_REQUEST',
    backupRetention: 14, // 14 days
    pointInTimeRecovery: true,
  },

  openSearch: {
    instanceType: 't3.medium.search',
    instanceCount: 2,
    dedicatedMasterEnabled: false,
    ebsEnabled: true,
    volumeSize: 20, // GB
    encryptionAtRest: true,
  },

  lambda: {
    runtime: 'nodejs20.x',
    timeout: 60, // seconds
    memorySize: 1024, // MB
    environment: {
      NODE_ENV: 'staging',
      LOG_LEVEL: 'info',
      STAGE: 'staging',
    },
    reservedConcurrency: 20,
  },

  api: {
    throttling: {
      rateLimit: 5000,
      burstLimit: 10000,
    },
    cors: {
      allowOrigins: ['https://staging.aws-ai.com'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  },

  monitoring: {
    enableXRay: true,
    logLevel: 'info',
    metricsEnabled: true,
    alarmEmail: process.env.ALARM_EMAIL,
  },

  security: {
    enableWAF: true,
    enableApiKeyAuth: true,
  },

  ai: {
    bedrockRegion: 'us-east-1',
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    embeddingModelId: 'amazon.titan-embed-text-v1',
    maxTokens: 4000,
    temperature: 0.7,
  },

  storage: {
    documentsBucket: {
      versioning: true,
      lifecycleRules: true,
      encryption: true,
    },
  },
};
