import { Request, Response, NextFunction } from 'express';
import Tour from '../models/tourModel';
import catchAsync from '../utils/catchAsync';
import {
  createOne,
  deleteOne,
  getAllWithFilter,
  getOne,
  updateOne
} from './handlerFactory';
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

export const getToursWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { distance, latlng, unit } = req.params;

    if (typeof latlng !== 'string')
      return next(
        new AppError(
          'latlng should be provided in the correct format lat,lng,',
          400
        )
      );

    const [lat, lng] = latlng.split(',');

    if (!lat || !lng)
      return next(
        new AppError('please provide lat and lng in the format lat,lng.', 400)
      );

    const radius = unit === 'mi' ? +distance / 3963.2 : +distance / 6378.1;
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours
      }
    });
  }
);

export const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { latlng, unit } = req.params;

    if (typeof latlng !== 'string')
      return next(
        new AppError(
          'latlng should be provided in the correct format lat,lng,',
          400
        )
      );

    const [lat, lng] = latlng.split(',');

    if (!lat || !lng)
      return next(
        new AppError('please provide lat and lng in the format lat,lng.', 400)
      );

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [+lng, +lat]
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier
        }
      },
      {
        $project: {
          distance: 1,
          name: 1
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        data: distances
      }
    });
  }
);

export const getAllTours = getAllWithFilter(Tour);
export const getTourById = getOne(Tour, { path: 'reviews' });
export const createTour = createOne(Tour);
export const updateTourById = updateOne(Tour);
export const deleteTourById = deleteOne(Tour);
