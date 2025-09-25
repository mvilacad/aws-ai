import { AnalysisResponse } from '@aws-ai/shared';

import { BedrockClient } from '../shared/clients/bedrock';
import { DynamoDBService } from '../shared/clients/dynamodb';
import { logger } from '../shared/utils/logger';

export class AnalysisService {
  private bedrockClient: BedrockClient;
  private dynamoClient: DynamoDBService;

  constructor() {
    this.bedrockClient = new BedrockClient({
      region: process.env.AWS_REGION || 'us-east-1',
      modelId:
        process.env.BEDROCK_MODEL_ID ||
        'anthropic.claude-3-sonnet-20240229-v1:0',
      embeddingModelId:
        process.env.BEDROCK_EMBEDDING_MODEL_ID || 'amazon.titan-embed-text-v1',
    });

    this.dynamoClient = new DynamoDBService({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async analyzeText(
    text: string,
    documentId?: string,
    metadata?: Record<string, unknown>
  ): Promise<AnalysisResponse> {
    const startTime = Date.now();

    try {
      logger.info('Starting text analysis', {
        textLength: text.length,
        documentId,
      });

      // Get context for better analysis
      const context = await this.buildAnalysisContext(documentId, metadata);

      // Analyze for violations using Bedrock
      const analysisResult = await this.bedrockClient.analyzeViolations(
        text,
        context
      );

      const processingTime = Date.now() - startTime;

      const response: AnalysisResponse = {
        violations: analysisResult.violations,
        summary: analysisResult.summary,
        riskScore: analysisResult.riskScore,
        recommendations: analysisResult.recommendations,
        processingTime,
      };

      // Store analysis result if needed
      if (documentId) {
        await this.storeAnalysisResult(documentId, response);
      }

      return response;
    } catch (error) {
      logger.error('Text analysis failed', error as Error, {
        textLength: text.length,
        documentId,
      });
      throw error;
    }
  }

  private async buildAnalysisContext(
    documentId?: string,
    metadata?: Record<string, unknown>
  ): Promise<any> {
    const context: any = {};

    // Add document context if available
    if (documentId) {
      try {
        const document = await this.dynamoClient.get('documents', {
          id: documentId,
        });
        if (document) {
          context.documentInfo = {
            title: document.title,
            contentType: document.contentType,
            tags: document.tags,
          };
        }
      } catch (error) {
        logger.warn('Could not retrieve document context', {
          documentId,
          error: (error as Error).message,
        });
      }
    }

    // Add metadata context
    if (metadata) {
      context.metadata = metadata;
    }

    return context;
  }

  private async storeAnalysisResult(
    documentId: string,
    result: AnalysisResponse
  ): Promise<void> {
    try {
      await this.dynamoClient.update(
        'documents',
        { id: documentId },
        {
          updateExpression:
            'SET analysisResult = :result, analysisTimestamp = :timestamp',
          expressionAttributeValues: {
            ':result': result,
            ':timestamp': new Date().toISOString(),
          },
        }
      );

      logger.debug('Analysis result stored', { documentId });
    } catch (error) {
      logger.warn('Failed to store analysis result', {
        documentId,
        error: (error as Error).message,
      });
    }
  }
}
