import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

export interface BedrockConfig {
  region: string;
  modelId: string;
  embeddingModelId: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export interface EmbeddingResponse {
  embedding: number[];
  usage: {
    inputTokens: number;
  };
}

export class BedrockClient {
  private client: BedrockRuntimeClient;
  private config: BedrockConfig;

  constructor(config: BedrockConfig) {
    this.config = config;
    this.client = new BedrockRuntimeClient({ region: config.region });
  }

  async invokeChat(
    messages: ChatMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      stopSequences?: string[];
    } = {}
  ): Promise<BedrockResponse> {
    const {
      maxTokens = 4000,
      temperature = 0.7,
      topP = 0.9,
      stopSequences = [],
    } = options;

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      stop_sequences: stopSequences,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const command = new InvokeModelCommand({
      modelId: this.config.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body,
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return {
        content: responseBody.content[0].text,
        usage: {
          inputTokens: responseBody.usage.input_tokens,
          outputTokens: responseBody.usage.output_tokens,
        },
        metadata: {
          modelId: this.config.modelId,
          stopReason: responseBody.stop_reason,
        },
      };
    } catch (error) {
      throw new Error(`Bedrock chat invocation failed: ${error}`);
    }
  }

  async invokeChatStream(
    messages: ChatMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      stopSequences?: string[];
    } = {}
  ): Promise<AsyncIterable<string>> {
    const {
      maxTokens = 4000,
      temperature = 0.7,
      topP = 0.9,
      stopSequences = [],
    } = options;

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      stop_sequences: stopSequences,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.config.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body,
    });

    try {
      const response = await this.client.send(command);

      if (!response.body) {
        throw new Error('No response body received');
      }

      return this.processStreamResponse(response.body);
    } catch (error) {
      throw new Error(`Bedrock chat stream invocation failed: ${error}`);
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    const body = JSON.stringify({
      inputText: text,
    });

    const command = new InvokeModelCommand({
      modelId: this.config.embeddingModelId,
      contentType: 'application/json',
      accept: 'application/json',
      body,
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return {
        embedding: responseBody.embedding,
        usage: {
          inputTokens: responseBody.inputTextTokenCount || 0,
        },
      };
    } catch (error) {
      throw new Error(`Bedrock embedding generation failed: ${error}`);
    }
  }

  private async *processStreamResponse(
    stream: AsyncIterable<any>
  ): AsyncIterable<string> {
    for await (const chunk of stream) {
      if (chunk.chunk?.bytes) {
        const chunkData = JSON.parse(
          new TextDecoder().decode(chunk.chunk.bytes)
        );

        if (chunkData.type === 'content_block_delta') {
          yield chunkData.delta.text;
        }
      }
    }
  }

  async analyzeViolations(
    text: string,
    context: {
      subjectInfo?: Record<string, unknown>;
      previousViolations?: string[];
      guidelines?: string;
    } = {}
  ): Promise<{
    violations: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      confidence: number;
      location: {
        start: number;
        end: number;
        text: string;
      };
      suggestedActions: string[];
    }>;
    summary: string;
    riskScore: number;
    recommendations: string[];
  }> {
    const prompt = this.buildViolationAnalysisPrompt(text, context);

    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    const response = await this.invokeChat(messages, {
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 3000,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to parse violation analysis response: ${error}`);
    }
  }

  private buildViolationAnalysisPrompt(
    text: string,
    context: {
      subjectInfo?: Record<string, unknown>;
      previousViolations?: string[];
      guidelines?: string;
    }
  ): string {
    return `
You are an AI assistant specialized in analyzing probation and parole violations. Your task is to analyze the provided text and identify potential violations, assess risk levels, and provide recommendations.

Context Information:
${context.subjectInfo ? `Subject Information: ${JSON.stringify(context.subjectInfo, null, 2)}` : ''}
${context.previousViolations ? `Previous Violations: ${context.previousViolations.join(', ')}` : ''}
${context.guidelines ? `Relevant Guidelines: ${context.guidelines}` : ''}

Text to Analyze:
${text}

Please provide your analysis in the following JSON format:
{
  "violations": [
    {
      "type": "violation category",
      "description": "detailed description of the violation",
      "severity": "low|medium|high|critical",
      "confidence": 0.85,
      "location": {
        "start": 0,
        "end": 50,
        "text": "relevant excerpt from text"
      }
    }
  ],
  "summary": "brief summary of key findings",
  "riskScore": 75,
  "recommendations": [
    "specific recommendation 1",
    "specific recommendation 2"
  ]
}

Guidelines for Analysis:
1. Identify specific violations based on standard probation conditions
2. Assess severity based on potential impact and risk to public safety
3. Provide confidence scores based on clarity of evidence
4. Include specific text excerpts that support your findings
5. Generate risk scores from 0-100 based on violation severity and context
6. Provide actionable recommendations for supervision officers

Return only the JSON response, no additional commentary.
    `.trim();
  }
}
