import { Request, Response, NextFunction } from 'express';
import Tour from '../models/tourModel';
import APIFeatures from '../utils/apiFeatures';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

export const aliasTopTours = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.url =
    '/?sort=-ratingsAverage,price&fields=ratingsAverage,price,name,difficulty,summary&limit=5';
  next();
};

export const getAllTours = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
  }
);

export const getTourById = catchAsync(
  async (req: Request, res: Response, next: Function): Promise<void> => {
    const tour = await Tour.findById(req.params.id);

    if(!tour) {
      return next(new AppError('No tour found with id: ' + req.params.id, 404))
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  }
);

export const createTour = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const tour = await Tour.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  }
);

export const updateTourById = catchAsync(
  async (req: Request, res: Response, next: Function): Promise<void> => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if(!tour) {
      return next(new AppError('No tour found with id: ' + req.params.id, 404))
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  }
);

export const deleteTourById = catchAsync(
  async (req: Request, res: Response, next: Function): Promise<void> => {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    console.log(tour);

    if(!tour) {
      return next(new AppError('No tour found with id: ' + req.params.id, 404))
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  }
);

export const getTourStats = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numOfTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: {
          avgPrice: 1
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  }
);

export const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const year = +req.params.year;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numToursStarts: { $sum: 1 },
          tours: { $push: '$name' }
        }
      },
      {
        $addFields: { month: '$_id' }
      },
      {
        $project: { _id: 0 }
      },
      {
        $sort: { numToursStarts: -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  }
);
