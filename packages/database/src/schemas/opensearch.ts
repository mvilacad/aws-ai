export interface OpenSearchIndexConfig {
  index: string;
  mappings: {
    properties: Record<string, any>;
  };
  settings: {
    number_of_shards: number;
    number_of_replicas: number;
    index?: Record<string, any>;
  };
}

export const DOCUMENTS_INDEX: OpenSearchIndexConfig = {
  index: 'documents',
  mappings: {
    properties: {
      id: { type: 'keyword' },
      title: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      content: {
        type: 'text',
        analyzer: 'standard',
      },
      contentType: { type: 'keyword' },
      size: { type: 'integer' },
      uploadedBy: { type: 'keyword' },
      uploadedAt: { type: 'date' },
      status: { type: 'keyword' },
      tags: { type: 'keyword' },
      metadata: {
        type: 'object',
        dynamic: true,
      },
      embedding: {
        type: 'knn_vector',
        dimension: 1536,
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'nmslib',
          parameters: {
            ef_construction: 128,
            m: 24,
          },
        },
      },
      extractedText: {
        type: 'text',
        analyzer: 'standard',
      },
      processingMetadata: {
        type: 'object',
        properties: {
          tokensUsed: { type: 'integer' },
          processingTime: { type: 'integer' },
          confidence: { type: 'float' },
          extractedEntities: {
            type: 'nested',
            properties: {
              type: { type: 'keyword' },
              value: { type: 'text' },
              confidence: { type: 'float' },
            },
          },
        },
      },
    },
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    index: {
      knn: true,
      'knn.algo_param.ef_search': 100,
    },
  },
};

export const VIOLATIONS_INDEX: OpenSearchIndexConfig = {
  index: 'violations',
  mappings: {
    properties: {
      id: { type: 'keyword' },
      caseId: { type: 'keyword' },
      subjectId: { type: 'keyword' },
      subjectName: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      description: {
        type: 'text',
        analyzer: 'standard',
      },
      severity: { type: 'keyword' },
      status: { type: 'keyword' },
      detectedAt: { type: 'date' },
      resolvedAt: { type: 'date' },
      assignedTo: { type: 'keyword' },
      tags: { type: 'keyword' },
      riskScore: { type: 'float' },
      riskFactors: {
        type: 'nested',
        properties: {
          factor: { type: 'text' },
          weight: { type: 'float' },
          description: { type: 'text' },
          evidence: { type: 'keyword' },
        },
      },
      violationTypes: {
        type: 'nested',
        properties: {
          type: { type: 'keyword' },
          description: { type: 'text' },
          severity: { type: 'keyword' },
          confidence: { type: 'float' },
        },
      },
      evidence: {
        type: 'nested',
        properties: {
          id: { type: 'keyword' },
          type: { type: 'keyword' },
          source: { type: 'keyword' },
          content: { type: 'text' },
          timestamp: { type: 'date' },
        },
      },
      aiAnalysis: {
        type: 'object',
        properties: {
          confidence: { type: 'float' },
          recommendations: { type: 'text' },
          similarCases: { type: 'keyword' },
          modelVersion: { type: 'keyword' },
          processingTime: { type: 'integer' },
        },
      },
      embedding: {
        type: 'knn_vector',
        dimension: 1536,
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'nmslib',
          parameters: {
            ef_construction: 128,
            m: 24,
          },
        },
      },
    },
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    index: {
      knn: true,
      'knn.algo_param.ef_search': 100,
    },
  },
};

export const CHAT_CONTEXT_INDEX: OpenSearchIndexConfig = {
  index: 'chat-context',
  mappings: {
    properties: {
      id: { type: 'keyword' },
      sessionId: { type: 'keyword' },
      userId: { type: 'keyword' },
      messageId: { type: 'keyword' },
      content: {
        type: 'text',
        analyzer: 'standard',
      },
      role: { type: 'keyword' },
      timestamp: { type: 'date' },
      metadata: {
        type: 'object',
        properties: {
          tokensUsed: { type: 'integer' },
          processingTime: { type: 'integer' },
          confidence: { type: 'float' },
          intentType: { type: 'keyword' },
          entities: {
            type: 'nested',
            properties: {
              type: { type: 'keyword' },
              value: { type: 'text' },
              confidence: { type: 'float' },
            },
          },
        },
      },
      embedding: {
        type: 'knn_vector',
        dimension: 1536,
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'nmslib',
          parameters: {
            ef_construction: 128,
            m: 24,
          },
        },
      },
      contextReferences: {
        type: 'nested',
        properties: {
          documentId: { type: 'keyword' },
          caseId: { type: 'keyword' },
          relevance: { type: 'float' },
          excerpt: { type: 'text' },
        },
      },
    },
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    index: {
      knn: true,
      'knn.algo_param.ef_search': 100,
    },
  },
};

export const KNOWLEDGE_BASE_INDEX: OpenSearchIndexConfig = {
  index: 'knowledge-base',
  mappings: {
    properties: {
      id: { type: 'keyword' },
      type: { type: 'keyword' }, // legal_document, policy, regulation, case_law
      title: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      content: {
        type: 'text',
        analyzer: 'standard',
      },
      summary: {
        type: 'text',
        analyzer: 'standard',
      },
      category: { type: 'keyword' },
      jurisdiction: { type: 'keyword' },
      effectiveDate: { type: 'date' },
      lastModified: { type: 'date' },
      authority: { type: 'keyword' },
      tags: { type: 'keyword' },
      metadata: {
        type: 'object',
        dynamic: true,
      },
      embedding: {
        type: 'knn_vector',
        dimension: 1536,
        method: {
          name: 'hnsw',
          space_type: 'cosinesimil',
          engine: 'nmslib',
          parameters: {
            ef_construction: 128,
            m: 24,
          },
        },
      },
      sections: {
        type: 'nested',
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text' },
          content: { type: 'text' },
          sectionNumber: { type: 'keyword' },
          embedding: {
            type: 'knn_vector',
            dimension: 1536,
            method: {
              name: 'hnsw',
              space_type: 'cosinesimil',
              engine: 'nmslib',
            },
          },
        },
      },
    },
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    index: {
      knn: true,
      'knn.algo_param.ef_search': 100,
    },
  },
};

export const ALL_INDEXES = [
  DOCUMENTS_INDEX,
  VIOLATIONS_INDEX,
  CHAT_CONTEXT_INDEX,
  KNOWLEDGE_BASE_INDEX,
];

export interface VectorSearchQuery {
  index: string;
  knn: {
    field: string;
    query_vector: number[];
    k: number;
    num_candidates?: number;
    filter?: any;
  };
  _source?: string[] | boolean;
  size?: number;
}

export interface TextSearchQuery {
  index: string;
  query: {
    bool?: {
      must?: any[];
      should?: any[];
      filter?: any[];
      must_not?: any[];
    };
    match?: Record<string, any>;
    multi_match?: {
      query: string;
      fields: string[];
      type?: string;
    };
    term?: Record<string, any>;
    range?: Record<string, any>;
  };
  sort?: any[];
  _source?: string[] | boolean;
  size?: number;
  from?: number;
}
