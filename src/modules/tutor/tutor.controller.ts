import { NextFunction, Request, Response } from "express";
import tutorService from "./tutor.service";
import fs from "fs/promises";
import { AppError } from "../../utils/AppError";
import { createTutorExceptionSchema, createWeeklyAvailabilitySchema, deleteTutorExceptionSchema, deleteWeeklyAvailabilitySchema, getAvailableSlotsSchema, getDashboardRevenueTrendsQuerySchema, scheduleEventsQuerySchema, setTutorCategoriesSchema, tutorQuerySchema, tutorSessionQuerySchema, updateBookingStatusByTutorSchema, updateTutorSchema, updateWeeklyAvailabilitySchema } from "../../validation/tutor.validation";
import cloudinary from "../../lib/cloudinary";
import { GetAllTutorQueryParams, TCreateException, TCreateWeeklyAvailability, TGetAllSessionsQueryParams, TUpdateBookingStatusByTutor } from "../../types";

//get all tutors for public tutor page.
const getAllTutors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Zod Validation (Query parameters)
        const validation = tutorQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const result = await tutorService.getAllTutors(validation.data.query as GetAllTutorQueryParams);
        res.status(200).json({
            success: true,
            message: 'Tutors fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//get tutor profile with user data, tutor categories, reviews by tutorProfileId for public tutor page.
const getTutorProfileByProfileId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorProfileId = req.params.profileId as string;
        const result = await tutorService.getTutorProfileByProfileId(tutorProfileId);
        res.status(200).json({
            success: true,
            message: 'Tutor profile fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//get available slots for a tutor based on weekly availability, exceptions and already booked slots for public tutor page.
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

//----------------------*-----------Profile Management-----------*----------------------*

//get tutor name, image, with tutor profile by userId
const getTutorProfileByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id as string;

        const result = await tutorService.getTutorProfileByUserId(userId);
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
            const currentUser = await tutorService.getTutorDetailsByUserId(tutorId);

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

//----------------------*-----------Category Management-----------*----------------------*

//get tutor categories
const getTutorSelectedCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;

        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        const result = await tutorService.getTutorSelectedCategories(tutorProfile.id);
        res.status(200).json({
            success: true,
            message: 'Tutor selected categories fetched successfully',
            data: result
        });
    } catch (err: any) {
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

//----------------------*-----------Weekly Availability Management-----------*----------------------*

//Create weekly availability slot.
const createTutorWeeklyAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;

        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        // Zod validation
        const validation = createWeeklyAvailabilitySchema.safeParse({ body: req.body });
        if (!validation.success) throw validation.error;

        const result = await tutorService.createTutorWeeklyAvailability(tutorProfile.id, validation.data.body as TCreateWeeklyAvailability);
        res.status(201).json({
            success: true,
            message: 'Tutor weekly availability created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//Get tutor's weekly available slots
const getTutorWeeklyAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        if (!tutorId) {
            return res.status(403).json({ success: false, message: "Tutor not found" });
        }
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string);
        if (!tutorProfile) {
            return res.status(403).json({ success: false, message: "Tutor not found" });
        }
        const result = await tutorService.getTutorWeeklyAvailableSlots(tutorProfile.id);
        res.status(200).json({
            success: true,
            message: 'Tutor weekly available slots fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//update weekly availability slot.
const updateTutorWeeklyAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        // Zod validation
        const validation = updateWeeklyAvailabilitySchema.safeParse({ params: req.params, body: req.body });
        if (!validation.success) throw validation.error;

        const result = await tutorService.updateTutorWeeklyAvailability(tutorProfile.id, validation.data.params.id, validation.data.body);
        res.status(200).json({
            success: true,
            message: 'Tutor weekly availability updated successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//delete weekly availability slot.
const deleteTutorWeeklyAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
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

//----------------------*-----------Exception Management-----------*----------------------*

//get all exceptions by tutorProfileId for tutor dashboard.
const getAllTutorException = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        const result = await tutorService.getAllTutorException(tutorProfile.id);
        res.status(200).json({
            success: true,
            message: 'Tutor exceptions fetched successfully',
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

        const result = await tutorService.createTutorException(tutorProfile.id, validation.data.body as TCreateException);
        res.status(201).json({
            success: true,
            message: 'Tutor exception (Off-day) created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//delete exception on a special day.
const deleteTutorException = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId!);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        const validation = deleteTutorExceptionSchema.safeParse({ params: req.params });
        if (!validation.success) throw validation.error;

        const result = await tutorService.deleteTutorException(tutorProfile.id, validation.data.params.id);
        res.status(200).json({
            success: true,
            message: 'Tutor exception deleted successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//----------------------*-----------Dashboard Management-----------*----------------------*
const getDashboardMeta = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;

        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        const result = await tutorService.getDashboardMeta(tutorProfile.id);
        res.status(200).json({
            success: true,
            message: 'Dashboard meta fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const getDashboardRevenueTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;

        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string);
        if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");

        // Zod validation
        const validation = getDashboardRevenueTrendsQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const { trendPeriod } = validation.data.query;

        const result = await tutorService.getDashboardRevenueTrends(tutorProfile.id, trendPeriod);
        res.status(200).json({
            success: true,
            message: 'Dashboard revenue trends fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//----------------------*-----------Booking Management-----------*----------------------*

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
        const result = await tutorService.getTutorAllSession(tutorProfile?.id as string, validation.data.query as TGetAllSessionsQueryParams);
        res.status(200).json({
            success: true,
            message: 'Tutor session fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//add meeting link when booking is confirmed or mark the session as 'COMPLETED' when it is complete.
const updateBookingStatusOrMeetingLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        if (!tutorId) {
            return res.status(403).json({ success: false, message: "Tutor not found" });
        }
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string)

        // zod validation
        const validation = updateBookingStatusByTutorSchema.safeParse({ params: req.params, body: req.body });
        if (!validation.success) throw validation.error;

        const meetingLink = validation.data.body.meetingLink;
        const bookingStatus = validation.data.body.status;

        if (meetingLink !== null && bookingStatus === "CONFIRMED") {
            const result = await tutorService.updateBookingMeetingLink(tutorProfile?.id as string, validation.data.params.bookingId, validation.data.body as TUpdateBookingStatusByTutor);
            res.status(200).json({
                success: true,
                message: 'Session meeting link updated successfully',
                data: result
            });
        }

        if (meetingLink !== null && bookingStatus === "COMPLETED") {
            const result = await tutorService.updateBookingStatus(tutorProfile?.id as string, validation.data.params.bookingId, meetingLink as string);
            res.status(200).json({
                success: true,
                message: 'Session status marked as completed successfully',
                data: result
            });
        }

    } catch (err: any) {
        next(err);
    }
}

//Get booking and student review by bookingId for tutor dashboard
const getSessionDetailsByBookingId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        if (!tutorId) {
            return res.status(403).json({ success: false, message: "Tutor not found" });
        }
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string)

        if (!tutorProfile) {
            return res.status(404).json({ success: false, message: "Tutor profile not found" });
        }

        const bookingId = req.params.bookingId as string;
        const result = await tutorService.getSessionDetailsByBookingId(tutorProfile.id, bookingId);

        res.status(200).json({
            success: true,
            message: 'Tutor session details fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//----------------------*-----------Schedule Management-----------*----------------------*

//Get tutor schedule info for tutor dashboard
const getTutorScheduleMeta = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        if (!tutorId) {
            return res.status(403).json({ success: false, message: "Tutor not found" });
        }
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string)

        if (!tutorProfile) {
            return res.status(404).json({ success: false, message: "Tutor profile not found" });
        }

        const result = await tutorService.getTutorScheduleMeta(tutorProfile.id);
        res.status(200).json({
            success: true,
            message: 'Tutor schedule fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//Get tutor schedule events for tutor dashboard
const getTutorScheduleEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tutorId = req.user?.id;
        if (!tutorId) {
            return res.status(403).json({ success: false, message: "Tutor not found" });
        }
        const tutorProfile = await tutorService.getTutorProfileByUserId(tutorId as string)

        if (!tutorProfile) {
            return res.status(404).json({ success: false, message: "Tutor profile not found" });
        }

        // zod validation
        const validation = scheduleEventsQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const { startDate, endDate } = validation.data.query;
        const result = await tutorService.getTutorScheduleEvents(tutorProfile.id, startDate, endDate);
        res.status(200).json({
            success: true,
            message: 'Tutor schedule events fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}




const tutorController = {
    getAllTutors,
    getTutorProfileByProfileId,
    getAvailableSlots,
    getTutorProfileByUserId,
    updateTutorProfile,
    getTutorSelectedCategories,
    setTutorCategories,
    getTutorWeeklyAvailableSlots,
    createTutorWeeklyAvailableSlots,
    updateTutorWeeklyAvailableSlots,
    deleteTutorWeeklyAvailableSlots,
    getAllTutorException,
    createTutorException,
    deleteTutorException,
    getDashboardMeta,
    getDashboardRevenueTrends,
    getTutorAllSession,
    updateBookingStatusOrMeetingLink,
    getTutorScheduleMeta,
    getTutorScheduleEvents,
    getSessionDetailsByBookingId
}

export default tutorController;