import { EnvironmentConfig } from './index';

export const productionConfig: EnvironmentConfig = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stage: 'production',

  database: {
    tablePrefix: 'aws-ai-prod',
    billingMode: 'PAY_PER_REQUEST',
    backupRetention: 30, // 30 days
    pointInTimeRecovery: true,
  },

  openSearch: {
    instanceType: 'm6g.large.search',
    instanceCount: 3,
    dedicatedMasterEnabled: true,
    masterInstanceType: 'm6g.medium.search',
    masterInstanceCount: 3,
    ebsEnabled: true,
    volumeSize: 100, // GB
    encryptionAtRest: true,
  },

  lambda: {
    runtime: 'nodejs20.x',
    timeout: 120, // seconds
    memorySize: 2048, // MB
    environment: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn',
      STAGE: 'production',
    },
    reservedConcurrency: 100,
  },

  api: {
    throttling: {
      rateLimit: 20000,
      burstLimit: 40000,
    },
    cors: {
      allowOrigins: ['https://aws-ai.com', 'https://app.aws-ai.com'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  },

  monitoring: {
    enableXRay: true,
    logLevel: 'warn',
    metricsEnabled: true,
    alarmEmail: process.env.ALARM_EMAIL,
  },

  security: {
    enableWAF: true,
    allowedIpRanges: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
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
