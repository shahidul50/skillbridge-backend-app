import { NextFunction, Request, Response } from "express";
import reviewService from "./review.service";
import { getAllBookingWIthReviewValidationSchema, reviewValidationSchema } from "../../validation/review.validation";

// get all booking with review
const getAllBookingWithReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;
        if(!studentId) throw new Error('User not found');
        //zod validation
        const validation = getAllBookingWIthReviewValidationSchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const result = await reviewService.getAllBookingWithReview(validation.data.query,studentId as string);
        res.status(200).json({
            success: true,
            message: `Review fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}


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
    getAllBookingWithReview,
    createReview
}

export default reviewController;