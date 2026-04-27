import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';

const handleCastErrorDB = (err: any) => {
  const message = `invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  const value = err.errmsg.match(/name: "([^"]+)"/)?.[1] || 'unknown';
  const message = `can't insert duplicate value: ${value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((err: any) => err.message);
  const message = 'invalid data input. ' + errors.join('. ');

  return new AppError(message, 400);
};

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  // operational expected error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // programming unknown error

    res.status(500).json({
      status: 'error',
      message: 'something wrong happened!'
    });
  }
};

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    console.log(err);

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError')
      error = new AppError('invalid token. please login again', 401);
    if (err.name === 'TokenExpiredError')
      error = new AppError('your token has expired. please login again', 401);

    sendErrorProd(error, res);
  }
};
