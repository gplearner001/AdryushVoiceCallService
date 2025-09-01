const express = require('express');
const router = express.Router();
const KnowledgeBaseService = require('../services/knowledgeBaseService');
const logger = require('../utils/logger');

const knowledgeBaseService = new KnowledgeBaseService();

// POST /api/knowledge/bases - Create a knowledge base
router.post('/bases', async (req, res) => {
  try {
    const { name, description, documents } = req.body;
    
    if (!name || !documents) {
      return res.status(400).json({
        error: 'Name and documents are required'
      });
    }

    const knowledgeBase = await knowledgeBaseService.createKnowledgeBase({
      name,
      description,
      documents
    });

    logger.info('Knowledge base created', {
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
    const knowledgeBases = await knowledgeBaseService.listKnowledgeBases();
    
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

// POST /api/knowledge/bases/:id/query - Query a knowledge base
router.post('/bases/:id/query', async (req, res) => {
  try {
    const { id } = req.params;
    const { query, maxResults = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    const results = await knowledgeBaseService.queryKnowledgeBase(id, query, maxResults);
    
    res.json({
      success: true,
      results
    });

  } catch (error) {
    logger.error('Failed to query knowledge base:', error);
    res.status(500).json({
      error: 'Failed to query knowledge base',
      message: error.message
    });
  }
});

module.exports = router;