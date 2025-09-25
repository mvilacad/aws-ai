#!/usr/bin/env tsx

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { OpenSearchClient } from '../packages/functions/src/shared/clients/opensearch';
import {
  sampleViolationCases,
  sampleMonitoringSubjects,
} from '@aws-ai/database';
import { sampleDocuments } from '@aws-ai/database';

const region = process.env.AWS_REGION || 'us-east-1';
const stage = process.env.STAGE || 'development';
const tablePrefix = `aws-ai-${stage}`;

interface SeedOptions {
  clearExisting?: boolean;
  skipDocuments?: boolean;
  skipViolations?: boolean;
  skipSubjects?: boolean;
}

class DataSeeder {
  private dynamoClient: DynamoDBDocumentClient;
  private openSearchClient: OpenSearchClient;

  constructor() {
    const client = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(client);

    this.openSearchClient = new OpenSearchClient({
      endpoint: process.env.OPENSEARCH_DOMAIN_ENDPOINT || '',
      region,
    });
  }

  async seedAll(options: SeedOptions = {}): Promise<void> {
    console.log('🌱 Starting data seeding...');
    console.log(`   Region: ${region}`);
    console.log(`   Stage: ${stage}`);
    console.log(`   Table Prefix: ${tablePrefix}`);

    try {
      if (!options.skipSubjects) {
        await this.seedMonitoringSubjects();
      }

      if (!options.skipViolations) {
        await this.seedViolationCases();
      }

      if (!options.skipDocuments) {
        await this.seedDocuments();
        await this.seedKnowledgeBase();
      }

      console.log('✅ Data seeding completed successfully!');
    } catch (error) {
      console.error('❌ Data seeding failed:', error);
      process.exit(1);
    }
  }

  private async seedMonitoringSubjects(): Promise<void> {
    console.log('📊 Seeding monitoring subjects...');

    for (const subject of sampleMonitoringSubjects) {
      await this.dynamoClient.send(
        new PutCommand({
          TableName: `${tablePrefix}-monitoring-subjects`,
          Item: subject,
        })
      );

      console.log(`   ✓ Created subject: ${subject.name}`);
    }

    console.log(
      `✅ Seeded ${sampleMonitoringSubjects.length} monitoring subjects`
    );
  }

  private async seedViolationCases(): Promise<void> {
    console.log('⚖️  Seeding violation cases...');

    for (const violationCase of sampleViolationCases) {
      await this.dynamoClient.send(
        new PutCommand({
          TableName: `${tablePrefix}-violation-cases`,
          Item: violationCase,
        })
      );

      console.log(
        `   ✓ Created case: ${violationCase.id} (${violationCase.severity})`
      );

      // Also index in OpenSearch for searchability
      try {
        await this.openSearchClient.indexDocument(
          'violations',
          violationCase.id,
          {
            ...violationCase,
            // Add searchable text content
            searchableContent: `${violationCase.description} ${violationCase.subjectName} ${violationCase.tags.join(' ')}`,
          }
        );
      } catch (error) {
        console.warn(
          `   ⚠️ Failed to index case in OpenSearch: ${violationCase.id}`
        );
      }
    }

    console.log(`✅ Seeded ${sampleViolationCases.length} violation cases`);
  }

  private async seedDocuments(): Promise<void> {
    console.log('📚 Seeding documents...');

    for (const document of sampleDocuments) {
      // Store in DynamoDB
      await this.dynamoClient.send(
        new PutCommand({
          TableName: `${tablePrefix}-documents`,
          Item: document,
        })
      );

      console.log(`   ✓ Created document: ${document.title}`);

      // Index in OpenSearch for full-text search
      try {
        await this.openSearchClient.indexDocument('documents', document.id, {
          ...document,
          // Extract searchable content
          searchableContent: `${document.title} ${document.content}`.substring(
            0,
            5000
          ),
        });
      } catch (error) {
        console.warn(
          `   ⚠️ Failed to index document in OpenSearch: ${document.id}`
        );
      }
    }

    console.log(`✅ Seeded ${sampleDocuments.length} documents`);
  }

  private async seedKnowledgeBase(): Promise<void> {
    console.log('🧠 Seeding knowledge base...');

    const knowledgeBaseItems = [
      {
        id: 'kb_001',
        type: 'guideline',
        title: 'Standard Probation Conditions',
        content:
          'Standard conditions that apply to all probationers including regular reporting, employment requirements, and travel restrictions.',
        category: 'conditions',
        jurisdiction: 'illinois',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        lastModified: '2024-01-01T00:00:00.000Z',
        authority: 'Illinois Department of Corrections',
        tags: ['probation', 'conditions', 'standard'],
      },
      {
        id: 'kb_002',
        type: 'regulation',
        title: 'Violation Response Matrix',
        content:
          'Guidelines for appropriate responses to different types and severities of probation violations.',
        category: 'enforcement',
        jurisdiction: 'illinois',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        lastModified: '2024-01-01T00:00:00.000Z',
        authority: 'Illinois Department of Corrections',
        tags: ['violations', 'sanctions', 'enforcement'],
      },
    ];

    for (const item of knowledgeBaseItems) {
      try {
        await this.openSearchClient.indexDocument(
          'knowledge-base',
          item.id,
          item
        );
        console.log(`   ✓ Created knowledge base item: ${item.title}`);
      } catch (error) {
        console.warn(`   ⚠️ Failed to index knowledge base item: ${item.id}`);
      }
    }

    console.log(`✅ Seeded ${knowledgeBaseItems.length} knowledge base items`);
  }

  async clearAllData(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    // Implementation would scan and delete all items
    // This is a placeholder - in production, you might want batch operations
    console.log('   ⚠️ Clear data functionality not fully implemented');
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};

  // Parse command line arguments
  if (args.includes('--clear')) {
    options.clearExisting = true;
  }
  if (args.includes('--skip-documents')) {
    options.skipDocuments = true;
  }
  if (args.includes('--skip-violations')) {
    options.skipViolations = true;
  }
  if (args.includes('--skip-subjects')) {
    options.skipSubjects = true;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: tsx scripts/seed-data.ts [options]

Options:
  --clear             Clear existing data before seeding
  --skip-documents    Skip seeding documents
  --skip-violations   Skip seeding violation cases
  --skip-subjects     Skip seeding monitoring subjects
  -h, --help         Show this help message

Environment Variables:
  AWS_REGION                    AWS region (default: us-east-1)
  STAGE                        Deployment stage (default: development)
  OPENSEARCH_DOMAIN_ENDPOINT   OpenSearch domain endpoint
    `);
    return;
  }

  const seeder = new DataSeeder();

  if (options.clearExisting) {
    await seeder.clearAllData();
  }

  await seeder.seedAll(options);
}

// Run the seeder
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
