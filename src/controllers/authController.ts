import { promisify } from 'util';
import catchAsync from '../utils/catchAsync';
import User from '../models/userModel';
import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import AppError from '../utils/appError';
import { Types } from 'mongoose';
import sendMail from '../utils/email';
import crypto from 'crypto';

export const signup = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: Function): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError('Please provide email and password', 400));

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
      return next(new AppError('Incorrect email or password', 401));

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token
    });
  }
);

const signToken = (id: Types.ObjectId): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  });
};

const hashResetToken = (token: string): string => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return hashedToken;
};

export const protect = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    let token;

    if (authorization && authorization.startsWith('Bearer')) {
      token = authorization.split(' ')[1];
    }

    if (!token)
      return next(
        new AppError('you are not logged in! please login to get access.', 401)
      );

    const verifyAsync = promisify<string, string, jwt.JwtPayload>(
      jwt.verify as any
    );
    const decoded = await verifyAsync(token, process.env.JWT_SECRET!);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser)
      return next(
        new AppError(
          'The token belonging to this user does no longer exist.',
          401
        )
      );

    if (currentUser.changedPasswordAfter(decoded.iat!))
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );

    req.user = currentUser;
    next();
  }
);

export const restrictTo = (...roles: any) => {
  return catchAsync(async (req: any, res: Response, next: Function) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403)
      );
    }

    next();
  });
};

export const forgotPassword = catchAsync(
  async (req: any, res: Response, next: Function) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return next(new AppError('no user found with the provided data', 404));

    const resetToken = user?.createPasswordResetToken();

    try {
      sendMail({
        email: user?.email!,
        subject: 'your forget password token',
        text: `here\'s your forget password url: ${req.protocol}://${req.get(
          'host'
        )}/api/v1/users/resetPassword/${resetToken}`
      });

      await user?.save();

      res.status(200).json({
        status: 'success'
      });
    } catch (err) {
      console.log('error in sending email');

      res.status(400).json({
        status: 'fail',
        message: 'error in sending email'
      });
    }
  }
);

export const resetPassword = catchAsync(
  async (req: any, res: Response, next: Function) => {
    const { token } = req.params;
    const { newPassword, passwordConfirm } = req.body;

    const hashedToken = hashResetToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return next(new AppError('invalid or expired token!', 404));

    try {
      user.password = newPassword;
      user.passwordConfirm = passwordConfirm;

      user.passwordResetExpires = undefined;
      user.passwordResetToken = undefined;

      await user.save();

      const token = signToken(user._id);

      res.status(200).json({
        status: 'success',
        token: token
      });
    } catch (err) {
      next(new AppError(err.message, 400));
    }
  }
);

export const updatePassword = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword, passwordConfirm } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.correctPassword(currentPassword, user.password)))
      return next(new AppError('incorrect password!', 401));

    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;

    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token: token
    });
  }
);
