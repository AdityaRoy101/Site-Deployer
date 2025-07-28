import Joi from 'joi';
import { AppError } from './errorHandler.js';
import path from 'path';

// Sanitize file paths to prevent directory traversal
const sanitizePath = inputPath => {
  if (!inputPath) return inputPath;
  // Remove any attempts at directory traversal
  return path.normalize(inputPath).replace(/^(\.\.[/\\])+/, '');
};

export const deploymentSchema = Joi.object({
  githubUrl: Joi.string()
    .uri()
    .pattern(/^https:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid GitHub URL format. Must be a valid GitHub repository URL.',
      'string.uri': 'Invalid URL format.',
      'any.required': 'GitHub URL is required.'
    }),

  projectName: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .lowercase()
    .required()
    .custom((value, helpers) => {
      // Additional security: prevent reserved names
      const reservedNames = ['admin', 'api', 'www', 'mail', 'root', 'test'];
      if (reservedNames.includes(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'string.alphanum': 'Project name must contain only alphanumeric characters.',
      'string.min': 'Project name must be at least 3 characters long.',
      'string.max': 'Project name must not exceed 50 characters.',
      'any.required': 'Project name is required.',
      'any.invalid': 'Project name cannot use reserved words.'
    }),

  buildCommand: Joi.string()
    .optional()
    .default('npm run build')
    .pattern(/^npm\s+(run\s+)?[a-zA-Z0-9:_-]+$/)
    .messages({
      'string.base': 'Build command must be a string.',
      'string.pattern.base': 'Build command must be a valid npm command.'
    }),

  outputDir: Joi.string()
    .optional()
    .default('build')
    .custom((value, helpers) => {
      const sanitized = sanitizePath(value);
      if (sanitized !== value) {
        return helpers.error('any.invalid');
      }
      return sanitized;
    })
    .messages({
      'string.base': 'Output directory must be a string.',
      'any.invalid': 'Output directory contains invalid characters.'
    }),

  nodeVersion: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .optional()
    .default('18.0.0')
    .messages({
      'string.pattern.base': 'Node version must be in format x.y.z (e.g., 18.0.0).'
    }),

  environmentVariables: Joi.object().pattern(Joi.string(), Joi.string()).optional().messages({
    'object.base': 'Environment variables must be an object with string keys and values.'
  })
});

export const validateDeployment = (req, res, next) => {
  const { error, value } = deploymentSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return next(new AppError(errorMessage, 400));
  }

  req.body = value;
  next();
};

// Generic validation middleware factory
export const validate = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }

    req.body = value;
    next();
  };
};
