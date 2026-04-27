import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import qs from 'qs';
import tourRouter from './routes/tourRoutes';
import userRouter from './routes/userRoutes';
import AppError from './utils/appError';
import globalErrorHandler from './controllers/errorController';

const app = express();

app.set('query parser', (str: string) => qs.parse(str));
app.use(express.json());
app.use(express.static(`${__dirname}/../public`));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*splat', (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`can't find ${req.originalUrl} on this server`, 404);

  next(err);
});

app.use(globalErrorHandler);

export default app;
