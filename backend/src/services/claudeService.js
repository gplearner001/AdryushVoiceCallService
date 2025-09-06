const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config/config');
const logger = require('../utils/logger');

class ClaudeService {
  constructor() {
    this.anthropic = null;

    if (config.anthropic.apiKey) {
      try {
        this.anthropic = new Anthropic({
          apiKey: config.anthropic.apiKey
        });
        logger.info('Claude service initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Claude service:', error);
        this.anthropic = null;
      }
    } else {
      logger.warn('Anthropic API key not provided - Claude features will use fallback responses');
    }

    // Define model priority (best → fallback)
    this.availableModels = [
      "claude-3-5-sonnet-20241022",    // Latest Sonnet
      "claude-3-sonnet-20240229",      // Stable Sonnet
      "claude-3-haiku-20240307"        // Fastest & cheapest
    ];
  }

  async generateResponse({ message, context = [], knowledgeBaseId, customPrompt }) {
    try {
      // Get singleton instance of knowledge base service
      const KnowledgeBaseService = require('./knowledgeBaseService');
      const knowledgeBaseService = new KnowledgeBaseService();

      if (!this.anthropic) {
        logger.warn('Claude API not available, using fallback response');
        return {
          content: this.generateFallbackResponse(message),
          usage: { input_tokens: 0, output_tokens: 0 },
          knowledgeBaseUsed: false,
          knowledgeResults: 0
        };
      }

      let systemPrompt = `You are a helpful voice assistant having a phone conversation. 
      Keep responses conversational, concise, and natural for spoken interaction. 
      Avoid long explanations unless specifically asked.`;

      if (customPrompt) {
        systemPrompt += `\n\nAdditional instructions: ${customPrompt}`;
      }

      let knowledgeContext = [];
      if (knowledgeBaseId) {
        try {
          logger.info('Querying knowledge base for context', { 
            knowledgeBaseId,
            message: message.substring(0, 50) + '...',
            knowledgeBaseDebug: knowledgeBaseService.getDebugInfo()
          });

          knowledgeContext = await knowledgeBaseService.queryKnowledgeBase(
            knowledgeBaseId,
            message,
            5
          );

          logger.info('Knowledge base query result', {
            knowledgeBaseId,
            resultsFound: knowledgeContext.length,
            hasResults: knowledgeContext.length > 0
          });

          if (knowledgeContext.length > 0) {
            const contextText = knowledgeContext
              .map(item => `${item.title}: ${item.content}`)
              .join('\n\n');

            systemPrompt += `\n\nRelevant information from knowledge base (use this to answer the user's question):\n${contextText}`;
            
            systemPrompt += `\n\nIMPORTANT: Base your response primarily on the knowledge base information provided above. If the user's question relates to the information in the knowledge base, use that information to provide a helpful and accurate answer.`;

            logger.info('Added knowledge base context to system prompt', {
              knowledgeBaseId,
              contextLength: contextText.length,
              resultsUsed: knowledgeContext.length
            });
          } else {
            logger.warn('No relevant knowledge base results found', {
              knowledgeBaseId,
              query: message
            });
            systemPrompt += `\n\nNote: No specific information was found in the knowledge base for this query. Provide a helpful general response and suggest how the user might get more specific information.`;
          }
        } catch (error) {
          logger.warn('Knowledge base query failed, continuing without context', {
            knowledgeBaseId,
            error: error.message
          });
          systemPrompt += `\n\nNote: Unable to access knowledge base at this time. Provide a helpful general response.`;
        }
      }

      const messages = [
        ...context.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];

      logger.info('Generating Claude response', {
        messageLength: message.length,
        contextLength: context.length,
        knowledgeBaseId,
        hasKnowledgeContext: knowledgeContext.length > 0,
        systemPromptLength: systemPrompt.length
      });

      let lastError = null;
      for (const model of this.availableModels) {
        try {
          logger.info(`Trying Claude model: ${model}`);
          const response = await this.anthropic.messages.create({
            model,
            max_tokens: config.anthropic.maxTokens || 500,
            system: systemPrompt,
            messages
          });

          const content = response.content[0].text;

          logger.info('Claude response generated', {
            responseLength: content.length,
            usage: response.usage,
            model,
            usedKnowledgeBase: knowledgeBaseId && knowledgeContext.length > 0
          });

          return {
            content,
            usage: response.usage,
            model,
            knowledgeBaseUsed: knowledgeBaseId && knowledgeContext.length > 0,
            knowledgeResults: knowledgeContext.length
          };
        } catch (error) {
          logger.error(`Model ${model} failed:`, error.message || error);
          lastError = error;
        }
      }

      // If all models fail
      logger.error('All Claude models failed, using fallback response', lastError);
      return {
        content: this.generateFallbackResponse(message, knowledgeContext),
        usage: { input_tokens: 0, output_tokens: 0 },
        knowledgeBaseUsed: knowledgeContext.length > 0,
        knowledgeResults: knowledgeContext.length
      };

    } catch (error) {
      logger.error('Claude API error (outer):', error);
      return {
        content: this.generateFallbackResponse(message),
        usage: { input_tokens: 0, output_tokens: 0 },
        knowledgeBaseUsed: false,
        knowledgeResults: 0
      };
    }
  }

  generateFallbackResponse(message, knowledgeContext = []) {
    const messageLower = message.toLowerCase();

    // If we have knowledge base context, try to use it
    if (knowledgeContext && knowledgeContext.length > 0) {
      const relevantInfo = knowledgeContext[0]; // Use the most relevant result
      return `Based on our information: ${relevantInfo.content.substring(0, 200)}... Is there anything specific about this you'd like to know more about?`;
    }

    // Fallback responses when no knowledge base context
    if (messageLower.includes('pricing') || messageLower.includes('price') || messageLower.includes('cost')) {
      return "I'd be happy to help with pricing information. We offer several plans to meet different needs. Would you like me to connect you with our sales team for detailed pricing?";
    }

    if (messageLower.includes('support') || messageLower.includes('help') || messageLower.includes('problem')) {
      return "I understand you need support. Our team is available 24/7 to help you. Would you like me to transfer you to a support specialist?";
    }

    if (messageLower.includes('product') || messageLower.includes('feature') || messageLower.includes('service')) {
      return "I'd be happy to tell you about our products and services. We offer comprehensive solutions for businesses. What specific area would you like to know more about?";
    }

    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('good')) {
      return "Hello! Thank you for calling. I'm here to help you with any questions about our services. What can I assist you with today?";
    }

    return "I understand you're asking about that. Let me help you - could you please be more specific about what information you need?";
  }

  async generateConversationSummary(conversationHistory) {
    try {
      if (!this.anthropic) {
        return "Conversation summary not available - Claude API not configured";
      }

      const messages = [{
        role: 'user',
        content: `Please provide a brief summary of this phone conversation:\n\n${conversationHistory}`
      }];

      for (const model of this.availableModels) {
        try {
          const response = await this.anthropic.messages.create({
            model,
            max_tokens: 200,
            system: 'You are a helpful assistant that summarizes phone conversations concisely.',
            messages
          });

          return response.content[0].text;
        } catch (error) {
          logger.error(`Summary model ${model} failed:`, error.message || error);
        }
      }

      return "Conversation summary not available due to technical issues";
    } catch (error) {
      logger.error('Failed to generate conversation summary:', error);
      return "Conversation summary not available due to technical issues";
    }
  }
}

module.exports = ClaudeService;