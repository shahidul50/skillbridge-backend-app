import { Router } from "express";
import reviewController from "./review.controller";

const router = Router();

//  /  for create new review
router.post('/', reviewController.createReview);




export const reviewRouter: Router = router;