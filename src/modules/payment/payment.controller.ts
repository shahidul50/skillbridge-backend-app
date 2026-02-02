import { NextFunction, Request, Response } from "express";
import paymentService from "./payment.service";

//get all tutors with pagination, search and filtering.
const submitPaymentDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await paymentService.submitPaymentDetails();
        res.status(200).json({
            success: true,
            message: 'Payment details submitted successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const paymentController = {

}

export default paymentController;