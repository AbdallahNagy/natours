import mongoose, { Document, Query, Schema } from 'mongoose';
import slugify from 'slugify';

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
}

const tourSchema = new Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, 'a tour must have a name'],
      unique: true,
      trim: true,
      minlength: [10, 'name must be more than or equal to 10 chars'],
      maxlength: [50, 'name must be less than or equal to 50 chars'],
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
      default: 4.5
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
      },
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
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// document middleware
tourSchema.pre('save', function() {
  this.slug = slugify(this.name, { lower: true });
});

// query middleware
tourSchema.pre(/^find/, function(this: Query<any, ITour>) {
  this.find({ secretTour: { $ne: true } });
});

// tourSchema.post(/^find/, function(docs) {
//   console.log(docs);
// });

tourSchema.pre('aggregate', function() {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
});

export default mongoose.model<ITour>('Tour', tourSchema);
