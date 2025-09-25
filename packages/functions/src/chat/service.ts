import { generateId } from "@aws-ai/shared";

import { BedrockClient } from "../shared/clients/bedrock";
import { DynamoDBService } from "../shared/clients/dynamodb";
import { OpenSearchClient } from "../shared/clients/opensearch";
import { AppError, NotFoundError } from "../shared/utils/errors";
import { logger } from "../shared/utils/logger";

export interface ChatSession {
	id: string;
	userId: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	isActive: boolean;
	metadata?: Record<string, unknown>;
}

export interface ChatMessage {
	id: string;
	sessionId: string;
	role: "user" | "assistant";
	content: string;
	timestamp: string;
	metadata?: {
		tokensUsed?: number;
		processingTime?: number;
		sources?: Array<{
			id: string;
			title: string;
			excerpt: string;
			relevance: number;
			source: string;
		}>;
	};
}

export interface ChatResponse {
	message: string;
	sessionId: string;
	sources?: Array<{
		id: string;
		title: string;
		excerpt: string;
		relevance: number;
		source: string;
	}>;
	metadata?: {
		tokensUsed: number;
		processingTime: number;
		confidence: number;
	};
}

export interface PaginationOptions {
	limit?: number;
	lastEvaluatedKey?: Record<string, any>;
}

export interface PaginatedResult<T> {
	items: T[];
	lastEvaluatedKey?: Record<string, any>;
	count: number;
}

export class ChatService {
	private dynamoClient: DynamoDBService;
	private openSearchClient: OpenSearchClient;
	private bedrockClient: BedrockClient;

	constructor() {
		this.dynamoClient = new DynamoDBService({
			region: process.env.AWS_REGION || "us-east-1",
		});

		this.openSearchClient = new OpenSearchClient({
			endpoint: process.env.OPENSEARCH_DOMAIN_ENDPOINT!,
			region: process.env.AWS_REGION || "us-east-1",
		});

		this.bedrockClient = new BedrockClient({
			region: process.env.AWS_REGION || "us-east-1",
			modelId:
				process.env.BEDROCK_MODEL_ID ||
				"anthropic.claude-3-sonnet-20240229-v1:0",
			embeddingModelId:
				process.env.BEDROCK_EMBEDDING_MODEL_ID || "amazon.titan-embed-text-v1",
		});
	}

	async createSession(
		userId: string,
		title: string,
		metadata?: Record<string, unknown>,
	): Promise<ChatSession> {
		const sessionId = generateId("sess");
		const now = new Date().toISOString();

		const session: ChatSession = {
			id: sessionId,
			userId,
			title,
			createdAt: now,
			updatedAt: now,
			isActive: true,
			metadata,
		};

		await this.dynamoClient.put("chat-sessions", session);

		logger.info("Chat session created", { sessionId, userId });

		return session;
	}

	async getSession(sessionId: string, userId: string): Promise<ChatSession> {
		const session = await this.dynamoClient.getChatSession(sessionId);

		if (!session) {
			throw new NotFoundError("Chat session", sessionId);
		}

		if (session.userId !== userId) {
			throw new AppError("FORBIDDEN", "Access denied to this session", 403);
		}

		return session;
	}

	async getUserSessions(
		userId: string,
		options: PaginationOptions = {},
	): Promise<PaginatedResult<ChatSession>> {
		const result = await this.dynamoClient.getUserChatSessions(userId, options);

		return {
			items: result.items,
			lastEvaluatedKey: result.lastEvaluatedKey,
			count: result.count,
		};
	}

	async deleteSession(sessionId: string, userId: string): Promise<void> {
		// Verify ownership
		await this.getSession(sessionId, userId);

		// Mark as inactive instead of deleting
		await this.dynamoClient.update(
			"chat-sessions",
			{ id: sessionId },
			{
				updateExpression: "SET isActive = :false, updatedAt = :updatedAt",
				expressionAttributeValues: {
					":false": false,
					":updatedAt": new Date().toISOString(),
				},
			},
		);

		logger.info("Chat session deactivated", { sessionId, userId });
	}

