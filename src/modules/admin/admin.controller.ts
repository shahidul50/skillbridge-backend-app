import { NextFunction, Request, Response } from "express";
import adminService from "./admin.service";
import { bannedUserSchema, userProfileDetailsSchema, userQuerySchema } from "../../validation/user-profile.validation";
import { AppError } from "../../utils/AppError";
import { UserRole } from "../../middleware/authMiddleware";


// get dashboard stats for admin dashboard
const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await adminService.getDashboardStats();
        res.status(200).json({
            success: true,
            message: `Dashboard statistics fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const getAllPlatformUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //zod validation
        const validation = userQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const result = await adminService.getAllPlatformUser(validation.data.query);
        res.status(200).json({
            success: true,
            message: 'Platform users fetch successfully.',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get user profile details by userId for admin dashboard
const getUserProfileDetailsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = userProfileDetailsSchema.safeParse({ params: req.params });
        if (!validation.success) throw validation.error;

        const { userId } = validation.data.params;

        const user = await adminService.getUserByUserId(userId as string);
        if (!user) throw new AppError("User not found", 404);
        if (user.role === UserRole.TUTOR) {
            const result = await adminService.getTutorProfileDetailsByUserId(userId as string);
            res.status(200).json({
                success: true,
                message: `User details fetched successfully.`,
                data: result
            });
        }
        if (user.role === UserRole.STUDENT) {
            const result = await adminService.getStudentDetailsByUserId(userId as string);
            res.status(200).json({
                success: true,
                message: `User details fetched successfully.`,
                data: result
            });
        }
    } catch (err: any) {
        next(err);
    }
}

const bannedUserAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user?.id;
        //zod validation
        const validation = bannedUserSchema.safeParse({ params: req.params, body: req.body });

        if (!validation.success) throw validation.error;
        const { id } = validation.data.params;
        const { isActive } = validation.data.body;

        const result = await adminService.bannedUserAccount(adminId as string, id, isActive);
        res.status(200).json({
            success: true,
            message: `User ${isActive ? 'activated' : 'banned'} successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const adminController = {
    getDashboardStats,
    getAllPlatformUser,
    getUserProfileDetailsByUserId,
    bannedUserAccount,
}


export default adminController;