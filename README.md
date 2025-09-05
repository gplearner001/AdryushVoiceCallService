# Voice Agent System

A comprehensive voice agent system with AI-powered conversation capabilities, split into separate frontend and backend applications for easy deployment.

## Architecture

- **Frontend**: Next.js dashboard deployed on Vercel
- **Backend**: Express.js API deployed on Render

## Quick Start

### Backend (Express.js API)
```bash
cd backend
npm install
cp .env.example .env
# Configure your API keys in .env
npm run dev
```

### Frontend (Next.js Dashboard)
```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL
npm run dev
```

## Deployment

### Backend on Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set root directory to `backend`
4. Configure environment variables (see backend/README.md)
5. Deploy

### Frontend on Vercel
1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
4. Deploy

## Environment Variables

### Backend (.env)
```env
PORT=3001
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
API_KEY=your_secure_api_key
WEBHOOK_BASE_URL=https://your-backend.onrender.com
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## Features

### Backend API
- Outbound calling via Twilio
- AI voice synthesis with AssemblyAI
- Conversation management with Claude LLM
- Knowledge base system
- WebSocket support
- Comprehensive logging and monitoring

### Frontend Dashboard
- Real-time API status monitoring
- Call management interface
- Knowledge base visualization
- Responsive design

## API Documentation

See `backend/docs/` for comprehensive API documentation and testing examples.

## Testing

Use the Postman collection in `backend/postman/` for API testing.

## Support

- Backend API: See `backend/README.md`
- Frontend Dashboard: See `frontend/README.md`