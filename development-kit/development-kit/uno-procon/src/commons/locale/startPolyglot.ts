import { NextFunction } from 'express';
import * as Polyglot from 'node-polyglot';
import { messages } from './i18n';

export default function (req: any, res: any, next: NextFunction) {
  // Get the locale from express-locale
  const locale = req.locale.language;

  // Start Polyglot and add it to the req
  req.polyglot = new Polyglot();

  // Decide which phrases for polyglot will be used
  switch (locale) {
    case 'jp':
      req.polyglot.extend(messages.jp);
      break;
    default:
      req.polyglot.extend(messages.en);
      break;
  }

  return next();
}
