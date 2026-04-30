import mongoose, { Document, Schema } from 'mongoose';

interface IReview extends Document {
  review: string;
  rating: number;
  createdAt: Date;
  tour: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
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
  this.populate({ path: 'user', select: 'name photo' });
});

export default mongoose.model<IReview>('Review', reviewSchema);
