# API Testing Examples

## Quick Start Testing

### 1. Basic Setup
```bash
# Start the server
npm run dev

# The server will run on http://localhost:3000
```

### 2. Test with cURL

#### Health Check
```bash
curl -X GET http://localhost:3000/health
```

#### Create Knowledge Base
```bash
curl -X POST http://localhost:3000/api/knowledge/bases \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d '{
    "name": "Test KB",
    "description": "Test knowledge base",
    "documents": [
      {
        "title": "Company Info",
        "content": "We are a technology company that provides CRM solutions.",
        "metadata": {"category": "company"}
      }
    ]
  }'
```

#### Initiate Call
```bash
curl -X POST http://localhost:3000/api/calls/initiate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d '{
    "phoneNumber": "+1234567890",
    "customPrompt": "You are a helpful assistant",
    "voiceConfig": {
      "model": "neural",
      "speed": 1.0,
      "pitch": 0
    }
  }'
```

## Postman Environment Variables

Create these variables in your Postman environment:

| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3000` | API base URL |
| `apiKey` | `test-api-key-12345` | Your API key |
| `testPhoneNumber` | `+1234567890` | Test phone number |

## Testing Phone Numbers

For testing purposes, you can use these formats:

### Valid Test Numbers
- `+15551234567` (US format)
- `+442071234567` (UK format)
- `+33123456789` (France format)

### Twilio Test Numbers
If using Twilio's test credentials:
- `+15005550006` (Valid number)
- `+15005550001` (Invalid number)
- `+15005550007` (Busy signal)

## Response Examples

### Successful Call Initiation
```json
{
  "success": true,
  "callId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "twilioCallSid": "CA1234567890abcdef1234567890abcdef",
  "status": "initiated",
  "message": "Call initiated successfully"
}
```

### Call Status Response
```json
{
  "callId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "in-progress",
  "duration": null,
  "startTime": "2025-01-27T10:30:00.000Z",
  "endTime": null
}
```

### Knowledge Base Query Response
```json
{
  "success": true,
  "results": [
    {
      "documentId": "doc-uuid",
      "chunkId": 0,
      "title": "Pricing Plans",
      "content": "We offer three pricing tiers: Basic ($29/month...",
      "score": 2,
      "metadata": {"category": "pricing"}
    }
  ]
}
```

## Error Response Examples

### Authentication Error
```json
{
  "error": "API key required"
}
```

### Validation Error
```json
{
  "error": "Validation Error",
  "details": "Phone number must be in E.164 format (e.g., +1234567890)"
}
```

### Service Error
```json
{
  "error": "Failed to initiate call",
  "message": "Twilio call failed: Invalid phone number"
}
```

## Load Testing

For load testing, you can use Postman's Collection Runner:

1. Set up your collection with all requests
2. Use Collection Runner with multiple iterations
3. Monitor response times and error rates
4. Check server logs for performance metrics

## Integration Testing Workflow

1. **Setup Phase**
   - Health check
   - Create knowledge base
   - Verify knowledge base query

2. **Call Phase**
   - Initiate call
   - Monitor call status
   - Test voice synthesis
   - Test AI response generation

3. **Cleanup Phase**
   - End call
   - Verify call ended
   - Check final status

## WebSocket Testing with Postman

1. Create new WebSocket request in Postman
2. Connect to: `ws://localhost:3000/ws/voice/your-call-id`
3. Send test messages:

```json
{
  "type": "text_message",
  "payload": {
    "text": "Hello, I need help with pricing"
  }
}
```

4. Monitor responses for real-time conversation flow

## Production Testing Considerations

- Use actual phone numbers for end-to-end testing
- Test with different voice configurations
- Verify knowledge base accuracy with various queries
- Test error scenarios and edge cases
- Monitor API rate limits and usage
- Test WebSocket stability under load