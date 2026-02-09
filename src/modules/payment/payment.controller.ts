import { NextFunction, Request, Response } from "express";
import paymentService from "./payment.service";
import { paymentAccountSchema, paymentSchema } from "../../validation/payment.validation";

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

//create payment account details
const createPaymentAccountDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //zod validation
        const validation = paymentAccountSchema.safeParse({ body: req.body });
        if (!validation.success) throw validation.error

        const result = await paymentService.createPaymentAccountDetails(validation.data.body);
        res.status(201).json({
            success: true,
            message: 'Payment Account details created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

//submit payment of created booking 
const submitPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user?.id;

        //zod validation
        const validation = paymentSchema.safeParse({ body: req.body });

        if (!validation.success) throw validation.error;

        const result = await paymentService.submitPayment(studentId as string,
            validation.data.body);
        res.status(201).json({
            success: true,
            message: 'Payment details submitted successfully. Waiting for admin verification.',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const paymentController = {
    submitPayment,
    getAccountDetails,
    createPaymentAccountDetails
}

export default paymentController;