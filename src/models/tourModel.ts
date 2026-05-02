import mongoose, { Document, Query, Schema } from 'mongoose';
import slugify from 'slugify';

interface ILocation {
  type: string;
  coordinates: number[];
  address: string;
  description: string;
}

interface ITourLocation extends ILocation {
  day: number;
}

export interface ITour extends Document {
  name: string;
  slug?: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  ratingsAverage: number;
  ratingsQuantity: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description?: string;
  imageCover: string;
  images: string[];
  createdAt: Date;
  startDates: Date[];
  secretTour: Boolean;
  startLocation: ILocation;
  locations: ITourLocation[];
  guides: mongoose.Types.ObjectId[];
}

const tourSchema = new Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, 'a tour must have a name'],
      unique: true,
      trim: true,
      minlength: [10, 'name must be more than or equal to 10 chars'],
      maxlength: [50, 'name must be less than or equal to 50 chars']
      // validate: validator.isAlpha
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'a tour must have a duration'],
      min: [1, 'duration must be above 0'],
      max: [100, 'duration must be below 100']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a tour must have a group type']
    },
    difficulty: {
      type: String,
      required: [true, 'a tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must be: easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'rating must be below 5.0'],
      set: (val: number) => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'a tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(this: ITour, val: number) {
          return val < this.price;
        },
        message: 'discount is more than price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// document middleware
tourSchema.pre('save', function() {
  this.slug = slugify(this.name, { lower: true });
});

// query middleware
tourSchema.pre(/^find/, function(this: Query<any, ITour>) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
});

tourSchema.pre(/^find/, function(this: Query<any, ITour>) {
  this.find({ secretTour: { $ne: true } });
});

tourSchema.pre('aggregate', function() {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
});

export default mongoose.model<ITour>('Tour', tourSchema);
