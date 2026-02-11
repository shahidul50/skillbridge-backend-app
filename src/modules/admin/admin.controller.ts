import { NextFunction, Request, Response } from "express";
import adminService from "./admin.service";
import { paymentAccountQuerySchema, paymentQuerySchema, verifyPaymentSchema } from "../../validation/payment.validation";
import { bannedUserSchema, userQuerySchema } from "../../validation/user-profile.validation";
import { adminBookingQuerySchema } from "../../validation/booking.validation";


const getAllPaymentAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = paymentAccountQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;
        const result = await adminService.getAllPaymentAccount(validation.data.query);
        res.status(200).json({
            success: true,
            message: 'Payment account fetch successfully.',
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

const getAllPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = paymentQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const result = await adminService.getAllPayments(validation.data.query);
        res.status(200).json({
            success: true,
            message: `Payment details fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const verifyPaymentTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = verifyPaymentSchema.safeParse({ params: req.params, body: req.body });
        if (!validation.success) throw validation.error;

        const { id } = validation.data.params;
        const { status } = validation.data.body;

        const result = await adminService.verifyPaymentTransaction(id, status);
        res.status(200).json({
            success: true,
            message: `Payment marked as ${status.toLowerCase()} successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const getAllBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //zod validation
        const validation = adminBookingQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;
        const result = await adminService.getAllBooking(validation.data.query);
        res.status(200).json({
            success: true,
            message: `Booking fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await adminService.getStats();
        res.status(200).json({
            success: true,
            message: `Dashboard statistics fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}


const adminController = {
    getAllPaymentAccount,
    getAllPlatformUser,
    bannedUserAccount,
    getAllPayments,
    verifyPaymentTransaction,
    getStats,
    getAllBooking
}


export default adminController;