import rateLimit from "express-rate-limit";
// import {config} from '../src/config/index.js';
import helmet from "helmet";
import morgan from "morgan";
import cors from 'cors';
import logger from '../setup/logger.js';
import { config } from "../src/config/index.js";

export const serverSetup = {
    security: helmet({
        contentSecurityPolicy: {
            directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false
    }),
    limiter: rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        message: {
            success: false,
            error: {
            message: 'Too many requests from this IP, please try again later.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({
            success: false,
            error: {
                message: 'Too many requests from this IP, please try again later.'
            }
            });
        }
    }),
    logging: morgan('combined', {
        stream: {
            write: (message) => {
            logger.info(message.trim());
            }
        },
        skip: (req, res) => {
            return req.url === '/health' && res.statusCode < 400;
        }
    }),
    CORS: cors({
      origin: config.security.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true
    })
};