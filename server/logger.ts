import pino from 'pino';

const redactionPaths = [
  'req.headers.cookie',
  'req.headers.authorization',
  '*.password',
  '*.email',
  '*.userId',
  '*.loginIdentifier',
  '*.recipient'
];

let transport: any;
let destination: any;

if (process.env.LOGFLARE_API_KEY && process.env.LOGFLARE_SOURCE_TOKEN) {
  destination = pino.transport({
    target: 'pino-logflare',
    options: {
      apiKey: process.env.LOGFLARE_API_KEY,
      sourceToken: process.env.LOGFLARE_SOURCE_TOKEN
    }
  });
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: redactionPaths,
    censor: '[REDACTED]'
  },
  transport: destination
    ? undefined
    : process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    : undefined
}, destination);

// Override console methods to use structured logger
console.log = (...args) => logger.info(...args);
console.error = (...args) => logger.error(...args);
console.warn = (...args) => logger.warn(...args);
console.info = (...args) => logger.info(...args);
console.debug = (...args) => logger.debug(...args);

export default logger;
