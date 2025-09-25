import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
  BatchGetItemCommand,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommandInput,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';

export interface DynamoDBConfig {
  region: string;
  tablePrefix?: string;
}

export interface PaginationOptions {
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
}

export interface QueryOptions extends PaginationOptions {
  indexName?: string;
  sortAscending?: boolean;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, any>;
}

export interface ScanOptions extends PaginationOptions {
  indexName?: string;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, any>;
}

export interface PaginatedResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
  count: number;
  scannedCount?: number;
}

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tablePrefix: string;

  constructor(config: DynamoDBConfig) {
    const dynamoClient = new DynamoDBClient({ region: config.region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tablePrefix = config.tablePrefix || 'aws-ai';
  }

  private getTableName(tableName: string): string {
    return `${this.tablePrefix}-${tableName}`;
  }

  async get<T = any>(
    tableName: string,
    key: Record<string, any>
  ): Promise<T | null> {
    try {
      const command = new GetCommand({
        TableName: this.getTableName(tableName),
        Key: key,
      });

      const response = await this.client.send(command);
      return (response.Item as T) || null;
    } catch (error) {
      throw new Error(`Failed to get item from ${tableName}: ${error}`);
    }
  }

  async put<T extends Record<string, any> = Record<string, any>>(
    tableName: string,
    item: T,
    options: {
      conditionExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, any>;
    } = {}
  ): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName(tableName),
        Item: item,
        ...options,
      });

      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to put item in ${tableName}: ${error}`);
    }
  }

  async update<T = any>(
    tableName: string,
    key: Record<string, any>,
    updates: {
      updateExpression: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, any>;
      conditionExpression?: string;
    }
  ): Promise<T | null> {
    try {
      const command = new UpdateCommand({
        TableName: this.getTableName(tableName),
        Key: key,
        ReturnValues: 'ALL_NEW',
        ...updates,
      });

      const response = await this.client.send(command);
      return (response.Attributes as T) || null;
    } catch (error) {
      throw new Error(`Failed to update item in ${tableName}: ${error}`);
    }
  }

  async delete(
    tableName: string,
    key: Record<string, any>,
    options: {
      conditionExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, any>;
    } = {}
  ): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.getTableName(tableName),
        Key: key,
        ...options,
      });

      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to delete item from ${tableName}: ${error}`);
    }
  }

  async query<T = any>(
    tableName: string,
    keyConditionExpression: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const params: QueryCommandInput = {
        TableName: this.getTableName(tableName),
        KeyConditionExpression: keyConditionExpression,
        ScanIndexForward: options.sortAscending ?? true,
        ...options,
      };

      if (options.limit) {
        params.Limit = options.limit;
      }

      if (options.lastEvaluatedKey) {
        params.ExclusiveStartKey = options.lastEvaluatedKey;
      }

      if (options.indexName) {
        params.IndexName = options.indexName;
      }

      const response = await this.client.send(new QueryCommand(params));

      return {
        items: response.Items as T[],
        lastEvaluatedKey: response.LastEvaluatedKey,
        count: response.Count || 0,
        scannedCount: response.ScannedCount,
      };
    } catch (error) {
      throw new Error(`Failed to query ${tableName}: ${error}`);
    }
  }

  async scan<T = any>(
    tableName: string,
    options: ScanOptions = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const params: ScanCommandInput = {
        TableName: this.getTableName(tableName),
        ...options,
      };

      if (options.limit) {
        params.Limit = options.limit;
      }

      if (options.lastEvaluatedKey) {
        params.ExclusiveStartKey = options.lastEvaluatedKey;
      }

      if (options.indexName) {
        params.IndexName = options.indexName;
      }

      const response = await this.client.send(new ScanCommand(params));

      return {
        items: response.Items as T[],
        lastEvaluatedKey: response.LastEvaluatedKey,
        count: response.Count || 0,
        scannedCount: response.ScannedCount,
      };
    } catch (error) {
      throw new Error(`Failed to scan ${tableName}: ${error}`);
    }
  }

  async batchGet<T = any>(
    requests: Array<{
      tableName: string;
      keys: Record<string, any>[];
    }>
  ): Promise<Record<string, T[]>> {
    try {
      const RequestItems: Record<string, any> = {};

      for (const request of requests) {
        RequestItems[this.getTableName(request.tableName)] = {
          Keys: request.keys,
        };
      }

      const command = new BatchGetItemCommand({ RequestItems });
      const response = await this.client.send(command);

      const result: Record<string, T[]> = {};
      if (response.Responses) {
        for (const [tableName, items] of Object.entries(response.Responses)) {
          const originalTableName = tableName.replace(
            `${this.tablePrefix}-`,
            ''
          );
          result[originalTableName] = items as T[];
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to batch get items: ${error}`);
    }
  }

  async batchWrite(
    requests: Array<{
      tableName: string;
      putRequests?: any[];
      deleteRequests?: Record<string, any>[];
    }>
  ): Promise<void> {
    try {
      const RequestItems: Record<string, any> = {};

      for (const request of requests) {
        const tableRequests: any[] = [];

        if (request.putRequests) {
          for (const item of request.putRequests) {
            tableRequests.push({ PutRequest: { Item: item } });
          }
        }

        if (request.deleteRequests) {
          for (const key of request.deleteRequests) {
            tableRequests.push({ DeleteRequest: { Key: key } });
          }
        }

        if (tableRequests.length > 0) {
          RequestItems[this.getTableName(request.tableName)] = tableRequests;
        }
      }

      const command = new BatchWriteItemCommand({ RequestItems });
      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to batch write items: ${error}`);
    }
  }

  // Helper methods for common operations
  async getUserById(userId: string) {
    return this.get('users', { id: userId });
  }

  async getUserByEmail(email: string) {
    const result = await this.query('users', 'email = :email', {
      indexName: 'email-index',
      expressionAttributeValues: { ':email': email },
      limit: 1,
    });

    return result.items[0] || null;
  }

  async getChatSession(sessionId: string) {
    return this.get('chat-sessions', { id: sessionId });
  }

  async getUserChatSessions(userId: string, options: PaginationOptions = {}) {
    return this.query('chat-sessions', 'userId = :userId', {
      indexName: 'user-sessions-index',
      expressionAttributeValues: { ':userId': userId },
      sortAscending: false,
      ...options,
    });
  }

  async getChatMessages(sessionId: string, options: PaginationOptions = {}) {
    return this.query('chat-messages', 'sessionId = :sessionId', {
      expressionAttributeValues: { ':sessionId': sessionId },
      sortAscending: true,
      ...options,
    });
  }

  async getViolationCase(caseId: string) {
    return this.get('violation-cases', { id: caseId });
  }

  async getSubjectViolations(
    subjectId: string,
    options: PaginationOptions = {}
  ) {
    return this.query('violation-cases', 'subjectId = :subjectId', {
      indexName: 'subject-violations-index',
      expressionAttributeValues: { ':subjectId': subjectId },
      sortAscending: false,
      ...options,
    });
  }

  async getViolationsByStatus(status: string, options: PaginationOptions = {}) {
    return this.query('violation-cases', '#status = :status', {
      indexName: 'status-severity-index',
      expressionAttributeNames: { '#status': 'status' },
      expressionAttributeValues: { ':status': status },
      sortAscending: false,
      ...options,
    });
  }

  async getMonitoringSubject(subjectId: string) {
    return this.get('monitoring-subjects', { id: subjectId });
  }

  async getOfficerSubjects(officerId: string, options: PaginationOptions = {}) {
    return this.query('monitoring-subjects', 'assignedOfficer = :officerId', {
      indexName: 'officer-subjects-index',
      expressionAttributeValues: { ':officerId': officerId },
      ...options,
    });
  }

  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      // Simple health check - try to get a non-existent item
      await this.get('users', { id: 'health-check' });
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
