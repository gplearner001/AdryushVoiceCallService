const twilio = require('twilio');
const config = require('../config/config');
const logger = require('../utils/logger');

class TwilioService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }

  async initiateCall({ to, callId, webhookUrl }) {
    try {
      const isLocalhost = webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1');
      
      let callOptions = {
        from: config.twilio.phoneNumber,
        to: to,
        timeout: 60
      };
      
      if (isLocalhost) {
        // For localhost development, use inline TwiML
        const twiml = this.generateTwiML({ callId, streamUrl: null });
        callOptions.twiml = twiml.toString();
        
        logger.warn('Using interactive TwiML for localhost development', { callId });
      } else {
        // For production with public webhook URL
        callOptions.url = webhookUrl;
        callOptions.method = 'POST';
        callOptions.statusCallback = webhookUrl;
        callOptions.statusCallbackEvent = ['initiated', 'ringing', 'answered', 'completed'];
        callOptions.statusCallbackMethod = 'POST';
      }

      const call = await this.client.calls.create(callOptions);

      logger.info('Twilio call initiated', {
        callId,
        twilioSid: call.sid,
        to: to.substring(0, 5) + '***'
      });

      return call;
    } catch (error) {
      logger.error('Failed to initiate Twilio call:', error);
      throw new Error(`Twilio call failed: ${error.message}`);
    }
  }

  async getCallStatus(callSid) {
    try {
      const call = await this.client.calls(callSid).fetch();
      return {
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime
      };
    } catch (error) {
      logger.error('Failed to get call status:', error);
      throw new Error(`Failed to get call status: ${error.message}`);
    }
  }

  async endCall(callSid) {
    try {
      await this.client.calls(callSid).update({ status: 'completed' });
      logger.info('Call ended via API', { callSid });
    } catch (error) {
      logger.error('Failed to end call:', error);
      throw new Error(`Failed to end call: ${error.message}`);
    }
  }

  generateTwiML({ callId, streamUrl }) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    // Say initial greeting
    twiml.say(
      { voice: 'Polly.Joanna' }, 
      'Hello! I am your AI assistant. I have access to information about our products, pricing, and support. How can I help you today?'
    );

    // Gather input from user
    const gather = twiml.gather({
      input: 'speech dtmf',
      timeout: 15,
      speechTimeout: 'auto',
      action: `${config.webhookBaseUrl}/api/webhooks/twilio/gather?callId=${callId}`,
      method: 'POST'
    });
    
    gather.say(
      { voice: 'Polly.Joanna' }, 
      'Please tell me what you would like to know about our services.'
    );
    
    // If no input received, repeat the prompt
    twiml.say(
      { voice: 'Polly.Joanna' }, 
      'I didn\'t hear anything. Please speak clearly and tell me how I can help you.'
    );
    
    // Give one more chance to respond
    const finalGather = twiml.gather({
      input: 'speech dtmf',
      timeout: 10,
      speechTimeout: 'auto',
      action: `${config.webhookBaseUrl}/api/webhooks/twilio/gather?callId=${callId}`,
      method: 'POST'
    });
    
    finalGather.say(
      { voice: 'Polly.Joanna' }, 
      'Last chance - what can I help you with?'
    );
    
    // If still no response, end politely
    twiml.say(
      { voice: 'Polly.Joanna' }, 
      'I apologize, but I\'m having trouble hearing you. Please try calling back. Goodbye!'
    );
    
    twiml.hangup();

    return twiml;
  }

  generateSimpleTwiML() {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    // Simple greeting for development testing
    twiml.say(
      { voice: 'Polly.Joanna' }, 
      'Hello. This is a test call from your Voice Agent API. The system is working correctly. Thank you for testing. Goodbye.'
    );
    
    twiml.hangup();
    
    return twiml;
  }
}

module.exports = TwilioService;
