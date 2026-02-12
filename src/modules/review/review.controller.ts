import { NextFunction, Request, Response } from "express";
import reviewService from "./review.service";
import { reviewValidationSchema } from "../../validation/review.validation";

//create new review
const createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;

        //zod validation
        const validation = reviewValidationSchema.safeParse({ body: req.body });
        if (!validation.success) throw validation.error;

        const result = await reviewService.createReview(studentId as string, validation.data.body);
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