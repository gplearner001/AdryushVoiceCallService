const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class CallManager {
  constructor() {
    // Use singleton pattern to ensure shared storage across all instances
    if (CallManager.instance) {
      return CallManager.instance;
    }
    
    this.activeSessions = new Map();
    CallManager.instance = this;
    
    logger.info('CallManager singleton initialized');
  }

  async createSession({ callId, phoneNumber, knowledgeBaseId, customPrompt, voiceConfig }) {
    try {
      const session = {
        callId,
        phoneNumber,
        knowledgeBaseId,
        customPrompt,
        voiceConfig: voiceConfig || {
          model: 'neural',
          speed: 1.0,
          pitch: 0
        },
        status: 'initiated',
        conversationHistory: [],
        startTime: new Date(),
        endTime: null,
        twilioCallSid: null
      };

      this.activeSessions.set(callId, session);

      logger.info('Call session created', {
        callId,
        phoneNumber: phoneNumber.substring(0, 5) + '***',
        knowledgeBaseId,
        totalActiveSessions: this.activeSessions.size,
        allSessionIds: Array.from(this.activeSessions.keys())
      });

      return session;
    } catch (error) {
      logger.error('Failed to create call session:', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  async getSession(callId) {
    const session = this.activeSessions.get(callId);
    logger.debug('Getting session by callId', {
      callId,
      found: !!session,
      totalSessions: this.activeSessions.size,
      allKeys: Array.from(this.activeSessions.keys())
    });
    return session || null;
  }

  async getSessionByTwilioSid(twilioSid) {
    logger.debug('Looking for session by Twilio SID', {
      twilioSid,
      totalSessions: this.activeSessions.size,
      allKeys: Array.from(this.activeSessions.keys())
    });
    
    for (const session of this.activeSessions.values()) {
      if (session.twilioCallSid === twilioSid) {
        logger.info('Found session by Twilio SID', {
          twilioSid,
          callId: session.callId,
          knowledgeBaseId: session.knowledgeBaseId
        });
        return session;
      }
    }
    
    logger.warn('No session found for Twilio SID', {
      twilioSid,
      availableSessions: Array.from(this.activeSessions.values()).map(s => ({
        callId: s.callId,
        twilioSid: s.twilioCallSid,
        knowledgeBaseId: s.knowledgeBaseId
      }))
    });
    return null;
  }

  async updateTwilioSid(callId, twilioSid) {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.twilioCallSid = twilioSid;
      logger.info('Updated Twilio SID for session', { 
        callId, 
        twilioSid,
        knowledgeBaseId: session.knowledgeBaseId,
        totalActiveSessions: this.activeSessions.size
      });
    } else {
      logger.error('Failed to update Twilio SID - session not found', {
        callId,
        twilioSid,
        availableSessions: Array.from(this.activeSessions.keys())
      });
    }
  }

  async updateSessionStatus(callId, status) {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.status = status;
      session.lastActivity = new Date();
      
      if (status === 'completed' || status === 'ended') {
        session.endTime = new Date();
      }

      logger.info('Session status updated', { callId, status });
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

      // Keep only last 50 messages to prevent memory issues
      if (session.conversationHistory.length > 50) {
        session.conversationHistory = session.conversationHistory.slice(-50);
      }

      session.lastActivity = new Date();
      
      logger.debug('Added conversation message', {
        callId,
        role,
        messageLength: content.length,
        totalMessages: session.conversationHistory.length
      });
    }
  }

  async endSession(callId) {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      
      const duration = session.endTime.getTime() - session.startTime.getTime();
      
      logger.info('Call session ended', {
        callId,
        duration: Math.round(duration / 1000) + 's',
        messageCount: session.conversationHistory.length
      });

      // Keep session for a while for status queries, then clean up
      setTimeout(() => {
        this.activeSessions.delete(callId);
        logger.debug('Session cleaned up', { callId });
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  async getAllActiveSessions() {
    return Array.from(this.activeSessions.values()).filter(
      session => session.status !== 'ended' && session.status !== 'completed'
    );
  }

  async getSessionStats(callId) {
    const session = this.activeSessions.get(callId);
    if (!session) return null;

    const now = new Date();
    const duration = session.endTime ? 
      session.endTime.getTime() - session.startTime.getTime() :
      now.getTime() - session.startTime.getTime();

    return {
      callId,
      status: session.status,
      duration: Math.round(duration / 1000),
      messageCount: session.conversationHistory.length,
      startTime: session.startTime,
      endTime: session.endTime,
      lastActivity: session.lastActivity || session.startTime
    };
  }

  // Cleanup old sessions periodically
  startCleanupTimer() {
    setInterval(() => {
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const [callId, session] of this.activeSessions.entries()) {
        const age = now.getTime() - session.startTime.getTime();
        
        if (age > maxAge) {
          this.activeSessions.delete(callId);
          logger.info('Cleaned up old session', { callId, age: Math.round(age / 1000 / 60) + 'm' });
        }
      }
    }, 60 * 60 * 1000); // Run every hour
  }
}

// Ensure singleton instance
CallManager.instance = null;

module.exports = CallManager;