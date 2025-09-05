const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class KnowledgeBaseService {
  constructor() {
    this.knowledgeBases = new Map();
  }

  async createKnowledgeBase({ name, description, documents }) {
    try {
      const id = uuidv4();
      
      // Process and index documents
      const processedDocuments = await this.processDocuments(documents);
      
      const knowledgeBase = {
        id,
        name,
        description,
        documents: processedDocuments,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.knowledgeBases.set(id, knowledgeBase);

      logger.info('Knowledge base created', {
        id,
        name,
        documentCount: documents.length
      });

      return knowledgeBase;

    } catch (error) {
      logger.error('Failed to create knowledge base:', error);
      throw new Error(`Knowledge base creation failed: ${error.message}`);
    }
  }

  async processDocuments(documents) {
    // Process documents for better search capability
    return documents.map(doc => ({
      id: uuidv4(),
      title: doc.title || 'Untitled',
      content: doc.content,
      chunks: this.createChunks(doc.content),
      metadata: doc.metadata || {},
      processedAt: new Date()
    }));
  }

  createChunks(content, chunkSize = 500) {
    // Split content into searchable chunks
    const sentences = content.split(/[.!?]+/);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.map((chunk, index) => ({
      id: index,
      content: chunk,
      length: chunk.length
    }));
  }

  async queryKnowledgeBase(knowledgeBaseId, query, maxResults = 5) {
    try {
      const knowledgeBase = this.knowledgeBases.get(knowledgeBaseId);
      
      if (!knowledgeBase) {
        logger.warn('Knowledge base not found', { knowledgeBaseId });
        return []; // Return empty results instead of throwing error
      }

      logger.info('Querying knowledge base', {
        knowledgeBaseId,
        query: query.substring(0, 50) + '...',
        maxResults
      });

      // Simple text-based search (in production, use vector embeddings)
      const results = [];
      const queryLower = query.toLowerCase();

      for (const document of knowledgeBase.documents) {
        for (const chunk of document.chunks) {
          const contentLower = chunk.content.toLowerCase();
          
          // Simple relevance scoring
          const queryWords = queryLower.split(' ');
          let score = 0;
          
          for (const word of queryWords) {
            if (contentLower.includes(word)) {
              score += 1;
            }
          }

          if (score > 0) {
            results.push({
              documentId: document.id,
              chunkId: chunk.id,
              title: document.title,
              content: chunk.content,
              score,
              metadata: document.metadata
            });
          }
        }
      }

      // Sort by relevance and return top results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

    } catch (error) {
      if (error.message === 'Knowledge base not found') {
        logger.warn('Knowledge base not found, returning empty results', { knowledgeBaseId });
        return [];
      }
      logger.error('Failed to query knowledge base:', error);
      return []; // Return empty results instead of throwing error
    }
  }

  async listKnowledgeBases() {
    return Array.from(this.knowledgeBases.values()).map(kb => ({
      id: kb.id,
      name: kb.name,
      description: kb.description,
      documentCount: kb.documents.length,
      createdAt: kb.createdAt,
      updatedAt: kb.updatedAt
    }));
  }

  async deleteKnowledgeBase(knowledgeBaseId) {
    const deleted = this.knowledgeBases.delete(knowledgeBaseId);
    
    if (deleted) {
      logger.info('Knowledge base deleted', { knowledgeBaseId });
    }
    
    return deleted;
  }
}

module.exports = KnowledgeBaseService;