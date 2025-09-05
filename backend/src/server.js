const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Route imports
const callRoutes = require('./routes/calls');
const voiceRoutes = require('./routes/voice');
const webhookRoutes = require('./routes/webhooks');
const knowledgeRoutes = require('./routes/knowledge');

// WebSocket setup
const { setupWebSocket } = require('./websocket/handler');

const app = express();

// Trust proxy for rate limiting (fixes X-Forwarded-For warning)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/calls', authMiddleware, callRoutes);
app.use('/api/voice', authMiddleware, voiceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/knowledge', authMiddleware, knowledgeRoutes);

// Error handling
app.use(errorHandler);

// Start server  
const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Voice Agent API server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// WebSocket setup
setupWebSocket(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;