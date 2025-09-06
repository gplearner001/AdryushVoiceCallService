const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// POST /api/knowledge/bases - Create a knowledge base
router.post('/bases', async (req, res) => {
  try {
    // Get singleton instance
    const KnowledgeBaseService = require('../services/knowledgeBaseService');
    const knowledgeBaseService = new KnowledgeBaseService();

    const { name, description, documents } = req.body;
    
    if (!name || !documents) {
      return res.status(400).json({
        error: 'Name and documents are required'
      });
    }

    logger.info('Creating knowledge base', {
      name,
      documentCount: documents.length
    });

    const knowledgeBase = await knowledgeBaseService.createKnowledgeBase({
      name,
      description,
      documents
    });

    logger.info('Knowledge base created successfully', {
      id: knowledgeBase.id,
      name,
      documentCount: documents.length
    });

    res.json({
      success: true,
      knowledgeBase
    });

  } catch (error) {
    logger.error('Failed to create knowledge base:', error);
    res.status(500).json({
      error: 'Failed to create knowledge base',
      message: error.message
    });
  }
});

// GET /api/knowledge/bases - List knowledge bases
router.get('/bases', async (req, res) => {
  try {
    // Get singleton instance
    const KnowledgeBaseService = require('../services/knowledgeBaseService');
    const knowledgeBaseService = new KnowledgeBaseService();

    logger.info('Listing knowledge bases');
    
    const knowledgeBases = await knowledgeBaseService.listKnowledgeBases();
    
    logger.info('Knowledge bases listed', {
      count: knowledgeBases.length
    });

    res.json({
      success: true,
      knowledgeBases
    });

  } catch (error) {
    logger.error('Failed to list knowledge bases:', error);
    res.status(500).json({
      error: 'Failed to list knowledge bases',
      message: error.message
    });
  }
});

// GET /api/knowledge/bases/:id - Get a specific knowledge base
router.get('/bases/:id', async (req, res) => {
  try {
    // Get singleton instance
    const KnowledgeBaseService = require('../services/knowledgeBaseService');
    const knowledgeBaseService = new KnowledgeBaseService();

    const { id } = req.params;
    
    logger.info('Getting knowledge base', { id });
    
    const knowledgeBase = await knowledgeBaseService.getKnowledgeBase(id);
    
    if (!knowledgeBase) {
      return res.status(404).json({
        error: 'Knowledge base not found'
      });
    }

    res.json({
      success: true,
      knowledgeBase
    });

  } catch (error) {
    logger.error('Failed to get knowledge base:', error);
    res.status(500).json({
      error: 'Failed to get knowledge base',
      message: error.message
    });
  }
});

// POST /api/knowledge/bases/:id/query - Query a knowledge base
router.post('/bases/:id/query', async (req, res) => {
  try {
    // Get singleton instance
    const KnowledgeBaseService = require('../services/knowledgeBaseService');
    const knowledgeBaseService = new KnowledgeBaseService();

    const { id } = req.params;
    const { query, maxResults = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    logger.info('Querying knowledge base', {
      id,
      query: query.substring(0, 50) + '...',
      maxResults
    });

    const results = await knowledgeBaseService.queryKnowledgeBase(id, query, maxResults);
    
    logger.info('Knowledge base query completed', {
      id,
      resultsFound: results.length
    });

    res.json({
      success: true,
      results,
      query,
      knowledgeBaseId: id
    });

  } catch (error) {
    logger.error('Failed to query knowledge base:', error);
    res.status(500).json({
      error: 'Failed to query knowledge base',
      message: error.message
    });
  }
});

// DELETE /api/knowledge/bases/:id - Delete a knowledge base
router.delete('/bases/:id', async (req, res) => {
  try {
    // Get singleton instance
    const KnowledgeBaseService = require('../services/knowledgeBaseService');
    const knowledgeBaseService = new KnowledgeBaseService();

    const { id } = req.params;
    
    logger.info('Deleting knowledge base', { id });
    
    const deleted = await knowledgeBaseService.deleteKnowledgeBase(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Knowledge base not found'
      });
    }

    res.json({
      success: true,
      message: 'Knowledge base deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete knowledge base:', error);
    res.status(500).json({
      error: 'Failed to delete knowledge base',
      message: error.message
    });
  }
});

module.exports = router;