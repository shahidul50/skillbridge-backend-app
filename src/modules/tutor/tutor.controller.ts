import { NextFunction, Request, Response } from "express";
import tutorService from "./tutor.service";
import fs from "fs/promises";
import { AppError } from "../../utils/AppError";
import { createTutorExceptionSchema, createWeeklyAvailabilitySchema, deleteWeeklyAvailabilitySchema, getAvailableSlotsSchema, setTutorCategoriesSchema, tutorQuerySchema, tutorSessionQuerySchema, updateBookingStatusByTutorSchema, updateTutorSchema } from "../../validation/tutor.validation";
import cloudinary from "../../lib/cloudinary";

//get all tutors with pagination, search and filtering.
const getAllTutors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Zod Validation (Query parameters)
        const validation = tutorQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const result = await tutorService.getAllTutors(validation.data.query);
        res.status(200).json({
            success: true,
            message: 'Tutors fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//get tutor name, image, with tutor profile by id
const getTutorProfileById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorProfileId = req.params?.id;

        const result = await tutorService.getTutorProfileById(tutorProfileId as string);
        res.status(200).json({
            success: true,
            message: 'Tutor profile fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}


//update tutor profile
const updateTutorProfile = async (req: Request, res: Response, next: NextFunction) => {
    let localFilePath: string | undefined = req.file?.path;
    try {
        const tutorId: string = req.user?.id as string;
        if (!tutorId) throw new AppError("Unauthorized", 401, "AUTH_ERROR");

        // Zod validation
        const validation = updateTutorSchema.safeParse({ body: req.body });
        if (!validation.success) throw validation.error;

        const updateData: any = { ...validation.data.body };

        //Image upload to Cloudinary if new image is provided
        if (localFilePath) {
            const currentUser = await tutorService.getTutorById(tutorId);

            // new image upload
            const cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
                folder: "skillbridge/tutors",
            });

            updateData.image = cloudinaryResult.secure_url;

            // If there was a previous image, delete it from Cloudinary
            if (currentUser?.image) {
                const publicId = currentUser.image.split("/").pop()?.split(".")[0];
                if (publicId) {
                    await cloudinary.uploader.destroy(`skillbridge/tutors/${publicId}`).catch(() => { });
                }
            }
        }

        const updatableData = {
            userProfile: {
                name: updateData.name,
                phoneNumber: updateData.phoneNumber,
                image: updateData.image,
            },
            tutorProfile: {
                title: updateData.title,
                bio: updateData.bio,
                hourlyRate: updateData.hourlyRate,
                experience: updateData.experience,
            }
        }

        const result = await tutorService.updateTutorProfile(tutorId, updatableData);
        if (result) {
            if (localFilePath) await fs.unlink(localFilePath);
        }
        res.status(200).json({
            success: true,
            message: 'Update tutor profile successfully',
            data: result
        });
    } catch (err: any) {
        if (localFilePath) await fs.unlink(localFilePath);
        next(err);
    }
}

//set tutor categories
const setTutorCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;

        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        // Zod validation
        const validation = setTutorCategoriesSchema.safeParse({ body: req.body });
        // if (!validation.success) throw new AppError("Validation failed", 400, validation.error.message);
        if (!validation.success) throw validation.error;

        const result = await tutorService.setTutorCategories(tutorProfile.id, validation.data.body.categoryId);
        res.status(201).json({
            success: true,
            message: 'Tutor categories set successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//Get All teaching sessions by tutor.
const getTutorAllSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        if (!tutorId) {
            return res.status(403).json({ success: false, message: "Tutor not found" });
        }
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string)

        // zod validation
        const validation = tutorSessionQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;
        const result = await tutorService.getTutorAllSession(tutorProfile?.id as string, validation.data.query);
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
        const tutorId = req.user?.id;
        if (!tutorId) {
            return res.status(403).json({ success: false, message: "Tutor not found" });
        }
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string)

        // zod validation
        const validation = updateBookingStatusByTutorSchema.safeParse({ params: req.params });
        if (!validation.success) throw validation.error;

        const result = await tutorService.updateBookingStatus(tutorProfile?.id as string, validation.data.params.bookingId);
        res.status(200).json({
            success: true,
            message: 'Session marked as completed successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//Create weekly availability slot.
const createTutorWeeklyAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;

        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        // Zod validation
        const validation = createWeeklyAvailabilitySchema.safeParse({ body: req.body });
        if (!validation.success) throw validation.error;

        const result = await tutorService.createTutorWeeklyAvailability(tutorProfile.id, validation.data.body);
        res.status(201).json({
            success: true,
            message: 'Tutor weekly availability created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//delete weekly availability slot.
const deleteTutorWeeklyAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        // Zod validation
        const validation = deleteWeeklyAvailabilitySchema.safeParse({ params: req.params });
        if (!validation.success) throw validation.error;

        const result = await tutorService.deleteTutorWeeklyAvailability(tutorProfile.id, validation.data.params.id);
        res.status(200).json({
            success: true,
            message: 'Tutor weekly availability deleted successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//create exception on a special day.
const createTutorException = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;

        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        const validation = createTutorExceptionSchema.safeParse({ body: req.body });
        if (!validation.success) throw validation.error;

        const result = await tutorService.createTutorException(tutorProfile.id, validation.data.body);
        res.status(201).json({
            success: true,
            message: 'Tutor exception (Off-day) created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//get available slots for a tutor based on weekly availability, exceptions and already booked slots.
const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedQuery = getAvailableSlotsSchema.safeParse({ query: req.query });
        if (!validatedQuery.success) throw validatedQuery.error;

        const { tutorProfileId, startDate } = validatedQuery.data.query;

        const result = await tutorService.getAvailableSlots(tutorProfileId, startDate);
        if (result.length === 0) {
            res.status(200).json({
                success: true,
                message: 'No available slots found',
                data: result
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Available slots fetched successfully',
                data: result
            });
        }
    } catch (err: any) {
        next(err);
    }
}

const tutorController = {
    getAllTutors,
    getTutorProfileById,
    updateTutorProfile,
    setTutorCategories,
    getTutorAllSession,
    updateBookingStatus,
    createTutorWeeklyAvailability,
    deleteTutorWeeklyAvailability,
    createTutorException,
    getAvailableSlots
}

export default tutorController;