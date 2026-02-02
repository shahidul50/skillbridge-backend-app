import { NextFunction, Request, Response } from "express";
import reviewService from "./review.service";

//create new review
const createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await reviewService.createReview();
        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const reviewController = {
    createReview
}

export default reviewController;