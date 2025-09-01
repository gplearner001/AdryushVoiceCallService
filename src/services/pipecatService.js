const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class PipeCatService {
  constructor() {
    this.apiKey = config.pipecat.apiKey;
    this.endpoint = config.pipecat.endpoint;
    this.activeConversations = new Map();
  }

  async initializeConversation({ callId, knowledgeBaseId, customPrompt }) {
    try {
      logger.info('Initializing PipeCat conversation', { 
        callId, 
        knowledgeBaseId 
      });

      const conversationConfig = {
        callId,
        pipeline: {
          input: 'audio_stream',
          processors: [
            {
              type: 'speech_to_text',
              provider: 'assemblyai'
            },
            {
              type: 'llm',
              provider: 'anthropic',
              config: {
                model: config.anthropic.model,
                systemPrompt: customPrompt || 'You are a helpful voice assistant.',
                knowledgeBaseId
              }
            },
            {
              type: 'text_to_speech',
              provider: 'assemblyai'
            }
          ],
          output: 'audio_stream'
        }
      };

      // Store conversation configuration
      this.activeConversations.set(callId, {
        config: conversationConfig,
        startTime: new Date(),
        messages: []
      });

      return conversationConfig;

    } catch (error) {
      logger.error('Failed to initialize PipeCat conversation:', error);
      throw new Error(`PipeCat initialization failed: ${error.message}`);
    }
  }

  async processMessage({ callId, message, audioBuffer }) {
    try {
      const conversation = this.activeConversations.get(callId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      logger.info('Processing message with PipeCat', {
        callId,
        messageLength: message?.length
      });

      // Add message to conversation history
      conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // In a real implementation, this would integrate with PipeCat's actual API
      // For now, we'll simulate the pipeline processing
      const processedResponse = await this.simulatePipeline({
        message,
        audioBuffer,
        config: conversation.config
      });

      // Add response to conversation history
      conversation.messages.push({
        role: 'assistant',
        content: processedResponse.text,
        timestamp: new Date()
      });

      return processedResponse;

    } catch (error) {
      logger.error('Failed to process message with PipeCat:', error);
      throw new Error(`PipeCat processing failed: ${error.message}`);
    }
  }

  async simulatePipeline({ message, audioBuffer, config }) {
    // This is a simulation of PipeCat's pipeline processing
    // In a real implementation, you would use PipeCat's actual API
    
    return {
      text: `I understand you said: "${message}". How can I assist you further?`,
      audioBuffer: null, // Would contain synthesized audio
      processingTime: Date.now()
    };
  }

  async handleTranscription({ transcriptId, text }) {
    try {
      // Find the conversation associated with this transcription
      // This would typically be tracked via transcript metadata
      logger.info('Handling transcription from AssemblyAI', {
        transcriptId,
        textLength: text.length
      });

      // Process the transcription through the conversation pipeline
      // Implementation would depend on your specific PipeCat setup

    } catch (error) {
      logger.error('Failed to handle transcription:', error);
      throw new Error(`Transcription handling failed: ${error.message}`);
    }
  }

  async endConversation(callId) {
    try {
      const conversation = this.activeConversations.get(callId);
      
      if (conversation) {
        const duration = Date.now() - conversation.startTime.getTime();
        
        logger.info('Ending PipeCat conversation', {
          callId,
          duration,
          messageCount: conversation.messages.length
        });

        // Clean up resources
        this.activeConversations.delete(callId);
      }

    } catch (error) {
      logger.error('Failed to end conversation:', error);
      throw new Error(`Failed to end conversation: ${error.message}`);
    }
  }

  getConversationHistory(callId) {
    const conversation = this.activeConversations.get(callId);
    return conversation ? conversation.messages : [];
  }
}

module.exports = PipeCatService;