const config = require('../config/config');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    logger.warn('Authentication failed: No API key provided', {
      ip: req.ip,
      path: req.path
    });
    return res.status(401).json({ error: 'API key required' });
  }
  
  if (apiKey !== config.apiKey) {
    logger.warn('Authentication failed: Invalid API key', {
      ip: req.ip,
      path: req.path,
      providedKey: apiKey.substring(0, 8) + '...'
    });
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

module.exports = authMiddleware;