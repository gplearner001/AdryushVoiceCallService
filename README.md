# Voice Agent Web Service API

A comprehensive web service API for managing outbound voice calls with AI-powered conversation capabilities using Twilio SIP trunking, AssemblyAI voice models, PipeCat conversation management, and Anthropic Claude LLM.

## Features

- **Outbound Calling**: Initiate phone calls via Twilio SIP trunking
- **AI Voice**: Custom voice synthesis using AssemblyAI models
- **Conversation Management**: Real-time conversation flow with PipeCat
- **Knowledge Base**: Query-based responses using Anthropic Claude
- **Real-time Communication**: WebSocket support for live audio streaming
- **Production Ready**: Comprehensive logging, error handling, and security

## API Endpoints

### Calls
- `POST /api/calls/initiate` - Initiate an outbound call
- `GET /api/calls/:callId/status` - Get call status
- `POST /api/calls/:callId/end` - End an active call

### Voice
- `POST /api/voice/synthesize` - Convert text to speech
- `POST /api/voice/transcribe` - Convert speech to text
- `POST /api/voice/generate-response` - Generate AI response

### Knowledge Base
- `POST /api/knowledge/bases` - Create a knowledge base
- `GET /api/knowledge/bases` - List knowledge bases
- `POST /api/knowledge/bases/:id/query` - Query knowledge base

### WebSocket
- `ws://localhost:3000/ws/voice/:callId` - Real-time voice communication

## Setup

1. Copy `.env.example` to `.env` and configure your API keys:
   ```bash
   cp .env.example .env
   ```

2. Configure the following services:
   - **Twilio**: Account SID, Auth Token, Phone Number, SIP Domain
   - **AssemblyAI**: API Key for voice synthesis and transcription
   - **Anthropic**: API Key for Claude LLM
   - **PipeCat**: API Key and endpoint (if using hosted version)
   - **Webhooks**: For production, set WEBHOOK_BASE_URL to your public domain

3. **For Development Testing**: 
   - The system will work with localhost for basic call testing
   - For full webhook functionality, use ngrok or similar tunneling service:
     ```bash
     # Install ngrok: https://ngrok.com/download
     ngrok http 3000
     # Copy the https URL to NGROK_URL in your .env file
     ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage Examples

### Initiate a Call
```bash
curl -X POST http://localhost:3000/api/calls/initiate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phoneNumber": "+1234567890",
    "knowledgeBaseId": "kb_123",
    "customPrompt": "You are a helpful customer service agent",
    "voiceConfig": {
      "model": "neural",
      "speed": 1.0,
      "pitch": 0
    }
  }'
```

### Create Knowledge Base
```bash
curl -X POST http://localhost:3000/api/knowledge/bases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "Customer Support KB",
    "description": "Knowledge base for customer support",
    "documents": [
      {
        "title": "Product Information",
        "content": "Our products include...",
        "metadata": {"category": "products"}
      }
    ]
  }'
```

## Architecture

The application follows a modular architecture:

- **Routes**: Handle HTTP endpoints and request validation
- **Services**: Encapsulate business logic for each integration
- **WebSocket**: Real-time communication for voice streaming
- **Middleware**: Authentication, error handling, and logging
- **Utils**: Helper functions and validation schemas

## Security

- API key authentication for all endpoints
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Input validation with Joi schemas

## Monitoring

- Comprehensive logging with Winston
- Health check endpoint at `/health`
- Error tracking and reporting
- Performance metrics

## Deployment

The service is ready for production deployment with:
- Environment-based configuration
- Graceful shutdown handling
- Process monitoring support
- Scalable architecture

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure proper error handling