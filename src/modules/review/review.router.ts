import { Router } from "express";
import reviewController from "./review.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//  "/" route is for getting all booking with review
router.get('/', auth(UserRole.STUDENT), reviewController.getAllBookingWithReview);

router.get('/:tutorProfileId/review-stats', reviewController.getAllReviewStatsByTutorProfileId);

router.get('/:tutorProfileId/reviews', reviewController.getAllReviewByTutorProfileId);

//  /  for create a new review
router.post('/', auth(UserRole.STUDENT), reviewController.createReview);






export const reviewRouter: Router = router;