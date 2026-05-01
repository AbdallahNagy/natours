import express from 'express';
import * as reviewController from '../controllers/reviewController';
import * as authController from '../controllers/authController';

const router = express.Router();

router
  .route('/')
  .get(reviewController.setTourIdToQuery, reviewController.getAllReviews)
  .post(
    authController.protect,
    reviewController.setTourAndUserIds,
    reviewController.protectCreateReview,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.protect,
    reviewController.restrictToReviewAuthor,
    reviewController.updateReview
  )
  .delete(
    authController.protect,
    reviewController.restrictToReviewAuthor,
    reviewController.deleteReview
  );

export default router;
