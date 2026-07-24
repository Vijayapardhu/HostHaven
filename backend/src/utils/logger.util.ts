import pino from 'pino';
import { config, isDevelopment } from '../config';

const transport = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

// Paths that must never reach the log sink. Several call sites log whole
// request bodies (platform settings carry provider API keys) and Razorpay
// signatures, so redaction is enforced centrally rather than per call site.
const redactPaths = [
  'body',
  '*.body',
  'body.*',
  'password',
  '*.password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  '*.token',
  'accessToken',
  '*.accessToken',
  'refreshToken',
  '*.refreshToken',
  'signature',
  '*.signature',
  'razorpay_signature',
  '*.razorpay_signature',
  'authorization',
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  'twoFactorSecret',
  'twoFactorBackupCodes',
];

export const logger = pino({
  level: config.logging.level,
  transport,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
