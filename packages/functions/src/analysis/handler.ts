import { AnalysisRequestSchema } from '@aws-ai/shared';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

import {
  createSuccessResponse,
  withErrorHandling,
} from '../shared/utils/errors';
import { logger } from '../shared/utils/logger';
import { validateEventBody } from '../shared/utils/validation';

import { AnalysisService } from './analyzer';

const analysisService = new AnalysisService();

export const handler = withErrorHandling(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const requestId = context.awsRequestId;

    logger.setContext({
      requestId,
      functionName: context.functionName,
      userId: event.requestContext.authorizer?.userId,
    });

    logger.info('Analysis request received');

    const timer = logger.startTimer('Analysis processing');

    try {
      const analysisRequest = validateEventBody(event, AnalysisRequestSchema);

      const result = await analysisService.analyzeText(
        analysisRequest.text,
        analysisRequest.documentId,
        analysisRequest.metadata
      );

      logger.businessEvent('Text analysis completed', {
        textLength: analysisRequest.text.length,
        violationsFound: result.violations.length,
        riskScore: result.riskScore,
        processingTime: result.processingTime,
      });

      return createSuccessResponse(result, 200, requestId);
    } finally {
      timer();
    }
  }
);