	async sendMessage(
		sessionId: string,
		userId: string,
		message: string,
		_context?: Record<string, unknown>,
	): Promise<ChatResponse> {
		const startTime = Date.now();

		// Verify session exists and user has access
		const session = await this.getSession(sessionId, userId);

    if (!session.isActive) {
      throw new AppError("INVALID_SESSION", "Cannot send message to inactive session", 400);
    }

		// Store user message
		const userMessageId = generateId("msg");
		const timestamp = new Date().toISOString();

		const userMessage: ChatMessage = {
			id: userMessageId,
			sessionId,
			role: "user",
			content: message,
			timestamp,
		};

		await this.dynamoClient.put("chat-messages", {
			...userMessage,
			timestamp, // Use as sort key
		});

		try {
			// Get conversation history for context
			const messageHistory = await this.getChatHistory(sessionId, 10);

			// Perform RAG search for relevant context
			const searchResults = await this.performRAGSearch(message);

			// Prepare messages for Bedrock
			const messages = this.prepareMessagesForBedrock(
				messageHistory,
				message,
				searchResults,
			);

			// Generate response using Bedrock
			const bedrockResponse = await this.bedrockClient.invokeChat(messages, {
				temperature: 0.7,
				maxTokens: 2000,
			});

			const processingTime = Date.now() - startTime;

			// Store assistant response
			const assistantMessageId = generateId("msg");
			const assistantTimestamp = new Date().toISOString();

			const assistantMessage: ChatMessage = {
				id: assistantMessageId,
				sessionId,
				role: "assistant",
				content: bedrockResponse.content,
				timestamp: assistantTimestamp,
				metadata: {
					tokensUsed:
						bedrockResponse.usage.inputTokens +
						bedrockResponse.usage.outputTokens,
					processingTime,
					sources: searchResults.map((result) => ({
						id: result.id,
						title: result.source.title || "Document",
						excerpt: result.source.content?.substring(0, 200) || "",
						relevance: result.score,
						source: result.source.source || "knowledge_base",
					})),
				},
			};

			await this.dynamoClient.put("chat-messages", {
				...assistantMessage,
				timestamp: assistantTimestamp,
			});

			// Update session timestamp
			await this.dynamoClient.update(
				"chat-sessions",
				{ id: sessionId },
				{
					updateExpression: "SET updatedAt = :updatedAt",
					expressionAttributeValues: {
						":updatedAt": assistantTimestamp,
					},
				},
			);

			// Index conversation for future RAG
			await this.indexConversation(sessionId, userMessage, assistantMessage);

			logger.businessEvent("Chat message processed", {
				sessionId,
				userId,
				processingTime,
				tokensUsed: assistantMessage.metadata?.tokensUsed,
				sourceCount: searchResults.length,
			});

			return {
				message: bedrockResponse.content,
				sessionId,
				sources: assistantMessage.metadata?.sources,
				metadata: {
					tokensUsed: assistantMessage.metadata?.tokensUsed || 0,
					processingTime,
					confidence: 0.85, // Could be calculated based on search relevance
				},
			};
		} catch (error) {
			logger.error("Failed to process chat message", error as Error, {
				sessionId,
				userId,
				messageLength: message.length,
			});
			throw error;
		}
	}

	async getMessages(
		sessionId: string,
		userId: string,
		options: PaginationOptions = {},
	): Promise<PaginatedResult<ChatMessage>> {
		// Verify session access
		await this.getSession(sessionId, userId);

		const result = await this.dynamoClient.getChatMessages(sessionId, options);

		return {
			items: result.items,
			lastEvaluatedKey: result.lastEvaluatedKey,
			count: result.count,
		};
	}

	private async getChatHistory(
		sessionId: string,
		limit = 10,
	): Promise<ChatMessage[]> {
		const result = await this.dynamoClient.getChatMessages(sessionId, {
			limit: limit * 2, // Get more to account for user/assistant pairs
		});

		// Return the most recent messages, but ensure we have complete pairs
		return result.items.slice(-limit);
	}

	private async performRAGSearch(query: string, limit = 5) {
		try {
			// Generate embedding for the query
			const embedding = await this.bedrockClient.generateEmbedding(query);

			// Search for relevant documents
			const searchResults = await this.openSearchClient.hybridSearch(
				"knowledge-base",
				query,
				embedding.embedding,
				["title", "content", "summary"],
				"embedding",
				{
					k: limit,
					size: limit,
				},
			);

			return searchResults.hits;
		} catch (error) {
			logger.warn("RAG search failed, continuing without context", {
				query: query.substring(0, 100),
				error: (error as Error).message,
			});
			return [];
		}
	}

	private prepareMessagesForBedrock(
		history: ChatMessage[],
		currentMessage: string,
		searchResults: any[],
	) {
		const messages = [];

		// Add system message with context
		if (searchResults.length > 0) {
			const context = searchResults
				.map(
					(result) =>
						`${result.source.title}: ${result.source.content?.substring(0, 500)}`,
				)
				.join("\n\n");

			messages.push({
				role: "user" as const,
				content: `Context information:
${context}

Please use this context to help answer questions about probation, violations, and case management. If the context doesn't contain relevant information, you can still provide helpful general guidance.`,
			});

			messages.push({
				role: "assistant" as const,
				content:
					"I understand. I'll use the provided context to help answer questions about probation and case management.",
			});
		}

		// Add conversation history (limit to recent messages to stay within token limits)
		const recentHistory = history.slice(-8); // Last 4 pairs of messages
		for (const msg of recentHistory) {
			messages.push({
				role: msg.role,
				content: msg.content,
			});
		}

		// Add current message
		messages.push({
			role: "user" as const,
			content: currentMessage,
		});

		return messages;
	}

	private async indexConversation(
		sessionId: string,
		userMessage: ChatMessage,
		assistantMessage: ChatMessage,
	): Promise<void> {
		try {
			// Create embeddings for both messages
			const userEmbedding = await this.bedrockClient.generateEmbedding(
				userMessage.content,
			);
			const assistantEmbedding = await this.bedrockClient.generateEmbedding(
				assistantMessage.content,
			);

			// Index user message
			await this.openSearchClient.indexDocument(
				"chat-context",
				userMessage.id,
				{
					...userMessage,
					embedding: userEmbedding.embedding,
				},
			);

			// Index assistant message
			await this.openSearchClient.indexDocument(
				"chat-context",
				assistantMessage.id,
				{
					...assistantMessage,
					embedding: assistantEmbedding.embedding,
				},
			);

			logger.debug("Conversation indexed for RAG", { sessionId });
		} catch (error) {
			logger.warn("Failed to index conversation", {
				sessionId,
				error: (error as Error).message,
			});
		}
	}
}
