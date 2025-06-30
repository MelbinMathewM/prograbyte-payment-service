import winston from "winston";
import { MongoDB } from "winston-mongodb";
const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return stack 
    ? `[${timestamp}] ${level}: ${message} \nStack Trace: ${stack}` 
    : `[${timestamp}] ${level}: ${message}`;
});

const mongoTransport = new MongoDB({
  db: "mongodb://localhost:27017/logs",
  collection: "course_log_entries",
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
});

// Create Winston logger
const logger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    mongoTransport,
  ],
});

// Handle Uncaught Exceptions & Rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: "logs/exceptions.log" })
);
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

export default logger;
