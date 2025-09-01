const crypto = require('crypto');
const logger = require('../utils/logger');

const validateTwilioSignature = (req, res, next) => {
  // Skip validation in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  try {
    const twilioSignature = req.headers['x-twilio-signature'];
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    if (!twilioSignature) {
      logger.warn('Missing Twilio signature', { path: req.path });
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha1', authToken)
      .update(url + JSON.stringify(req.body))
      .digest('base64');

    const providedSignature = twilioSignature.replace('sha1=', '');

    if (expectedSignature !== providedSignature) {
      logger.warn('Invalid Twilio signature', { 
        path: req.path,
        expected: expectedSignature.substring(0, 10) + '...',
        provided: providedSignature.substring(0, 10) + '...'
      });
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  } catch (error) {
    logger.error('Error validating Twilio signature:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { validateTwilioSignature };