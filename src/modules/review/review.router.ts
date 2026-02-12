import { Router } from "express";
import reviewController from "./review.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//  /  for create a new review
router.post('/', auth(UserRole.STUDENT), reviewController.createReview);




export const reviewRouter: Router = router;