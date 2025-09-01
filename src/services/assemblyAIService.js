const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class AssemblyAIService {
  constructor() {
    this.apiKey = config.assemblyAI.apiKey;
    this.baseUrl = config.assemblyAI.baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async synthesizeSpeech(text, voiceConfig = {}) {
    try {
      const payload = {
        text,
        voice: voiceConfig.model || 'neural',
        speed: voiceConfig.speed || 1.0,
        pitch: voiceConfig.pitch || 0,
        format: 'wav'
      };

      logger.info('Synthesizing speech with AssemblyAI', {
        textLength: text.length,
        voiceConfig
      });

      const response = await this.client.post('/lemur/v3/generate/speech', payload, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);

    } catch (error) {
      logger.error('AssemblyAI speech synthesis failed:', error);
      throw new Error(`Speech synthesis failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async transcribeAudio(audioUrl) {
    try {
      logger.info('Starting audio transcription', { audioUrl });

      // Upload audio for transcription
      const transcriptResponse = await this.client.post('/transcript', {
        audio_url: audioUrl,
        language_detection: true,
        speech_model: 'best'
      });

      const transcriptId = transcriptResponse.data.id;

      // Poll for completion
      let transcript;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      do {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await this.client.get(`/transcript/${transcriptId}`);
        transcript = statusResponse.data;
        
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Transcription timeout');
        }
      } while (transcript.status === 'processing' || transcript.status === 'queued');

      if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      logger.info('Audio transcription completed', {
        transcriptId,
        confidence: transcript.confidence
      });

      return {
        text: transcript.text,
        confidence: transcript.confidence,
        words: transcript.words
      };

    } catch (error) {
      logger.error('AssemblyAI transcription failed:', error);
      throw new Error(`Transcription failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async createCustomVoice(voiceSamples) {
    try {
      logger.info('Creating custom voice model', {
        sampleCount: voiceSamples.length
      });

      const response = await this.client.post('/lemur/v3/generate/voice/clone', {
        voice_samples: voiceSamples,
        voice_name: `custom_voice_${Date.now()}`
      });

      return response.data;

    } catch (error) {
      logger.error('Custom voice creation failed:', error);
      throw new Error(`Custom voice creation failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

module.exports = AssemblyAIService;