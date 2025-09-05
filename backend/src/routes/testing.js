const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const ClaudeService = require('../services/claudeService');
const KnowledgeBaseService = require('../services/knowledgeBaseService');
const logger = require('../utils/logger');

const claudeService = new ClaudeService();
const knowledgeBaseService = new KnowledgeBaseService();

// In-memory session storage for testing
const testingSessions = new Map();

// Validation schema for chat testing
const chatTestSchema = Joi.object({
  message: Joi.string().required(),
  sessionId: Joi.string().allow(null).optional(),
  customPrompt: Joi.string().optional(),
  voiceConfig: Joi.object({
    model: Joi.string().default('neural'),
    speed: Joi.number().min(0.5).max(2.0).default(1.0),
    pitch: Joi.number().min(-20).max(20).default(0)
  }).optional(),
  knowledgeBaseId: Joi.string().optional()
});

// POST /api/testing/chat - Test chat functionality
router.post('/chat', async (req, res) => {
  try {
    const { error, value } = chatTestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    let { message, sessionId, customPrompt, voiceConfig, knowledgeBaseId } = value;

    // Create new session if none provided
    if (!sessionId) {
      sessionId = uuidv4();
      testingSessions.set(sessionId, {
        id: sessionId,
        conversationHistory: [],
        createdAt: new Date(),
        lastActivity: new Date()
      });
      logger.info('Created new testing session', { sessionId });
    }

    // Get or create session
    let session = testingSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        conversationHistory: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      testingSessions.set(sessionId, session);
    }

    // Update last activity
    session.lastActivity = new Date();

    logger.info('Processing test chat message', {
      sessionId,
      messageLength: message.length,
      knowledgeBaseId
    });

    // Generate AI response
    const response = await claudeService.generateResponse({
      message,
      context: session.conversationHistory,
      knowledgeBaseId,
      customPrompt
    });

    // Add to conversation history
    session.conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response.content }
    );

    // Keep only last 20 messages to prevent memory issues
    if (session.conversationHistory.length > 20) {
      session.conversationHistory = session.conversationHistory.slice(-20);
    }

    res.json({
      success: true,
      sessionId,
      response: response.content,
      usage: response.usage,
      conversationLength: session.conversationHistory.length
    });

  } catch (error) {
    logger.error('Failed to process test chat:', error);
    res.status(500).json({
      error: 'Failed to process chat',
      message: error.message
    });
  }
});

// GET /api/testing/sessions - List active testing sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = Array.from(testingSessions.values()).map(session => ({
      id: session.id,
      messageCount: session.conversationHistory.length,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }));

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    logger.error('Failed to list sessions:', error);
    res.status(500).json({
      error: 'Failed to list sessions',
      message: error.message
    });
  }
});

// DELETE /api/testing/sessions/:sessionId - Clear a testing session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const deleted = testingSessions.delete(sessionId);

    if (deleted) {
      logger.info('Testing session deleted', { sessionId });
      res.json({ success: true, message: 'Session deleted' });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }

  } catch (error) {
    logger.error('Failed to delete session:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      message: error.message
    });
  }
});

// GET /api/testing/sessions/:sessionId - Get session details
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = testingSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        conversationHistory: session.conversationHistory,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    });

  } catch (error) {
    logger.error('Failed to get session:', error);
    res.status(500).json({
      error: 'Failed to get session',
      message: error.message
    });
  }
});

module.exports = router;