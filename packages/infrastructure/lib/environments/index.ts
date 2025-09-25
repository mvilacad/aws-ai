import { Environment } from 'aws-cdk-lib';

import { developmentConfig } from './development';
import { productionConfig } from './production';
import { stagingConfig } from './staging';

export interface EnvironmentConfig {
  env: Environment;
  stage: string;

  // Database configuration
  database: {
    tablePrefix: string;
    billingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
    backupRetention: number;
    pointInTimeRecovery: boolean;
  };

  // OpenSearch configuration
  openSearch: {
    instanceType: string;
    instanceCount: number;
    dedicatedMasterEnabled: boolean;
    masterInstanceType?: string;
    masterInstanceCount?: number;
    ebsEnabled: boolean;
    volumeSize: number;
    encryptionAtRest: boolean;
  };

  // Lambda configuration
  lambda: {
    runtime: string;
    timeout: number;
    memorySize: number;
    environment: Record<string, string>;
    reservedConcurrency?: number;
  };

  // API Gateway configuration
  api: {
    throttling: {
      rateLimit: number;
      burstLimit: number;
    };
    cors: {
      allowOrigins: string[];
      allowMethods: string[];
      allowHeaders: string[];
    };
  };

  // Monitoring configuration
  monitoring: {
    enableXRay: boolean;
    logLevel: string;
    metricsEnabled: boolean;
    alarmEmail?: string;
  };

  // Security configuration
  security: {
    enableWAF: boolean;
    allowedIpRanges?: string[];
    enableApiKeyAuth: boolean;
  };

  // AI/ML configuration
  ai: {
    bedrockRegion: string;
    modelId: string;
    embeddingModelId: string;
    maxTokens: number;
    temperature: number;
  };

  // Storage configuration
  storage: {
    documentsBucket: {
      versioning: boolean;
      lifecycleRules: boolean;
      encryption: boolean;
    };
  };
}

export function getEnvironmentConfig(stage: string): EnvironmentConfig {
  switch (stage) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      throw new Error(`Unknown stage: ${stage}`);
  }
}

export * from './development';
export * from './staging';
export * from './production';
