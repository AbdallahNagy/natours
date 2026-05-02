import mongoose, { Document, Model, Schema } from 'mongoose';
import Tour from './tourModel';

interface IReview extends Document {
  review: string;
  rating: number;
  createdAt: Date;
  tour: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
}

interface IReviewModel extends Model<IReview> {
  calcAverageRatings(tourId: mongoose.Types.ObjectId): Promise<void>;
}

const reviewSchema = new Schema<IReview>(
  {
    review: {
      type: String,
      required: [true, 'review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour!']
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user!']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(this: mongoose.Query<IReview[], IReview>) {
  if (this.getOptions().skipUserPopulate) return;
  this.populate({ path: 'user', select: 'name photo' });
});

reviewSchema.statics.calcAverageRatings = async function(
  tourId: mongoose.Types.ObjectId
) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  console.log(stats);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats.length > 0 ? stats[0].nRating : 0,
    ratingsAverage: stats.length > 0 ? stats[0].avgRating : 4.5
  });
};

reviewSchema.post('save', function(this: IReview) {
  (this.constructor as IReviewModel).calcAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function(review: IReview | null) {
  if (review)
    await (review.constructor as IReviewModel).calcAverageRatings(review.tour);
});

export default mongoose.model<IReview, IReviewModel>('Review', reviewSchema);
