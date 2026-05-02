import express from 'express';
import * as reviewController from '../controllers/reviewController';
import * as authController from '../controllers/authController';

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    // authController.restrictTo('user'),
    reviewController.setTourAndUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.restrictToReviewAuthor,
    reviewController.updateReview // TODO:we can't udpate tour not user. 
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.restrictToReviewAuthor,
    reviewController.deleteReview
  );

export default router;
