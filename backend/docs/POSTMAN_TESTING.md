# Testing Voice Agent API with Postman

This guide provides step-by-step instructions for testing the Voice Agent API using Postman.

## Prerequisites

1. **Environment Setup**: Copy `.env.example` to `.env` and configure your API keys
2. **Server Running**: Start the server with `npm run dev`
3. **Postman Installed**: Download from [postman.com](https://www.postman.com/downloads/)

## Postman Collection Setup

### 1. Create New Collection
- Open Postman
- Click "New" → "Collection"
- Name it "Voice Agent API"

### 2. Set Collection Variables
Go to your collection → Variables tab and add:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `apiKey` | `your-api-key-here` | `your-api-key-here` |

Replace `your-api-key-here` with the actual API key from your `.env` file.

## API Endpoints Testing

### 1. Health Check

**Request:**
- Method: `GET`
- URL: `{{baseUrl}}/health`
- Headers: None required

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 2. Create Knowledge Base

**Request:**
- Method: `POST`
- URL: `{{baseUrl}}/api/knowledge/bases`
- Headers:
  - `Content-Type`: `application/json`
  - `X-API-Key`: `{{apiKey}}`

**Body (raw JSON):**
```json
{
  "name": "Customer Support KB",
  "description": "Knowledge base for customer support inquiries",
  "documents": [
    {
      "title": "Product Information",
      "content": "Our main product is a cloud-based CRM system that helps businesses manage customer relationships. It includes contact management, sales pipeline tracking, and automated email campaigns. The system supports integrations with popular tools like Slack, Gmail, and Salesforce.",
      "metadata": {
        "category": "products",
        "version": "1.0"
      }
    },
    {
      "title": "Pricing Plans",
      "content": "We offer three pricing tiers: Basic ($29/month for up to 1,000 contacts), Professional ($79/month for up to 10,000 contacts), and Enterprise ($199/month for unlimited contacts). All plans include 24/7 support and a 30-day free trial.",
      "metadata": {
        "category": "pricing",
        "version": "1.0"
      }
    },
    {
      "title": "Support Information",
      "content": "Our support team is available 24/7 via phone, email, and live chat. Phone support: +1-800-555-0123. Email: support@company.com. Live chat is available on our website. We also have a comprehensive help center with tutorials and FAQs.",
      "metadata": {
        "category": "support",
        "version": "1.0"
      }
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "knowledgeBase": {
    "id": "uuid-here",
    "name": "Customer Support KB",
    "description": "Knowledge base for customer support inquiries",
    "documents": [...],
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z"
  }
}
```

**Save the `knowledgeBase.id` from the response - you'll need it for the call initiation.**

### 3. Test Knowledge Base Query

**Request:**
- Method: `POST`
- URL: `{{baseUrl}}/api/knowledge/bases/{{knowledgeBaseId}}/query`
- Headers:
  - `Content-Type`: `application/json`
  - `X-API-Key`: `{{apiKey}}`

**Body (raw JSON):**
```json
{
  "query": "What are your pricing plans?",
  "maxResults": 3
}
```

### 4. Initiate Outbound Call

**Request:**
- Method: `POST`
- URL: `{{baseUrl}}/api/calls/initiate`
- Headers:
  - `Content-Type`: `application/json`
  - `X-API-Key`: `{{apiKey}}`

**Body (raw JSON):**
```json
{
  "phoneNumber": "+1234567890",
  "knowledgeBaseId": "your-knowledge-base-id-here",
  "customPrompt": "You are a friendly customer service representative. Be helpful and professional. Keep responses concise since this is a phone conversation.",
  "voiceConfig": {
    "model": "neural",
    "speed": 1.0,
    "pitch": 0
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "callId": "uuid-here",
  "twilioCallSid": "CA1234567890abcdef",
  "status": "initiated",
  "message": "Call initiated successfully"
}
```

**Save the `callId` from the response for status checking.**

### 5. Check Call Status

**Request:**
- Method: `GET`
- URL: `{{baseUrl}}/api/calls/{{callId}}/status`
- Headers:
  - `X-API-Key`: `{{apiKey}}`

**Expected Response:**
```json
{
  "callId": "uuid-here",
  "status": "in-progress",
  "duration": null,
  "startTime": "2025-01-27T10:30:00.000Z",
  "endTime": null
}
```

### 6. End Call

**Request:**
- Method: `POST`
- URL: `{{baseUrl}}/api/calls/{{callId}}/end`
- Headers:
  - `Content-Type`: `application/json`
  - `X-API-Key`: `{{apiKey}}`

**Expected Response:**
```json
{
  "success": true,
  "message": "Call ended successfully"
}
```

### 7. Test Voice Synthesis

**Request:**
- Method: `POST`
- URL: `{{baseUrl}}/api/voice/synthesize`
- Headers:
  - `Content-Type`: `application/json`
  - `X-API-Key`: `{{apiKey}}`

**Body (raw JSON):**
```json
{
  "text": "Hello! This is a test of the voice synthesis system. How does this sound?",
  "voiceConfig": {
    "model": "neural",
    "speed": 1.0,
    "pitch": 0
  }
}
```

**Expected Response:** Audio file (WAV format)

### 8. Test AI Response Generation

**Request:**
- Method: `POST`
- URL: `{{baseUrl}}/api/voice/generate-response`
- Headers:
  - `Content-Type`: `application/json`
  - `X-API-Key`: `{{apiKey}}`

**Body (raw JSON):**
```json
{
  "message": "What are your pricing plans?",
  "context": [
    {
      "role": "user",
      "content": "Hi, I'm interested in your CRM system"
    },
    {
      "role": "assistant", 
      "content": "Hello! I'd be happy to help you learn about our CRM system. What would you like to know?"
    }
  ],
  "knowledgeBaseId": "your-knowledge-base-id-here"
}
```

## Testing Workflow

### Complete Call Flow Test

1. **Start Server**: `npm run dev`
2. **Health Check**: Verify API is running
3. **Create Knowledge Base**: Set up your knowledge base
4. **Initiate Call**: Start an outbound call
5. **Monitor Status**: Check call progress
6. **End Call**: Terminate when done

### Environment Variables for Testing

Create a `.env` file with these test values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# API Security
API_KEY=test-api-key-12345

# Twilio Configuration (use your actual values)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_SIP_DOMAIN=your-sip-domain.pstn.twilio.com

# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Anthropic Claude Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# PipeCat Configuration (optional)
PIPECAT_API_KEY=your_pipecat_api_key_here
PIPECAT_ENDPOINT=https://api.pipecat.ai

# Security
JWT_SECRET=your-jwt-secret-key-here
```

## Common Testing Scenarios

### Scenario 1: Customer Support Call
```json
{
  "phoneNumber": "+1234567890",
  "knowledgeBaseId": "customer-support-kb-id",
  "customPrompt": "You are a customer support agent. Be helpful, professional, and try to resolve customer issues quickly.",
  "voiceConfig": {
    "model": "neural",
    "speed": 0.9,
    "pitch": -2
  }
}
```

### Scenario 2: Sales Call
```json
{
  "phoneNumber": "+1234567890", 
  "knowledgeBaseId": "sales-kb-id",
  "customPrompt": "You are a sales representative. Be friendly, enthusiastic, and focus on understanding customer needs before presenting solutions.",
  "voiceConfig": {
    "model": "neural",
    "speed": 1.1,
    "pitch": 2
  }
}
```

### Scenario 3: Survey Call
```json
{
  "phoneNumber": "+1234567890",
  "customPrompt": "You are conducting a brief customer satisfaction survey. Ask clear questions and record responses accurately.",
  "voiceConfig": {
    "model": "neural",
    "speed": 1.0,
    "pitch": 0
  }
}
```

## Error Testing

### Test Invalid Phone Number
```json
{
  "phoneNumber": "invalid-number",
  "customPrompt": "Test prompt"
}
```

### Test Missing API Key
Remove the `X-API-Key` header to test authentication.

### Test Invalid Knowledge Base ID
```json
{
  "phoneNumber": "+1234567890",
  "knowledgeBaseId": "non-existent-id"
}
```

## WebSocket Testing

For testing WebSocket connections, you can use Postman's WebSocket feature:

1. Create new WebSocket request
2. URL: `ws://localhost:3000/ws/voice/your-call-id-here`
3. Send test messages:

```json
{
  "type": "text_message",
  "payload": {
    "text": "Hello, can you help me with pricing information?"
  }
}
```

## Monitoring and Debugging

- **Logs**: Check console output for detailed logging
- **Health Endpoint**: Monitor `/health` for service status
- **Error Responses**: All errors include detailed messages
- **Call Status**: Use status endpoint to track call progress

## Production Testing Checklist

- [ ] Health check responds correctly
- [ ] Authentication works with valid/invalid API keys
- [ ] Knowledge base creation and querying
- [ ] Call initiation with valid phone numbers
- [ ] Call status tracking
- [ ] Call termination
- [ ] Voice synthesis functionality
- [ ] AI response generation
- [ ] WebSocket connections
- [ ] Error handling for edge cases
- [ ] Rate limiting behavior
- [ ] CORS configuration

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all required variables are set in `.env`
   - Check variable names match exactly

2. **"Twilio call failed"**
   - Verify Twilio credentials are correct
   - Check phone number format (+1234567890)
   - Ensure SIP domain is properly configured

3. **"AssemblyAI API error"**
   - Verify AssemblyAI API key is valid
   - Check API quota and usage limits

4. **"Claude API error"**
   - Verify Anthropic API key is correct
   - Check API usage limits and billing

5. **WebSocket connection fails**
   - Ensure server is running
   - Check firewall settings
   - Verify WebSocket URL format

### Debug Mode

Set `NODE_ENV=development` in your `.env` file for detailed debug logging.