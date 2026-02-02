import { NextFunction, Request, Response } from "express";
import tutorService from "./tutor.service";

//get all tutors with pagination, search and filtering.
const getAllTutors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await tutorService.getAllTutors();
        res.status(200).json({
            success: true,
            message: 'Tutors fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//get all tutor by id with tutor profile, review, availability.
const getTutorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await tutorService.getTutorById();
        res.status(200).json({
            success: true,
            message: 'Tutor fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//update tutor profile
const updateTutor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await tutorService.updateTutor();
        res.status(200).json({
            success: true,
            message: 'Update Tutor successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//Get All teaching sessions by tutor.
const getTutorAllSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await tutorService.getTutorAllSession();
        res.status(200).json({
            success: true,
            message: 'Tutor session fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//Mark the session as 'COMPLETED' when it is complete.
const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await tutorService.updateBookingStatus();
        res.status(200).json({
            success: true,
            message: 'Session status updated successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//Create weekly availability slot.
const createTutorAvailableSlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await tutorService.createTutorAvailableSlot();
        res.status(200).json({
            success: true,
            message: 'Tutor available slot created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//delete weekly availability slot.
const deleteTutorAvailableSlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await tutorService.deleteTutorAvailableSlot();
        res.status(200).json({
            success: true,
            message: 'Tutor available slot deleted successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//create exception on a special day.
const createTutorException = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await tutorService.createTutorException();
        res.status(200).json({
            success: true,
            message: 'Tutor exception created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const tutorController = {
    getAllTutors,
    getTutorById,
    updateTutor,
    getTutorAllSession,
    updateBookingStatus,
    createTutorAvailableSlot,
    deleteTutorAvailableSlot,
    createTutorException
}

export default tutorController;