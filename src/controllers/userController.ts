import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import filterObj from '../utils/filterObj';
import { createOne, deleteOne, getAll, getOne, updateOne } from './handlerFactory';

export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError("Can't update password here. Use /updateMyPassword.", 400));

  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'user updated successfully',
    data: updatedUser
  });
});

export const deleteMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(200).json({
    status: 'success',
    message: 'user deleted successfully!'
  });
});

export const getAllUsers = getAll(User);
export const createUser = createOne(User);
export const updateUserById = updateOne(User);
export const getUserById = getOne(User);
export const deleteUserById = deleteOne(User);
