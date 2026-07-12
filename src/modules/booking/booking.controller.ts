import { NextFunction, Request, Response } from "express";
import bookingService from "./booking.service";
import { adminBookingQuerySchema, adminBookingReceiptSchema, bookingQuerySchema, createBookingSchema, studentBookingQuerySchema } from "../../validation/booking.validation";
import {TAllBookingByStudentIdQueryParams} from "../../types"

//get all tutors with pagination, search and filtering.
const getAllBookingByAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;

        // Zod validation
        const validation = bookingQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const result = await bookingService.getAllBookingByAuthor(studentId as string, validation.data.query);
        if (result.data.length === 0) {
            res.status(200).json({
                success: true,
                message: 'No booking found.'
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Bookings fetched successfully',
                data: result
            });
        }

    } catch (err: any) {
        next(err);
    }
}

// get all booking for admin dashboard
const getAllBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //zod validation
        const validation = adminBookingQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;
        const result = await bookingService.getAllBooking(validation.data.query);
        res.status(200).json({
            success: true,
            message: `Booking fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get booking stats for admin dashboard
const getBookingStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await bookingService.getBookingStats();
        res.status(200).json({
            success: true,
            message: `Booking statistics fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get booking receipt by bookingId for admin dashboard
const getBookingReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = adminBookingReceiptSchema.safeParse({ params: req.params });
        if (!validation.success) throw validation.error;

        const { id } = validation.data.params;
        const result = await bookingService.getBookingReceipt(id);
        res.status(200).json({
            success: true,
            message: `Booking receipt fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//Create new booking with payment
const createBookingWithPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;

        // zod validation
        const validation = createBookingSchema.safeParse(req.body);
        if (!validation.success) throw validation.error;

        const result = await bookingService.createBookingWithPayment(studentId as string,
            validation.data);
        res.status(201).json({
            success: true,
            message: 'Booking and payment created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get all booking for student dashboard
const getAllBookingByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;
        //zod validation
        const validation = studentBookingQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;
        const result = await bookingService.getAllBookingByStudentId(validation.data.query as TAllBookingByStudentIdQueryParams, studentId as string);
        res.status(200).json({
            success: true,
            message: `Booking fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get booking meta data for student dashboard
const getBookingsMetaDataByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;
        if(!studentId){
            throw new Error('User not found')
        }
        const result = await bookingService.getBookingsMetaDataByStudentId(studentId as string);
        res.status(200).json({
            success: true,
            message: `Booking meta data fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get booking details for student dashboard
const getBookingReciptByBookingId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;
        if (!studentId) {
            throw new Error('User not found');
        }
        // zod validation
        const validation = adminBookingReceiptSchema.safeParse({ params: req.params });
        if (!validation.success) throw validation.error;

        const { id:bookingId } = validation.data.params;
        const result = await bookingService.getBookingReciptByBookingId(bookingId as string, studentId as string);
        res.status(200).json({
            success: true,
            message: `Booking details fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//get platform successRate
const getBookingSuccessRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await bookingService.getBookingSuccessRate();
        res.status(200).json({
            success: true,
            message: `Success rate fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const bookingController = {
    getAllBookingByAuthor,
    getAllBooking,
    getBookingStats,
    getBookingReceipt,
    createBookingWithPayment,
    getAllBookingByStudentId,
    getBookingsMetaDataByStudentId,
    getBookingReciptByBookingId,
    getBookingSuccessRate
}

export default bookingController;