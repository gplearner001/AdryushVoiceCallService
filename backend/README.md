# Voice Agent Backend API

Express.js backend API for managing outbound voice calls with AI-powered conversation capabilities using Twilio SIP trunking, AssemblyAI voice models, PipeCat conversation management, and Anthropic Claude LLM.

## Features

- **Outbound Calling**: Initiate phone calls via Twilio SIP trunking
- **AI Voice**: Custom voice synthesis using AssemblyAI models
- **Conversation Management**: Real-time conversation flow with PipeCat
- **Knowledge Base**: Query-based responses using Anthropic Claude
- **Real-time Communication**: WebSocket support for live audio streaming
- **Production Ready**: Comprehensive logging, error handling, and security

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your API keys in .env file

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001`.

## Environment Variables

Configure these in your `.env` file:

### Required
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number
- `API_KEY`: API key for authentication

### Optional (for AI features)
- `ASSEMBLYAI_API_KEY`: AssemblyAI API key for voice synthesis
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude LLM
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## API Endpoints

### Health Check
- `GET /health` - Check API status

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
- `ws://localhost:3001/ws/voice/:callId` - Real-time voice communication

## Deployment on Render

### 1. Connect Repository
- Connect your GitHub repository to Render
- Select the `backend` folder as the root directory

### 2. Environment Variables
Set these in Render's environment variables:

```env
PORT=10000
NODE_ENV=production
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
API_KEY=your_secure_api_key
WEBHOOK_BASE_URL=https://your-app-name.onrender.com
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

### 3. Build Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `backend`

### 4. Health Check
Render will automatically monitor: `https://your-app.onrender.com/health`

## Testing

Use the included Postman collection in the `postman/` directory for comprehensive API testing.

### Quick Test
```bash
# Health check
curl https://your-app.onrender.com/health

# Create knowledge base
curl -X POST https://your-app.onrender.com/api/knowledge/bases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "Test KB", "documents": [{"title": "Test", "content": "Test content"}]}'
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── websocket/
│   └── server.js
├── docs/
├── postman/
├── scripts/
├── logs/
├── package.json
└── .env.example
```

## Security Features

- API key authentication
- Rate limiting
- CORS configuration
- Helmet.js security headers
- Input validation with Joi
- Webhook signature validation

## Monitoring

- Winston logging
- Health check endpoint
- Error tracking
- Performance metrics

## Support

For issues and questions, check the documentation in the `docs/` directory or refer to the API testing examples.