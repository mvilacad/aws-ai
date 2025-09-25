import { ChatRequestSchema } from '@aws-ai/shared';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { z } from 'zod';

import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../shared/utils/errors';
import { logger } from '../shared/utils/logger';
import {
  validateEventBody,
  validatePathParams,
} from '../shared/utils/validation';

import { ChatService } from './service';

const chatService = new ChatService();

const PathParamsSchema = z.object({
  sessionId: z.string().optional(),
});

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

    logger.info('Chat request received', {
      httpMethod: event.httpMethod,
      path: event.path,
    });

    const timer = logger.startTimer('Chat request processing');

    try {
      switch (event.httpMethod) {
        case 'POST':
          if (event.path.endsWith('/chat')) {
            return await handleCreateSession(event, requestId);
          } else if (
            event.path.includes('/chat/') &&
            event.path.endsWith('/messages')
          ) {
            return await handleSendMessage(event, requestId);
          }
          break;

        case 'GET':
          if (
            event.path.includes('/chat/') &&
            event.path.endsWith('/messages')
          ) {
            return await handleGetMessages(event, requestId);
          } else if (event.path.includes('/chat/')) {
            return await handleGetSession(event, requestId);
          } else if (event.path.endsWith('/chat')) {
            return await handleGetSessions(event, requestId);
          }
          break;

        case 'DELETE':
          if (event.path.includes('/chat/')) {
            return await handleDeleteSession(event, requestId);
          }
          break;

        default:
          return createErrorResponse(
            new Error(`Method ${event.httpMethod} not allowed`),
            requestId
          );
      }

      return createErrorResponse(new Error('Route not found'), requestId);
    } finally {
      timer();
    }
  }
);

async function handleCreateSession(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const userId = event.requestContext.authorizer?.userId;
  if (!userId) {
    return createErrorResponse(new Error('User ID required'), requestId);
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const title = body.title || 'New Chat Session';
  const metadata = body.metadata || {};

  const session = await chatService.createSession(userId, title, metadata);

  logger.businessEvent('Chat session created', {
    sessionId: session.id,
    userId,
  });

  return createSuccessResponse(session, 201, requestId);
}

async function handleSendMessage(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const pathParams = validatePathParams(event, PathParamsSchema);
  const chatRequest = validateEventBody(event, ChatRequestSchema);

  const sessionId = pathParams.sessionId || chatRequest.sessionId;
  if (!sessionId) {
    return createErrorResponse(new Error('Session ID required'), requestId);
  }

  const userId = event.requestContext.authorizer?.userId;
  if (!userId) {
    return createErrorResponse(new Error('User ID required'), requestId);
  }

  const response = await chatService.sendMessage(
    sessionId,
    userId,
    chatRequest.message,
    chatRequest.context
  );

  logger.businessEvent('Chat message sent', {
    sessionId,
    userId,
    messageLength: chatRequest.message.length,
    tokensUsed: response.metadata?.tokensUsed,
  });

  return createSuccessResponse(response, 200, requestId);
}

async function handleGetMessages(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const pathParams = validatePathParams(event, PathParamsSchema);
  const sessionId = pathParams.sessionId;

  if (!sessionId) {
    return createErrorResponse(new Error('Session ID required'), requestId);
  }

  const userId = event.requestContext.authorizer?.userId;
  if (!userId) {
    return createErrorResponse(new Error('User ID required'), requestId);
  }

  // Parse pagination parameters
  const limit = parseInt(event.queryStringParameters?.limit || '20');
  const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey
    ? JSON.parse(
        decodeURIComponent(event.queryStringParameters.lastEvaluatedKey)
      )
    : undefined;

  const result = await chatService.getMessages(sessionId, userId, {
    limit,
    lastEvaluatedKey,
  });

  return createSuccessResponse(result, 200, requestId);
}

async function handleGetSession(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const pathParams = validatePathParams(event, PathParamsSchema);
  const sessionId = pathParams.sessionId;

  if (!sessionId) {
    return createErrorResponse(new Error('Session ID required'), requestId);
  }

  const userId = event.requestContext.authorizer?.userId;
  if (!userId) {
    return createErrorResponse(new Error('User ID required'), requestId);
  }

  const session = await chatService.getSession(sessionId, userId);

  return createSuccessResponse(session, 200, requestId);
}

async function handleGetSessions(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const userId = event.requestContext.authorizer?.userId;
  if (!userId) {
    return createErrorResponse(new Error('User ID required'), requestId);
  }

  // Parse pagination parameters
  const limit = parseInt(event.queryStringParameters?.limit || '20');
  const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey
    ? JSON.parse(
        decodeURIComponent(event.queryStringParameters.lastEvaluatedKey)
      )
    : undefined;

  const result = await chatService.getUserSessions(userId, {
    limit,
    lastEvaluatedKey,
  });

  return createSuccessResponse(result, 200, requestId);
}

async function handleDeleteSession(
  event: APIGatewayProxyEvent,
  requestId: string
): Promise<APIGatewayProxyResult> {
  const pathParams = validatePathParams(event, PathParamsSchema);
  const sessionId = pathParams.sessionId;

  if (!sessionId) {
    return createErrorResponse(new Error('Session ID required'), requestId);
  }

  const userId = event.requestContext.authorizer?.userId;
  if (!userId) {
    return createErrorResponse(new Error('User ID required'), requestId);
  }

  await chatService.deleteSession(sessionId, userId);

  logger.businessEvent('Chat session deleted', {
    sessionId,
    userId,
  });

  return createSuccessResponse(null, 204, requestId);
}
