import { ALL_TABLES } from '@aws-ai/database';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { EnvironmentConfig } from '../environments';

export interface DataStackProps extends cdk.StackProps {
  stage: string;
  config: EnvironmentConfig;
}

export class DataStack extends cdk.Stack {
  public readonly dynamoTables: Record<string, dynamodb.Table> = {};
  public readonly documentsBucket: s3.Bucket;
  public readonly openSearchDomain: opensearch.Domain;
  public readonly openSearchServiceRole: iam.Role;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Create DynamoDB tables
    this.createDynamoTables(config);

    // Create S3 bucket for documents
    this.documentsBucket = this.createDocumentsBucket(config);

    // Create OpenSearch domain
    this.openSearchDomain = this.createOpenSearchDomain(config);

    // Create service role for OpenSearch operations
    this.openSearchServiceRole = this.createOpenSearchServiceRole();

    // Add outputs
    this.addOutputs();
  }

  private createDynamoTables(config: EnvironmentConfig): void {
    for (const tableConfig of ALL_TABLES) {
      const tableName = `${config.database.tablePrefix}-${tableConfig.TableName.replace('aws-ai-', '')}`;

      const table = new dynamodb.Table(this, `${tableConfig.TableName}Table`, {
        tableName,
        billingMode:
          config.database.billingMode === 'PAY_PER_REQUEST'
            ? dynamodb.BillingMode.PAY_PER_REQUEST
            : dynamodb.BillingMode.PROVISIONED,
        pointInTimeRecovery: config.database.pointInTimeRecovery,
        removalPolicy:
          config.stage === 'production'
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        ...(tableConfig.StreamSpecification?.StreamEnabled && {
          stream: this.mapStreamViewType(
            tableConfig.StreamSpecification.StreamViewType!
          ),
        }),
        partitionKey: {
          name: tableConfig.KeySchema.find(k => k.KeyType === 'HASH')!
            .AttributeName,
          type: this.mapAttributeType(
            tableConfig.AttributeDefinitions.find(
              a =>
                a.AttributeName ===
                tableConfig.KeySchema.find(k => k.KeyType === 'HASH')!
                  .AttributeName
            )!.AttributeType
          ),
        },
        ...(tableConfig.KeySchema.find(k => k.KeyType === 'RANGE') && {
          sortKey: {
            name: tableConfig.KeySchema.find(k => k.KeyType === 'RANGE')!
              .AttributeName,
            type: this.mapAttributeType(
              tableConfig.AttributeDefinitions.find(
                a =>
                  a.AttributeName ===
                  tableConfig.KeySchema.find(k => k.KeyType === 'RANGE')!
                    .AttributeName
              )!.AttributeType
            ),
          },
        }),
      });

      // Add Global Secondary Indexes
      if (tableConfig.GlobalSecondaryIndexes) {
        for (const gsi of tableConfig.GlobalSecondaryIndexes) {
          table.addGlobalSecondaryIndex({
            indexName: gsi.IndexName,
            partitionKey: {
              name: gsi.KeySchema.find(k => k.KeyType === 'HASH')!
                .AttributeName,
              type: this.mapAttributeType(
                tableConfig.AttributeDefinitions.find(
                  a =>
                    a.AttributeName ===
                    gsi.KeySchema.find(k => k.KeyType === 'HASH')!.AttributeName
                )!.AttributeType
              ),
            },
            ...(gsi.KeySchema.find(k => k.KeyType === 'RANGE') && {
              sortKey: {
                name: gsi.KeySchema.find(k => k.KeyType === 'RANGE')!
                  .AttributeName,
                type: this.mapAttributeType(
                  tableConfig.AttributeDefinitions.find(
                    a =>
                      a.AttributeName ===
                      gsi.KeySchema.find(k => k.KeyType === 'RANGE')!
                        .AttributeName
                  )!.AttributeType
                ),
              },
            }),
            projectionType:
              gsi.Projection.ProjectionType === 'ALL'
                ? dynamodb.ProjectionType.ALL
                : dynamodb.ProjectionType.KEYS_ONLY,
          });
        }
      }

      // Store reference to table
      this.dynamoTables[tableConfig.TableName.replace('aws-ai-', '')] = table;
    }
  }

  private createDocumentsBucket(config: EnvironmentConfig): s3.Bucket {
    return new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `${config.database.tablePrefix}-documents-${this.account}-${this.region}`,
      versioned: config.storage.documentsBucket.versioning,
      encryption: config.storage.documentsBucket.encryption
        ? s3.BucketEncryption.S3_MANAGED
        : s3.BucketEncryption.UNENCRYPTED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        config.stage === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stage !== 'production',
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: config.api.cors.allowOrigins,
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      ...(config.storage.documentsBucket.lifecycleRules && {
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            noncurrentVersionExpiration: cdk.Duration.days(30),
            enabled: true,
          },
          {
            id: 'DeleteIncompleteUploads',
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
            enabled: true,
          },
        ],
      }),
    });
  }

  private createOpenSearchDomain(config: EnvironmentConfig): opensearch.Domain {
    return new opensearch.Domain(this, 'OpenSearchDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      domainName: `${config.database.tablePrefix}-search`,
      capacity: {
        dataNodes: config.openSearch.instanceCount,
        dataNodeInstanceType: config.openSearch.instanceType as any,
        ...(config.openSearch.dedicatedMasterEnabled && {
          masterNodes: config.openSearch.masterInstanceCount,
          masterNodeInstanceType: config.openSearch.masterInstanceType as any,
        }),
      },
      ebs: config.openSearch.ebsEnabled
        ? {
            volumeSize: config.openSearch.volumeSize,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }
        : undefined,
      zoneAwareness: {
        enabled: config.openSearch.instanceCount > 1,
        availabilityZoneCount: config.openSearch.instanceCount > 1 ? 2 : 1,
      },
      encryptionAtRest: {
        enabled: config.openSearch.encryptionAtRest,
      },
      nodeToNodeEncryption: config.openSearch.encryptionAtRest,
      enforceHttps: true,
      tlsSecurityPolicy: opensearch.TLSSecurityPolicy.TLS_1_2,
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
          actions: ['es:*'],
          resources: [
            `arn:aws:es:${this.region}:${this.account}:domain/${config.database.tablePrefix}-search/*`,
          ],
        }),
      ],
      removalPolicy:
        config.stage === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });
  }

  private createOpenSearchServiceRole(): iam.Role {
    return new iam.Role(this, 'OpenSearchServiceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        OpenSearchAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'es:ESHttpDelete',
                'es:ESHttpGet',
                'es:ESHttpHead',
                'es:ESHttpPost',
                'es:ESHttpPut',
              ],
              resources: [this.openSearchDomain.domainArn + '/*'],
            }),
          ],
        }),
      },
    });
  }

  private mapAttributeType(attributeType: string): dynamodb.AttributeType {
    switch (attributeType) {
      case 'S':
        return dynamodb.AttributeType.STRING;
      case 'N':
        return dynamodb.AttributeType.NUMBER;
      case 'B':
        return dynamodb.AttributeType.BINARY;
      default:
        throw new Error(`Unknown attribute type: ${attributeType}`);
    }
  }

  private mapStreamViewType(streamViewType: string): dynamodb.StreamViewType {
    switch (streamViewType) {
      case 'KEYS_ONLY':
        return dynamodb.StreamViewType.KEYS_ONLY;
      case 'NEW_IMAGE':
        return dynamodb.StreamViewType.NEW_IMAGE;
      case 'OLD_IMAGE':
        return dynamodb.StreamViewType.OLD_IMAGE;
      case 'NEW_AND_OLD_IMAGES':
        return dynamodb.StreamViewType.NEW_AND_OLD_IMAGES;
      default:
        throw new Error(`Unknown stream view type: ${streamViewType}`);
    }
  }

  private addOutputs(): void {
    // DynamoDB table outputs
    Object.entries(this.dynamoTables).forEach(([name, table]) => {
      new cdk.CfnOutput(this, `${name}TableName`, {
        value: table.tableName,
        exportName: `${this.stackName}-${name}TableName`,
      });

      new cdk.CfnOutput(this, `${name}TableArn`, {
        value: table.tableArn,
        exportName: `${this.stackName}-${name}TableArn`,
      });
    });

    // S3 bucket outputs
    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      exportName: `${this.stackName}-DocumentsBucketName`,
    });

    new cdk.CfnOutput(this, 'DocumentsBucketArn', {
      value: this.documentsBucket.bucketArn,
      exportName: `${this.stackName}-DocumentsBucketArn`,
    });

    // OpenSearch outputs
    new cdk.CfnOutput(this, 'OpenSearchDomainEndpoint', {
      value: this.openSearchDomain.domainEndpoint,
      exportName: `${this.stackName}-OpenSearchDomainEndpoint`,
    });

    new cdk.CfnOutput(this, 'OpenSearchDomainArn', {
      value: this.openSearchDomain.domainArn,
      exportName: `${this.stackName}-OpenSearchDomainArn`,
    });
  }
}
