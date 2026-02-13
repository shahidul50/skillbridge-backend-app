import { NextFunction, Request, Response } from "express";
import bookingService from "./booking.service";
import { bookingQuerySchema, cancelBookingSchema, createBookingSchema } from "../../validation/booking.validation";

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

//Create new booking
const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;

        // zod validation
        const validation = createBookingSchema.safeParse(req.body);
        if (!validation.success) throw validation.error;

        const result = await bookingService.createBooking(studentId as string,
            validation.data);
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// Update booking status as ’CANCELLED’ of your own bookings.
const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;

        // zod validation check
        const validation = cancelBookingSchema.safeParse({ params: req.params });
        if (!validation.success) throw validation.error;

        const result = await bookingService.updateBookingStatus(studentId as string,
            validation.data.params.id);
        res.status(200).json({
            success: true,
            message: 'Booking cancel successfully.',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const bookingController = {
    getAllBookingByAuthor,
    createBooking,
    updateBookingStatus
}

export default bookingController;