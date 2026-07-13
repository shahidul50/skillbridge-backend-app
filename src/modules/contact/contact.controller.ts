import { Request, Response, NextFunction } from "express"
import { contactService } from "./contact.service";
import { contactMessageBodySchema } from "../../validation/contact.validation";
import { TContactMessageBody } from "../../types/contact.type";

 
const createContactMessage = async(req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(req.body);

        //zod validation
        const validation = contactMessageBodySchema.safeParse(req.body);
        if (!validation.success) throw validation.error;

        const result = await contactService.createContactMessage(validation.data as TContactMessageBody);
        res.status(201).json({
            success: true,
            message: 'Contact message send successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

export const contactController = {createContactMessage}