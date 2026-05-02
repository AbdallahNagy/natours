import { NextFunction, Response, Request } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import APIFeatures from '../utils/apiFeatures';

export const deleteOne = (Model: mongoose.Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) return next(new AppError('No document found with id: ' + req.params.id, 404));

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

export const updateOne = (Model: mongoose.Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) return next(new AppError('No document found with id: ' + req.params.id, 404));

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

export const createOne = (Model: mongoose.Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

export const getOne = (Model: mongoose.Model<any>, popOptions?: mongoose.PopulateOptions | mongoose.PopulateOptions[]) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) return next(new AppError('No document found with id: ' + req.params.id, 404));

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

export const getAll = (Model: mongoose.Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const docs = await Model.find();

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });

export const getAllWithFilter = (Model: mongoose.Model<any>, buildFilter?: (req: Request) => Record<string, any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const filter = buildFilter ? buildFilter(req) : {};
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });
