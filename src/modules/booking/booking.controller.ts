import { NextFunction, Request, Response } from "express";
import bookingService from "./booking.service";
import { createBookingSchema } from "../../validation/booking.validation";

//get all tutors with pagination, search and filtering.
const getAllBookingByAuthorId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await bookingService.getAllBookingByAuthorId();
        res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            data: result
        });
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
        res.status(200).json({
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
        const result = await bookingService.updateBookingStatus();
        res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const bookingController = {
    getAllBookingByAuthorId,
    createBooking,
    updateBookingStatus
}

export default bookingController;