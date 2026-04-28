import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import qs from 'qs';
import tourRouter from './routes/tourRoutes';
import userRouter from './routes/userRoutes';
import AppError from './utils/appError';
import globalErrorHandler from './controllers/errorController';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import sanitizeHtml from 'sanitize-html';

const app = express();

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests from this IP, please try again in an hour' }
});

app.use('/api', limiter);

app.set('query parser', (str: string) => qs.parse(str));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(`${__dirname}/../public`));

// Sanitize request data against XSS
app.use((req: Request, _res: Response, next: NextFunction) => {
  const sanitizeStr = (s: string) => sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} });

  const sanitize = (obj: Record<string, unknown>): void => {
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === 'string') {
        obj[key] = sanitizeStr(val);
      } else if (Array.isArray(val)) {
        val.forEach((item, i) => {
          if (typeof item === 'string') val[i] = sanitizeStr(item);
          else if (typeof item === 'object' && item !== null) sanitize(item as Record<string, unknown>);
        });
      } else if (typeof val === 'object' && val !== null) {
        sanitize(val as Record<string, unknown>);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query as Record<string, unknown>);
  if (req.params) sanitize(req.params as Record<string, unknown>);
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*splat', (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`can't find ${req.originalUrl} on this server`, 404);

  next(err);
});

app.use(globalErrorHandler);

export default app;
