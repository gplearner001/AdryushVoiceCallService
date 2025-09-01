const WebSocket = require('ws');
const url = require('url');
const logger = require('../utils/logger');
const CallManager = require('../services/callManager');
const PipeCatService = require('../services/pipecatService');
const AssemblyAIService = require('../services/assemblyAIService');
const ClaudeService = require('../services/claudeService');

const callManager = new CallManager();
const pipecatService = new PipeCatService();
const assemblyAIService = new AssemblyAIService();
const claudeService = new ClaudeService();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    const pathname = url.parse(req.url).pathname;
    const callId = pathname.split('/').pop();

    logger.info('WebSocket connection established', { 
      callId,
      clientIP: req.connection.remoteAddress 
    });

    ws.callId = callId;
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        await handleWebSocketMessage(ws, data);
      } catch (error) {
        logger.error('WebSocket message handling error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket connection closed', { callId });
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      callId,
      message: 'WebSocket connected successfully'
    }));
  });

  // Ping/pong for connection health
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        logger.info('Terminating inactive WebSocket connection', { 
          callId: ws.callId 
        });
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('WebSocket server initialized');
}

async function handleWebSocketMessage(ws, data) {
  let message;
  
  try {
    message = JSON.parse(data);
  } catch (error) {
    // Handle binary audio data
    if (Buffer.isBuffer(data)) {
      await handleAudioStream(ws, data);
      return;
    }
    throw new Error('Invalid message format');
  }

  const { type, payload } = message;

  switch (type) {
    case 'audio_stream':
      await handleAudioStream(ws, Buffer.from(payload.audio, 'base64'));
      break;
      
    case 'text_message':
      await handleTextMessage(ws, payload.text);
      break;
      
    case 'conversation_state':
      await handleConversationState(ws, payload);
      break;
      
    default:
      logger.warn('Unknown WebSocket message type', { type, callId: ws.callId });
  }
}

async function handleAudioStream(ws, audioBuffer) {
  try {
    const callId = ws.callId;
    
    // Process audio through PipeCat pipeline
    const result = await pipecatService.processMessage({
      callId,
      message: null,
      audioBuffer
    });

    // Send response back through WebSocket
    ws.send(JSON.stringify({
      type: 'audio_response',
      payload: {
        text: result.text,
        audio: result.audioBuffer ? result.audioBuffer.toString('base64') : null
      }
    }));

  } catch (error) {
    logger.error('Audio stream handling error:', error);
    throw error;
  }
}

async function handleTextMessage(ws, text) {
  try {
    const callId = ws.callId;
    const session = await callManager.getSession(callId);
    
    if (!session) {
      throw new Error('Call session not found');
    }

    // Generate AI response
    const response = await claudeService.generateResponse({
      message: text,
      context: session.conversationHistory,
      knowledgeBaseId: session.knowledgeBaseId,
      customPrompt: session.customPrompt
    });

    // Add to conversation history
    await callManager.addConversationMessage(callId, 'user', text);
    await callManager.addConversationMessage(callId, 'assistant', response.content);

    // Synthesize speech
    const audioBuffer = await assemblyAIService.synthesizeSpeech(
      response.content,
      session.voiceConfig
    );

    // Send response
    ws.send(JSON.stringify({
      type: 'text_response',
      payload: {
        text: response.content,
        audio: audioBuffer.toString('base64')
      }
    }));

  } catch (error) {
    logger.error('Text message handling error:', error);
    throw error;
  }
}

async function handleConversationState(ws, payload) {
  try {
    const callId = ws.callId;
    
    logger.info('Conversation state update', {
      callId,
      state: payload.state
    });

    // Update session state based on conversation flow
    await callManager.updateSessionStatus(callId, payload.state);

    ws.send(JSON.stringify({
      type: 'state_acknowledged',
      payload: { state: payload.state }
    }));

  } catch (error) {
    logger.error('Conversation state handling error:', error);
    throw error;
  }
}

module.exports = { setupWebSocket };