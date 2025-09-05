const config = {
  port: process.env.PORT || 9000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Twilio configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    sipDomain: process.env.TWILIO_SIP_DOMAIN
  },
  
  // AssemblyAI configuration
  assemblyAI: {
    apiKey: process.env.ASSEMBLYAI_API_KEY,
    baseUrl: 'https://api.assemblyai.com/v2'
  },
  
  // Anthropic configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-sonnet-20240229',
    maxTokens: 1000
  },
  
  // PipeCat configuration
  pipecat: {
    apiKey: process.env.PIPECAT_API_KEY,
    endpoint: process.env.PIPECAT_ENDPOINT || 'https://api.pipecat.ai'
  },
  
  // Security
  jwtSecret: process.env.JWT_SECRET,
  apiKey: process.env.API_KEY,
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:5173', 'https://your-vercel-app.vercel.app'],
  
  // Webhook configuration
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL || process.env.NGROK_URL || 'https://your-render-app.onrender.com'
};

// Validate required environment variables
const requiredVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 
  'TWILIO_PHONE_NUMBER',
  'API_KEY'
];

// Optional but recommended variables
const optionalVars = [
  'ASSEMBLYAI_API_KEY',
  'ANTHROPIC_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('The application cannot start without these variables.');
  process.exit(1);
}

const missingOptionalVars = optionalVars.filter(varName => !process.env[varName]);
if (missingOptionalVars.length > 0) {
  console.warn(`Missing optional environment variables: ${missingOptionalVars.join(', ')}`);
  console.warn('AI features will use fallback responses.');
}

module.exports = config;