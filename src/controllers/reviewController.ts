import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import Review from '../models/reviewModel';
import {
  createOne,
  deleteOne,
  getAllWithFilter,
  getOne,
  updateOne
} from './handlerFactory';

export const protectCreateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.user._id.toString() !== req.body.user)
      return next(new Error('You can only create reviews for yourself!'));

    next();
  }
);

export const setTourAndUserIds = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user._id;

  console.log(req.body.user);
  console.log(req.user._id);
  next();
};

export const createReview = createOne(Review);

export const getAllReviews = getAllWithFilter(Review, (req: Request) =>
  req.params.tourId ? { tour: req.params.tourId } : {}
);

export const getReview = getOne(Review);

export const updateReview = updateOne(Review);

export const deleteReview = deleteOne(Review);

export const restrictToReviewAuthor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const review = await Review.findById(req.params.id).setOptions({
      skipUserPopulate: true
    });

    if (!review) return next(new Error('No review found with that ID!'));

    if (review.user.toString() !== req.user._id.toString())
      return next(new Error('You can only modify/delete your own reviews!'));

    next();
  }
);
