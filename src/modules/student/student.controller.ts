import { NextFunction, Request, Response } from "express";
import studentService from "./student.service";
import { scheduleEventsQuerySchema } from "../../validation/tutor.validation";

// get meta data for student dashboard
const getDashboardMetaData = async (req: Request, res: Response, next: NextFunction) => {
     try {
        const result = await studentService.getDashboardMetaData(req.user?.id as string);
        res.status(200).json({
            success: true,
            message: `Dashboard meta data fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get upcoming sessions data for student dashboard
const getDashboardUpcomingSessions = async (req: Request, res: Response, next: NextFunction) => {
     try {
        const result = await studentService.getDashboardUpcomingSessions(req.user?.id as string);
        res.status(200).json({
            success: true,
            message: `Dashboard Upcoming sessions data fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get recent bookings data for student dashboard
const getDashboardRecentBookings = async (req: Request, res: Response, next: NextFunction) => {
     try {
        const result = await studentService.getDashboardRecentBookings(req.user?.id as string);
        res.status(200).json({
            success: true,
            message: `Dashboard recent booking data fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get schedule meta data for student dashboard
const getScheduleMetaData = async (req: Request, res: Response, next: NextFunction) => {
     try {
        const result = await studentService.getScheduleMetaData(req.user?.id as string);
        res.status(200).json({
            success: true,
            message: `Schedule meta data fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get schedule calendar events for student dashboard
const getScheduleCalendarEvents = async (req: Request, res: Response, next: NextFunction) => {
     try {
        const studentId = req.user?.id;

        //zod validation
        const validation = scheduleEventsQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const { startDate, endDate } = validation.data.query;
        const result = await studentService.getScheduleCalendarEvents(studentId as string, startDate, endDate);
        res.status(200).json({
            success: true,
            message: `Schedule calendar events data fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const studentController = {
    getDashboardMetaData,
    getDashboardUpcomingSessions,
    getDashboardRecentBookings,
    getScheduleMetaData,
    getScheduleCalendarEvents
}

export default studentController;