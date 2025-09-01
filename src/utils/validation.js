const Joi = require('joi');

const phoneNumberSchema = Joi.string()
  .pattern(/^\+[1-9]\d{1,14}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)'
  });

const voiceConfigSchema = Joi.object({
  model: Joi.string().valid('neural', 'standard').default('neural'),
  speed: Joi.number().min(0.5).max(2.0).default(1.0),
  pitch: Joi.number().min(-20).max(20).default(0),
  language: Joi.string().default('en-US')
});

const knowledgeBaseSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  documents: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      content: Joi.string().required(),
      metadata: Joi.object().optional()
    })
  ).min(1).required()
});

module.exports = {
  phoneNumberSchema,
  voiceConfigSchema,
  knowledgeBaseSchema
};