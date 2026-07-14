import { NextFunction, Request, Response } from "express";
import reviewService from "./review.service";
import { getAllBookingWIthReviewValidationSchema, getAllReviewByTutorProfileIdValidationSchema, reviewValidationSchema } from "../../validation/review.validation";
import { TGetAllReviewByTutorProfileIdQueryParams } from "../../types/review.type";

// get all booking with review
const getAllBookingWithReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;

        if(!studentId) throw new Error('UserId is required');
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

const getAllReviewStatsByTutorProfileId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorProfileId = req.params?.tutorProfileId;
        
        if(!tutorProfileId) throw new Error('Tutor profile id required');

        const result = await reviewService.getAllReviewStatsByTutorProfileId(tutorProfileId as string);
        res.status(200).json({
            success: true,
            message: `All review stats fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const getAllReviewByTutorProfileId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorProfileId = req.params?.tutorProfileId;
        
        if(!tutorProfileId) throw new Error('Tutor profile id required');
        //zod validation
        const validation = getAllReviewByTutorProfileIdValidationSchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const result = await reviewService.getAllReviewByTutorProfileId(tutorProfileId as string, validation.data.query as TGetAllReviewByTutorProfileIdQueryParams,);
        res.status(200).json({
            success: true,
            message: `All Review fetched successfully.`,
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

const getFeaturedReviews = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const result = await reviewService.getFeaturedReviews();
        res.status(200).json({
            success: true,
            message: 'Featured reviews fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const reviewController = {
    getAllBookingWithReview,
    createReview,
    getAllReviewStatsByTutorProfileId,
    getAllReviewByTutorProfileId,
    getFeaturedReviews
}

export default reviewController;