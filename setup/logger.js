import winston from 'winston';
import 'winston-daily-rotate-file';
import chalk from 'chalk';

// Color format for console output
const colorFormat = winston.format.printf(info => {
  const levelColors = {
    error: chalk.red.bold,
    warn: chalk.yellow.bold,
    info: chalk.green.bold,
    debug: chalk.blue.bold,
    verbose: chalk.cyan.bold
  };
  
  const messageColors = {
    error: chalk.red,
    warn: chalk.yellow,
    info: chalk.white,
    debug: chalk.blue,
    verbose: chalk.cyan
  };
  
  const levelColor = levelColors[info.level] || chalk.white.bold;
  const messageColor = messageColors[info.level] || chalk.white;
  
  return `${chalk.green(info.timestamp)} ${levelColor(info.level)}: ${messageColor(info.message)}`;
});

// Plain format for file output
const fileFormat = winston.format.printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        colorFormat
      )
    }),
    
    // File transport without colors
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        fileFormat
      )
    }),
    
    // Separate error log file
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        fileFormat
      )
    })
  ]
});

// Add additional logging for development
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug';
}

export default logger;
