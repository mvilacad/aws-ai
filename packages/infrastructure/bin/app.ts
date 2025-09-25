#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/stacks/data-stack';
// TODO: Implement these stacks
// import { ComputeStack } from '../lib/stacks/compute-stack';
// import { AIStack } from '../lib/stacks/ai-stack';
// import { MonitoringStack } from '../lib/stacks/monitoring-stack';
// import { FrontendStack } from '../lib/stacks/frontend-stack';
import { getEnvironmentConfig } from '../lib/environments';

const app = new cdk.App();

const stage = app.node.tryGetContext('stage') || 'development';
const config = getEnvironmentConfig(stage);

const tags = {
  Project: 'aws-ai',
  Environment: stage,
  Owner: 'aws-ai-team',
  CostCenter: 'engineering',
};

// Add tags to all stacks
Object.entries(tags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

// Data layer - DynamoDB tables, S3 buckets, OpenSearch
const dataStack = new DataStack(app, `AwsAiDataStack-${stage}`, {
  env: config.env,
  stage,
  config,
});

// TODO: Implement remaining stacks
// AI/ML layer - Bedrock configurations and model access
// const aiStack = new AIStack(app, `AwsAiMLStack-${stage}`, {
//   env: config.env,
//   stage,
//   config,
// });

// Compute layer - Lambda functions and API Gateway
// const computeStack = new ComputeStack(app, `AwsAiComputeStack-${stage}`, {
//   env: config.env,
//   stage,
//   config,
//   dataStack,
//   aiStack,
// });

// Monitoring layer - CloudWatch, X-Ray, alarms
// const monitoringStack = new MonitoringStack(app, `AwsAiMonitoringStack-${stage}`, {
//   env: config.env,
//   stage,
//   config,
//   computeStack,
//   dataStack,
// });

// Frontend hosting (only for development and staging)
// if (stage !== 'production') {
//   new FrontendStack(app, `AwsAiFrontendStack-${stage}`, {
//     env: config.env,
//     stage,
//     config,
//     computeStack,
//   });
// }

// Stack dependencies
// computeStack.addDependency(dataStack);
// computeStack.addDependency(aiStack);
// monitoringStack.addDependency(computeStack);

app.synth();
