const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class KnowledgeBaseService {
  constructor() {
    // Use singleton pattern to ensure shared storage
    if (KnowledgeBaseService.instance) {
      return KnowledgeBaseService.instance;
    }
    
    this.knowledgeBases = new Map();
    KnowledgeBaseService.instance = this;
    
    logger.info('KnowledgeBaseService singleton initialized');
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

      logger.info('Knowledge base created and stored', {
        id,
        name,
        documentCount: documents.length,
        totalKnowledgeBases: this.knowledgeBases.size,
        allIds: Array.from(this.knowledgeBases.keys())
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
      logger.info('Attempting to query knowledge base', {
        knowledgeBaseId,
        query: query.substring(0, 50) + '...',
        maxResults,
        totalKnowledgeBases: this.knowledgeBases.size,
        availableKnowledgeBases: Array.from(this.knowledgeBases.keys()),
        mapSize: this.knowledgeBases.size
      });

      const knowledgeBase = this.knowledgeBases.get(knowledgeBaseId);
      
      if (!knowledgeBase) {
        logger.warn('Knowledge base not found', { 
          knowledgeBaseId,
          availableIds: Array.from(this.knowledgeBases.keys()),
          totalKnowledgeBases: this.knowledgeBases.size,
          mapContents: Array.from(this.knowledgeBases.entries()).map(([id, kb]) => ({ id, name: kb.name }))
        });
        return []; // Return empty results instead of throwing error
      }

      logger.info('Knowledge base found, searching documents', {
        knowledgeBaseId,
        knowledgeBaseName: knowledgeBase.name,
        documentCount: knowledgeBase.documents.length
      });

      // Simple text-based search (in production, use vector embeddings)
      const results = [];
      const queryLower = query.toLowerCase();

      for (const document of knowledgeBase.documents) {
        for (const chunk of document.chunks) {
          const contentLower = chunk.content.toLowerCase();
          
          // Simple relevance scoring
          const queryWords = queryLower.split(' ').filter(word => word.length > 2);
          let score = 0;
          
          for (const word of queryWords) {
            if (contentLower.includes(word)) {
              score += 1;
              // Boost score for exact phrase matches
              if (queryLower.includes(word) && contentLower.includes(queryLower)) {
                score += 2;
              }
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
      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      logger.info('Knowledge base query completed', {
        knowledgeBaseId,
        resultsFound: sortedResults.length,
        topScore: sortedResults.length > 0 ? sortedResults[0].score : 0,
        resultTitles: sortedResults.map(r => r.title)
      });

      return sortedResults;

    } catch (error) {
      logger.error('Failed to query knowledge base:', error);
      return []; // Return empty results instead of throwing error
    }
  }

  async listKnowledgeBases() {
    const knowledgeBasesList = Array.from(this.knowledgeBases.values()).map(kb => ({
      id: kb.id,
      name: kb.name,
      description: kb.description,
      documentCount: kb.documents.length,
      createdAt: kb.createdAt,
      updatedAt: kb.updatedAt
    }));

    logger.info('Listing knowledge bases', {
      count: knowledgeBasesList.length,
      ids: knowledgeBasesList.map(kb => kb.id),
      totalInMap: this.knowledgeBases.size
    });

    return knowledgeBasesList;
  }

  async getKnowledgeBase(knowledgeBaseId) {
    const knowledgeBase = this.knowledgeBases.get(knowledgeBaseId);
    
    logger.info('Getting knowledge base', {
      knowledgeBaseId,
      found: !!knowledgeBase,
      totalKnowledgeBases: this.knowledgeBases.size,
      availableIds: Array.from(this.knowledgeBases.keys())
    });
    
    return knowledgeBase;
  }

  async deleteKnowledgeBase(knowledgeBaseId) {
    const deleted = this.knowledgeBases.delete(knowledgeBaseId);
    
    if (deleted) {
      logger.info('Knowledge base deleted', { 
        knowledgeBaseId,
        remainingCount: this.knowledgeBases.size
      });
    } else {
      logger.warn('Attempted to delete non-existent knowledge base', { 
        knowledgeBaseId,
        availableIds: Array.from(this.knowledgeBases.keys())
      });
    }
    
    return deleted;
  }

  // Debug method to check current state
  getDebugInfo() {
    return {
      totalKnowledgeBases: this.knowledgeBases.size,
      knowledgeBaseIds: Array.from(this.knowledgeBases.keys()),
      knowledgeBases: Array.from(this.knowledgeBases.entries()).map(([id, kb]) => ({
        id,
        name: kb.name,
        documentCount: kb.documents.length
      }))
    };
  }
}

// Ensure singleton instance
KnowledgeBaseService.instance = null;

module.exports = KnowledgeBaseService;