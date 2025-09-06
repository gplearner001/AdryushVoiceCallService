const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const TwilioService = require('../services/twilioService');
const CallManager = require('../services/callManager');
const logger = require('../utils/logger');

// Use singleton instances to ensure shared state
let twilioService, callManager;

function getServices() {
  if (!twilioService) {
    twilioService = new TwilioService();
    callManager = new CallManager();
  }
  return { twilioService, callManager };
}

// Validation schemas
const initiateCallSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  knowledgeBaseId: Joi.string().optional(),
  customPrompt: Joi.string().max(1000).optional(),
  voiceConfig: Joi.object({
    model: Joi.string().default('neural'),
    speed: Joi.number().min(0.5).max(2.0).default(1.0),
    pitch: Joi.number().min(-20).max(20).default(0)
  }).optional()
});

// POST /api/calls/initiate - Initiate an outbound call
router.post('/initiate', async (req, res) => {
  try {
    const { twilioService, callManager } = getServices();
    
    const { error, value } = initiateCallSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    let { phoneNumber, knowledgeBaseId, customPrompt, voiceConfig } = value;
    
    // Auto-select first available knowledge base if none specified
    if (!knowledgeBaseId) {
      try {
        const KnowledgeBaseService = require('../services/knowledgeBaseService');
        const knowledgeBaseService = new KnowledgeBaseService();
        const availableKnowledgeBases = await knowledgeBaseService.listKnowledgeBases();
        
        if (availableKnowledgeBases.length > 0) {
          knowledgeBaseId = availableKnowledgeBases[0].id;
          logger.info('Auto-selected knowledge base for call', {
            knowledgeBaseId,
            knowledgeBaseName: availableKnowledgeBases[0].name
          });
        }
      } catch (error) {
        logger.warn('Failed to auto-select knowledge base:', error.message);
      }
    }
    
    const callId = uuidv4();

    logger.info('Initiating outbound call', {
      callId,
      phoneNumber: phoneNumber.substring(0, 5) + '***',
      knowledgeBaseId
    });

    // Create call session
    const callSession = await callManager.createSession({
      callId,
      phoneNumber,
      knowledgeBaseId,
      customPrompt,
      voiceConfig
    });

    logger.info('Call session created, now initiating Twilio call', {
      callId,
      knowledgeBaseId,
      totalActiveSessions: callManager.activeSessions.size
    });
    // Initiate Twilio call
    const twilioCall = await twilioService.initiateCall({
      to: phoneNumber,
      callId,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/twilio/voice`
    });

    // Update session with Twilio SID
    await callManager.updateTwilioSid(callId, twilioCall.sid);

    logger.info('Call initiated successfully with session', {
      callId,
      twilioCallSid: twilioCall.sid,
      knowledgeBaseId,
      totalActiveSessions: callManager.activeSessions.size
    });
    res.json({
      success: true,
      callId,
      twilioCallSid: twilioCall.sid,
      status: 'initiated',
      message: 'Call initiated successfully'
    });

  } catch (error) {
    logger.error('Failed to initiate call:', error);
    res.status(500).json({
      error: 'Failed to initiate call',
      message: error.message
    });
  }
});

// GET /api/calls/:callId/status - Get call status
router.get('/:callId/status', async (req, res) => {
  try {
    const { twilioService, callManager } = getServices();
    
    const { callId } = req.params;
    const callSession = await callManager.getSession(callId);
    
    if (!callSession) {
      return res.status(404).json({
        error: 'Call not found'
      });
    }

    const twilioStatus = await twilioService.getCallStatus(callSession.twilioCallSid);
    
    res.json({
      callId,
      status: twilioStatus.status,
      duration: twilioStatus.duration,
      startTime: callSession.startTime,
      endTime: callSession.endTime
    });

  } catch (error) {
    logger.error('Failed to get call status:', error);
    res.status(500).json({
      error: 'Failed to get call status',
      message: error.message
    });
  }
});

// POST /api/calls/:callId/end - End an active call
router.post('/:callId/end', async (req, res) => {
  try {
    const { twilioService, callManager } = getServices();
    
    const { callId } = req.params;
    const callSession = await callManager.getSession(callId);
    
    if (!callSession) {
      return res.status(404).json({
        error: 'Call not found'
      });
    }

    await twilioService.endCall(callSession.twilioCallSid);
    await callManager.endSession(callId);

    logger.info('Call ended', { callId });

    res.json({
      success: true,
      message: 'Call ended successfully'
    });

  } catch (error) {
    logger.error('Failed to end call:', error);
    res.status(500).json({
      error: 'Failed to end call',
      message: error.message
    });
  }
});

module.exports = router;