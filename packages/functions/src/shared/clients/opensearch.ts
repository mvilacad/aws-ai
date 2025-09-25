import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';

export interface OpenSearchConfig {
  endpoint: string;
  region: string;
}

export interface SearchResult<T = any> {
  id: string;
  score: number;
  source: T;
  highlight?: Record<string, string[]>;
}

export interface SearchResponse<T = any> {
  hits: SearchResult<T>[];
  total: number;
  maxScore: number;
  took: number;
}

export interface VectorSearchOptions {
  k?: number;
  numCandidates?: number;
  filter?: any;
  includeScore?: boolean;
}

export interface TextSearchOptions {
  from?: number;
  size?: number;
  sort?: Array<Record<string, 'asc' | 'desc'>>;
  highlight?: {
    fields: Record<string, any>;
    pre_tags?: string[];
    post_tags?: string[];
  };
  filter?: any;
}

export class OpenSearchClient {
  private client: Client;

  constructor(config: OpenSearchConfig) {
    this.client = new Client({
      ...AwsSigv4Signer({
        region: config.region,
        service: 'es',
        getCredentials: fromNodeProviderChain(),
      }),
      node: config.endpoint,
    });
  }

  async createIndex(indexName: string, mapping: any): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });

      if (!exists.body) {
        await this.client.indices.create({
          index: indexName,
          body: mapping,
        });
      }
    } catch (error) {
      throw new Error(`Failed to create index ${indexName}: ${error}`);
    }
  }

  async indexDocument(
    indexName: string,
    documentId: string,
    document: any
  ): Promise<void> {
    try {
      await this.client.index({
        index: indexName,
        id: documentId,
        body: document,
        refresh: true,
      });
    } catch (error) {
      throw new Error(`Failed to index document ${documentId}: ${error}`);
    }
  }

  async updateDocument(
    indexName: string,
    documentId: string,
    updates: any
  ): Promise<void> {
    try {
      await this.client.update({
        index: indexName,
        id: documentId,
        body: { doc: updates },
        refresh: true,
      });
    } catch (error) {
      throw new Error(`Failed to update document ${documentId}: ${error}`);
    }
  }

  async deleteDocument(indexName: string, documentId: string): Promise<void> {
    try {
      await this.client.delete({
        index: indexName,
        id: documentId,
        refresh: true,
      });
    } catch (error) {
      throw new Error(`Failed to delete document ${documentId}: ${error}`);
    }
  }

  async getDocument<T = any>(
    indexName: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const response = await this.client.get({
        index: indexName,
        id: documentId,
      });

      return response.body.found ? (response.body._source as T) : null;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'meta' in error &&
        (error as any).meta?.statusCode === 404
      ) {
        return null;
      }
      throw new Error(
        `Failed to get document ${documentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async vectorSearch<T = any>(
    indexName: string,
    queryVector: number[],
    vectorField = 'embedding',
    options: VectorSearchOptions = {}
  ): Promise<SearchResponse<T>> {
    const { k = 10, numCandidates = 50, filter, includeScore = true } = options;

    const query: any = {
      knn: {
        [vectorField]: {
          vector: queryVector,
          k,
          num_candidates: numCandidates,
        },
      },
    };

    if (filter) {
      query.knn[vectorField].filter = filter;
    }

    try {
      const response = await this.client.search({
        index: indexName,
        body: {
          query,
          _source: true,
        },
      });

      return this.formatSearchResponse<T>(response.body, includeScore);
    } catch (error) {
      throw new Error(`Vector search failed: ${error}`);
    }
  }

  async textSearch<T = any>(
    indexName: string,
    searchText: string,
    fields: string[],
    options: TextSearchOptions = {}
  ): Promise<SearchResponse<T>> {
    const { from = 0, size = 10, sort, highlight, filter } = options;

    const query: any = {
      bool: {
        must: [
          {
            multi_match: {
              query: searchText,
              fields,
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ],
      },
    };

    if (filter) {
      query.bool.filter = Array.isArray(filter) ? filter : [filter];
    }

    const body: any = {
      query,
      from,
      size,
      _source: true,
    };

    if (sort) {
      body.sort = sort;
    }

    if (highlight) {
      body.highlight = {
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
        ...highlight,
      };
    }

    try {
      const response = await this.client.search({
        index: indexName,
        body,
      });

      return this.formatSearchResponse<T>(response.body, true);
    } catch (error) {
      throw new Error(`Text search failed: ${error}`);
    }
  }

  async hybridSearch<T = any>(
    indexName: string,
    searchText: string,
    queryVector: number[],
    textFields: string[],
    vectorField = 'embedding',
    options: {
      textWeight?: number;
      vectorWeight?: number;
      k?: number;
      size?: number;
      filter?: any;
    } = {}
  ): Promise<SearchResponse<T>> {
    const {
      textWeight = 0.7,
      vectorWeight = 0.3,
      k = 20,
      size = 10,
      filter,
    } = options;

    const query: any = {
      bool: {
        should: [
          {
            multi_match: {
              query: searchText,
              fields: textFields,
              type: 'best_fields',
              boost: textWeight,
            },
          },
          {
            knn: {
              [vectorField]: {
                vector: queryVector,
                k,
                boost: vectorWeight,
              },
            },
          },
        ],
      },
    };

    if (filter) {
      query.bool.filter = Array.isArray(filter) ? filter : [filter];
    }

    try {
      const response = await this.client.search({
        index: indexName,
        body: {
          query,
          size,
          _source: true,
        },
      });

      return this.formatSearchResponse<T>(response.body, true);
    } catch (error) {
      throw new Error(`Hybrid search failed: ${error}`);
    }
  }

  async aggregateSearch(
    indexName: string,
    aggregations: Record<string, any>,
    filter?: any
  ): Promise<any> {
    const body: any = {
      size: 0,
      aggs: aggregations,
    };

    if (filter) {
      body.query = {
        bool: {
          filter: Array.isArray(filter) ? filter : [filter],
        },
      };
    }

    try {
      const response = await this.client.search({
        index: indexName,
        body,
      });

      return response.body.aggregations;
    } catch (error) {
      throw new Error(`Aggregation search failed: ${error}`);
    }
  }

  async bulkIndex(
    indexName: string,
    documents: Array<{ id: string; doc: any }>
  ): Promise<void> {
    const body = documents.flatMap(({ id, doc }) => [
      { index: { _index: indexName, _id: id } },
      doc,
    ]);

    try {
      const response = await this.client.bulk({
        body,
        refresh: true,
      });

      if (response.body.errors) {
        const errors = response.body.items
          .filter((item: any) => item.index?.error)
          .map((item: any) => item.index.error);
        throw new Error(`Bulk indexing errors: ${JSON.stringify(errors)}`);
      }
    } catch (error) {
      throw new Error(`Bulk indexing failed: ${error}`);
    }
  }

  private formatSearchResponse<T>(
    responseBody: any,
    includeScore: boolean
  ): SearchResponse<T> {
    const hits = responseBody.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: includeScore ? hit._score : undefined,
      source: hit._source,
      highlight: hit.highlight,
    }));

    return {
      hits,
      total: responseBody.hits.total.value || responseBody.hits.total,
      maxScore: responseBody.hits.max_score,
      took: responseBody.took,
    };
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const response = await this.client.cluster.health();
      return {
        status: response.body.status === 'green' ? 'healthy' : 'degraded',
        details: response.body,
      };
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
