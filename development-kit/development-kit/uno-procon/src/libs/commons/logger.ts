import sanitize = require('sanitize-filename');
import * as winston from 'winston';

const { format, transports } = winston;

const loggers = {};

export const getLogger = (group: string, name = '') => {
  try {
    const loggerName = sanitize(`${group}_${name}`, { replacement: '_' }).replace(/\s/g, '_');
    const fileName = sanitize(name, { replacement: '_' }).replace(/\s/g, '_');

    if (loggers[loggerName]) {
      return loggers[loggerName];
    }

    switch (group) {
      case 'movie':
        loggers[loggerName] = winston.createLogger({
          level: 'info',
          transports: [
            // new transports.Console({
            //   format: format.combine(
            //     format.timestamp({
            //       format: 'YYYY-MM-DD HH:mm:ss',
            //     }),
            //     format.prettyPrint(),
            //     format.printf(({ level, timestamp, message }) => {
            //       try {
            //         message = JSON.stringify(message, null, 2);
            //       } catch {
            //         // do nothing
            //       }
            //       return `${timestamp}: movie [${level.toUpperCase()}] - ${message}`;
            //     }),
            //   ),
            // }),
            new transports.File({
              filename: `logs/${fileName}.log`,
              format: format.printf(({ message }) => {
                try {
                  message = JSON.stringify(message);
                } catch {
                  // do nothing
                }
                return `${message}`;
              }),
            }),
          ],
        });
        break;
      case 'command':
        loggers[loggerName] = winston.createLogger({
          level: 'info',
          transports: [
            new transports.File({
              filename: `logs/command/${fileName}.log`,
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ timestamp, message }) => {
                  let param = '';
                  try {
                    param = JSON.stringify(message.param);
                  } catch {
                    // do nothing
                  }
                  return `${timestamp} ${message.player} ${message.event} ${param}`;
                }),
              ),
            }),
          ],
        });
        break;
      case 'admin':
        loggers[loggerName] = winston.createLogger({
          level: 'info',
          transports: [
            new transports.Console({
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: admin [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
            new transports.File({
              filename: `logs/admin.log`,
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
          ],
        });
        break;
      case 'guidline':
        loggers[loggerName] = winston.createLogger({
          level: 'debug',
          transports: [
            new transports.Console({
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: guidline [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
            new transports.File({
              filename: `logs/guidline.log`,
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
          ],
        });
        break;
      case 'player':
        loggers[loggerName] = winston.createLogger({
          level: 'debug',
          transports: [
            new transports.File({
              filename: `logs/player/${fileName}.log`,
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
          ],
        });
        break;
      case 'test':
        loggers[loggerName] = winston.createLogger({
          level: 'debug',
          transports: [
            new transports.Console({
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: test [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
            new transports.File({
              filename: `logs/test.log`,
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
          ],
        });
        break;
      default:
        loggers[loggerName] = winston.createLogger({
          level: 'debug',
          transports: [
            new transports.Console({
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: dealer [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
            new transports.File({
              filename: `logs/dealer/${fileName}.log`,
              format: format.combine(
                format.timestamp({
                  format: 'YYYY-MM-DD HH:mm:ss:SSS',
                }),
                format.prettyPrint(),
                format.printf(({ level, timestamp, message }) => {
                  return `${timestamp}: [${level.toUpperCase()}] - ${message}`;
                }),
              ),
            }),
          ],
        });
        break;
    }

    return loggers[loggerName];
  } catch (e) {
    console.log(e);
  }
};
