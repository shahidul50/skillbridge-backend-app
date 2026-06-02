import { NextFunction, Request, Response } from "express";
import paymentService from "./payment.service";
import { paymentAccountQuerySchema, paymentAccountSchema, paymentAccountUpdateSchema, paymentAccountDetailsSchema, paymentQuerySchema, verifyPaymentSchema } from "../../validation/payment.validation";

//get payment details for showing frontend 
const getAccountDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await paymentService.getAccountDetails();
        res.status(200).json({
            success: true,
            message: 'Payment account details fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get all platform payment account for admin dashboard
const getAllPaymentAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = paymentAccountQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;
        const result = await paymentService.getAllPaymentAccount(validation.data.query);
        res.status(200).json({
            success: true,
            message: 'Payment account fetch successfully.',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//create payment account details
const createPaymentAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //zod validation
        const validation = paymentAccountSchema.safeParse({ body: req.body });
        if (!validation.success) throw validation.error

        const result = await paymentService.createPaymentAccount(validation.data.body);
        res.status(201).json({
            success: true,
            message: 'Payment Account details created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//update payment account details
const updatePaymentAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //zod validation
        const validation = paymentAccountUpdateSchema.safeParse({ body: req.body });
        if (!validation.success) throw validation.error

        const result = await paymentService.updatePaymentAccount(req.params.id as string, validation.data.body);
        res.status(200).json({
            success: true,
            message: 'Payment Account details updated successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get all payments for admin dashboard
const getAllPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = paymentQuerySchema.safeParse({ query: req.query });
        if (!validation.success) throw validation.error;

        const result = await paymentService.getAllPayments(validation.data.query);
        res.status(200).json({
            success: true,
            message: `Payment details fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get payment stats for admin dashboard
const getPaymentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await paymentService.getPaymentStats();
        res.status(200).json({
            success: true,
            message: `Payment statistics fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// verify payment transaction when payment is pending
const verifyPaymentTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = verifyPaymentSchema.safeParse({ params: req.params, body: req.body });
        if (!validation.success) throw validation.error;

        const { id } = validation.data.params;
        const { status } = validation.data.body;

        console.log(id, status)

        const result = await paymentService.verifyPaymentTransaction(id, status);
        res.status(200).json({
            success: true,
            message: `Payment marked as ${status.toLowerCase()} successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

// get payment details by payment id
const getPaymentAccountDetailsById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = paymentAccountDetailsSchema.safeParse({ params: req.params });
        if (!validation.success) throw validation.error;

        const { id } = validation.data.params;

        const result = await paymentService.getPaymentAccountDetailsById(id as string);
        res.status(200).json({
            success: true,
            message: `Payment details fetched successfully.`,
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}


const paymentController = {
    getAccountDetails,
    getAllPaymentAccount,
    createPaymentAccount,
    updatePaymentAccount,
    getAllPayments,
    getPaymentStats,
    verifyPaymentTransaction,
    getPaymentAccountDetailsById
}

export default paymentController;