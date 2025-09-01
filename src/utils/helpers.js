const crypto = require('crypto');

function generateCallId() {
  return crypto.randomBytes(16).toString('hex');
}

function sanitizePhoneNumber(phoneNumber) {
  // Remove all non-digit characters except + at the beginning
  let sanitized = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!sanitized.startsWith('+')) {
    sanitized = '+' + sanitized;
  }
  
  return sanitized;
}

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function createWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

function validateWebhookSignature(payload, signature, secret) {
  const expectedSignature = createWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

module.exports = {
  generateCallId,
  sanitizePhoneNumber,
  formatDuration,
  createWebhookSignature,
  validateWebhookSignature
};