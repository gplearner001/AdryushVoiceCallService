const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class CallManager {
  constructor() {
    this.activeSessions = new Map();
  }

  async createSession({ callId, phoneNumber, knowledgeBaseId, customPrompt, voiceConfig }) {
    try {
      const session = {
        callId,
        phoneNumber,
        knowledgeBaseId,
        customPrompt,
        voiceConfig,
        status: 'initiated',
        startTime: new Date(),
        endTime: null,
        twilioCallSid: null,
        conversationHistory: []
      };

      this.activeSessions.set(callId, session);

      logger.info('Call session created', {
        callId,
        phoneNumber: phoneNumber.substring(0, 5) + '***'
      });

      return session;

    } catch (error) {
      logger.error('Failed to create call session:', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  async getSession(callId) {
    return this.activeSessions.get(callId);
  }

  async getSessionByTwilioSid(twilioCallSid) {
    for (const [callId, session] of this.activeSessions) {
      if (session.twilioCallSid === twilioCallSid) {
        return session;
      }
    }
    
    // If no session found, create a basic one for webhook handling
    logger.warn('No session found for Twilio SID, creating basic session', { twilioCallSid });
    
    const basicSession = {
      callId: twilioCallSid,
      twilioCallSid,
      status: 'active',
      conversationHistory: [],
      knowledgeBaseId: null,
      customPrompt: 'You are a helpful assistant.',
      voiceConfig: { model: 'neural', speed: 1.0, pitch: 0 }
    };
    
    this.activeSessions.set(twilioCallSid, basicSession);
    return basicSession;
  }

  async updateSessionStatus(callId, status) {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.status = status;
      
      if (status === 'active' && !session.activeStartTime) {
        session.activeStartTime = new Date();
      }

      logger.info('Call session status updated', { callId, status });
    }
  }

  async updateTwilioSid(callId, twilioCallSid) {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.twilioCallSid = twilioCallSid;
      
      // Also store by Twilio SID for webhook lookups
      this.activeSessions.set(twilioCallSid, session);
      
      logger.info('Twilio SID updated for session', { callId, twilioCallSid });
    }
  }

  async addConversationMessage(callId, role, content) {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.conversationHistory.push({
        role,
        content,
        timestamp: new Date()
      });
    }
  }

  async endSession(callId) {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      
      const duration = session.endTime - session.startTime;

      logger.info('Call session ended', {
        callId,
        duration,
        messageCount: session.conversationHistory.length
      });

      // Keep session for a while for potential queries
      setTimeout(() => {
        this.activeSessions.delete(callId);
      }, 300000); // 5 minutes
    }
  }

  getActiveSessions() {
    return Array.from(this.activeSessions.values())
      .filter(session => session.status === 'active');
  }

  getSessionStats() {
    const sessions = Array.from(this.activeSessions.values());
    
    return {
      total: sessions.length,
      active: sessions.filter(s => s.status === 'active').length,
      ended: sessions.filter(s => s.status === 'ended').length
    };
  }
}

module.exports = CallManager;