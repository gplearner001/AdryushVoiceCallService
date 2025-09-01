const express = require('express');
const router = express.Router();
const AssemblyAIService = require('../services/assemblyAIService');
const ClaudeService = require('../services/claudeService');
const logger = require('../utils/logger');

const assemblyAIService = new AssemblyAIService();
const claudeService = new ClaudeService();

// POST /api/voice/synthesize - Convert text to speech
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voiceConfig = {} } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Text is required'
      });
    }

    logger.info('Synthesizing speech', { 
      textLength: text.length,
      voiceConfig 
    });

    const audioBuffer = await assemblyAIService.synthesizeSpeech(text, voiceConfig);
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length
    });
    
    res.send(audioBuffer);

  } catch (error) {
    logger.error('Failed to synthesize speech:', error);
    res.status(500).json({
      error: 'Failed to synthesize speech',
      message: error.message
    });
  }
});

// POST /api/voice/transcribe - Convert speech to text
router.post('/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({
        error: 'Audio URL is required'
      });
    }

    logger.info('Transcribing audio', { audioUrl });

    const transcription = await assemblyAIService.transcribeAudio(audioUrl);
    
    res.json({
      success: true,
      transcription: transcription.text,
      confidence: transcription.confidence
    });

  } catch (error) {
    logger.error('Failed to transcribe audio:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error.message
    });
  }
});

// POST /api/voice/generate-response - Generate AI response
router.post('/generate-response', async (req, res) => {
  try {
    const { message, context, knowledgeBaseId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    logger.info('Generating AI response', { 
      messageLength: message.length,
      knowledgeBaseId 
    });

    const response = await claudeService.generateResponse({
      message,
      context,
      knowledgeBaseId
    });
    
    res.json({
      success: true,
      response: response.content,
      usage: response.usage
    });

  } catch (error) {
    logger.error('Failed to generate response:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      message: error.message
    });
  }
});

module.exports = router;