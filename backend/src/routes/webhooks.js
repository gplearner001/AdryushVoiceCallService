const express = require('express');
const router = express.Router();
const TwilioService = require('../services/twilioService');
const PipeCatService = require('../services/pipecatService');
const CallManager = require('../services/callManager');
const logger = require('../utils/logger');

const twilioService = new TwilioService();
const pipecatService = new PipeCatService();
const callManager = new CallManager();

// POST /api/webhooks/twilio/voice - Handle Twilio voice webhooks
router.post('/twilio/voice', async (req, res) => {
  try {
    const { CallSid, CallStatus, From, To, Digits, SpeechResult } = req.body;
    
    logger.info('Twilio voice webhook received', {
      callSid: CallSid,
      status: CallStatus,
      from: From?.substring(0, 5) + '***',
      to: To?.substring(0, 5) + '***',
      hasDigits: !!Digits,
      hasSpeech: !!SpeechResult
    });

    // Generate TwiML response
    const twiml = twilioService.generateTwiML({
      callId: CallSid,
      streamUrl: `wss://${req.get('host')}/ws/voice/${CallSid}`
    });
    
    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    logger.error('Error handling Twilio webhook:', error);
    
    // Return a simple TwiML response to prevent application error
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I\'m experiencing technical difficulties. Please try calling again later. Goodbye.');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// POST /api/webhooks/twilio/gather - Handle user input from gather
router.post('/twilio/gather', async (req, res) => {
  await handleTwilioGather(req, res);
});

// GET /api/webhooks/twilio/gather - Handle user input from gather (Twilio sometimes uses GET)
router.get('/twilio/gather', async (req, res) => {
  await handleTwilioGather(req, res);
});

async function handleTwilioGather(req, res) {
  try {
    // Handle both POST body and GET query parameters
    const data = req.method === 'POST' ? req.body : req.query;
    const { CallSid, Digits, SpeechResult, callId } = { ...data, ...req.query };
    
    logger.info('Twilio gather webhook received', {
      callSid: CallSid,
      digits: Digits,
      speechResult: SpeechResult,
      method: req.method,
      originalCallId: callId
    });

    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    let userInput = '';
    if (SpeechResult) {
      userInput = SpeechResult;
    } else if (Digits) {
      userInput = `User pressed: ${Digits}`;
    }

    if (userInput) {
      // Find call session - try original callId first, then Twilio SID
      let callSession = null;
      if (callId) {
        callSession = await callManager.getSession(callId);
        logger.info('Found session by original callId', { callId, found: !!callSession });
      }
      
      if (!callSession) {
        callSession = await callManager.getSessionByTwilioSid(CallSid);
        logger.info('Found session by Twilio SID', { CallSid, found: !!callSession });
      }
      
      if (callSession) {
        try {
          const ClaudeService = require('../services/claudeService');
          const claudeService = new ClaudeService();
          
          const response = await claudeService.generateResponse({
            message: userInput,
            context: callSession.conversationHistory,
            knowledgeBaseId: callSession.knowledgeBaseId,
            customPrompt: callSession.customPrompt
          });

          logger.info('AI response generated for call', {
            callId: callSession.callId,
            knowledgeBaseId: callSession.knowledgeBaseId,
            knowledgeBaseUsed: response.knowledgeBaseUsed,
            knowledgeResults: response.knowledgeResults,
            responseLength: response.content.length
          });

          // Add to conversation history
          await callManager.addConversationMessage(callSession.callId, 'user', userInput);
          await callManager.addConversationMessage(callSession.callId, 'assistant', response.content);

          // Respond with AI-generated content
          twiml.say({
            voice: 'Polly.Joanna',
            rate: 'medium'
          }, response.content);

          // Continue the conversation
          const gather = twiml.gather({
            input: 'speech dtmf',
            timeout: 15,
            speechTimeout: 'auto',
            action: `${req.protocol}://${req.get('host')}/api/webhooks/twilio/gather?callId=${callSession.callId}`,
            method: 'POST'
          });
          
          gather.say({
            voice: 'Polly.Joanna'
          }, 'Is there anything else I can help you with?');
          
          // If no response, end the call politely
          twiml.say({
            voice: 'Polly.Joanna'
          }, 'Thank you for calling. Have a great day!');
          twiml.hangup();

        } catch (error) {
          logger.error('Error generating AI response:', error);
          
          if (callSession) {
            // Use fallback response when Claude API fails
            const claudeServiceInstance = new ClaudeService();
            const fallbackResponse = claudeServiceInstance.generateFallbackResponse(userInput);
            logger.warn('Using fallback response due to Claude API error', {
              originalMessage: userInput,
              fallbackResponse,
              knowledgeBaseId: callSession.knowledgeBaseId
            });
            
            twiml.say({
              voice: 'Polly.Joanna'
            }, fallbackResponse);
            
            // Try to continue the conversation even after an error
            const gather = twiml.gather({
              input: 'speech dtmf',
              timeout: 10,
              speechTimeout: 'auto',
              action: `${req.protocol}://${req.get('host')}/api/webhooks/twilio/gather?callId=${callSession.callId}`,
              method: 'POST'
            });
            
            gather.say({
              voice: 'Polly.Joanna'
            }, 'Please try asking your question again.');
            
            twiml.say({
              voice: 'Polly.Joanna'
            }, 'Thank you for calling. Goodbye!');
            twiml.hangup();
          } else {
            // No session found, end call
            twiml.say({
              voice: 'Polly.Joanna'
            }, 'I apologize for the technical difficulty. Please try calling back. Goodbye.');
            twiml.hangup();
          }
        }
      } else {
        // Default response if no session found
        logger.error('No call session found for user input', { CallSid, userInput });
        
        twiml.say({
          voice: 'Polly.Joanna'
        }, 'I apologize, but I\'m having trouble accessing your session. Please try calling back.');
        twiml.hangup();
      }
    } else {
      twiml.say({
        voice: 'Polly.Joanna'
      }, 'I didn\'t catch that. Could you please repeat?');
      
      // Give another chance to respond
      const gather = twiml.gather({
        input: 'speech dtmf',
        timeout: 10,
        speechTimeout: 'auto',
        action: `${req.protocol}://${req.get('host')}/api/webhooks/twilio/gather?callId=${callId || CallSid}`,
        method: 'POST'
      });
      
      gather.say({
        voice: 'Polly.Joanna'
      }, 'Please speak clearly and tell me how I can assist you.');
      
      twiml.say({
        voice: 'Polly.Joanna'
      }, 'Thank you for calling. Goodbye!');
      twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    logger.error('Error handling Twilio gather:', error);
    
    // Fallback TwiML
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say('I apologize for the technical difficulty. Goodbye.');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
}

// POST /api/webhooks/assemblyai - Handle AssemblyAI webhooks
router.post('/assemblyai', async (req, res) => {
  try {
    const { transcript_id, status, text } = req.body;
    
    logger.info('AssemblyAI webhook received', {
      transcriptId: transcript_id,
      status,
      textLength: text?.length
    });

    if (status === 'completed' && text) {
      // Process completed transcription
      await pipecatService.handleTranscription({
        transcriptId: transcript_id,
        text
      });
    }

    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Error handling AssemblyAI webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;