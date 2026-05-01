import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import Review from '../models/reviewModel';
import { AuthRequest } from '../shared/types/authRequest';
import APIFeatures from '../utils/apiFeatures';

export const createReview = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { review, rating, tour, user } = req.body;

    if (req.user._id.toString() !== user)
      return next(new Error('You can only create reviews for yourself!'));

    const reviewRecord = await Review.create({
      review,
      rating,
      tour,
      user
    });

    res.status(201).json({
      status: 'success',
      data: {
        review: reviewRecord
      }
    });
  }
);

export const getAllReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.params.tourId) req.query.tour = req.params.tourId;

    const features = new APIFeatures(Review.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const reviews = await features.query;

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        reviews
      }
    });
  }
);

export const getReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const review = await Review.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        review
      }
    });
  }
);

export const updateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        review: req.body.review,
        rating: req.body.rating
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        review
      }
    });
  }
);

export const deleteReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  }
);

export const restrictToReviewAuthor = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const review = await Review.findById(req.params.id);

    if (!review) return next(new Error('No review found with that ID!'));

    if (review.user.toString() !== req.user._id.toString())
      return next(new Error('You can only modify/delete your own reviews!'));

    next();
  }
);
