import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { AuthRequest } from '../shared/types/authRequest';
import filterObj from '../utils/filterObj';

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
};

export const updateMe = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.body.password || req.body.passwordConfirm)
      return next(
        new AppError("Can't update password here. Use /updateMyPassword.", 400)
      );

    const filteredBody = filterObj(req.body, 'name', 'email');

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'user updated successfully',
      data: updatedUser
    });
  }
);

export const deleteMe = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(200).json({
      status: 'success',
      message: 'user deleted successfully!'
    });
  }
);

export const createUser = (req: Request, res: Response): void => {
  res.status(500).json({
    status: 'fail',
    message: 'not defined yet!'
  });
};

export const updateUserById = (req: Request, res: Response): void => {
  res.status(500).json({
    status: 'fail',
    message: 'not defined yet!'
  });
};

export const getUserById = (req: Request, res: Response): void => {
  res.status(500).json({
    status: 'fail',
    message: 'not defined yet!'
  });
};

export const deleteUserById = (req: Request, res: Response): void => {
  res.status(500).json({
    status: 'fail',
    message: 'not defined yet!'
  });
};
