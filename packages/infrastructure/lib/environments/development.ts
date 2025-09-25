import { EnvironmentConfig } from './index';

export const developmentConfig: EnvironmentConfig = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stage: 'development',

  database: {
    tablePrefix: 'aws-ai-dev',
    billingMode: 'PAY_PER_REQUEST',
    backupRetention: 7, // 7 days
    pointInTimeRecovery: false,
  },

  openSearch: {
    instanceType: 't3.small.search',
    instanceCount: 1,
    dedicatedMasterEnabled: false,
    ebsEnabled: true,
    volumeSize: 10, // GB
    encryptionAtRest: false,
  },

  lambda: {
    runtime: 'nodejs20.x',
    timeout: 30, // seconds
    memorySize: 512, // MB
    environment: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
      STAGE: 'development',
    },
  },

  api: {
    throttling: {
      rateLimit: 1000,
      burstLimit: 2000,
    },
    cors: {
      allowOrigins: ['http://localhost:3000', 'http://localhost:3001'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  },

  monitoring: {
    enableXRay: true,
    logLevel: 'debug',
    metricsEnabled: true,
    alarmEmail: process.env.ALARM_EMAIL,
  },

  security: {
    enableWAF: false,
    enableApiKeyAuth: false,
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
      versioning: false,
      lifecycleRules: false,
      encryption: false,
    },
  },
};
