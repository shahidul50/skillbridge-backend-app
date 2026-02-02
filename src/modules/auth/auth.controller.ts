import { NextFunction, Request, Response } from "express";

const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {

    } catch (err: any) {
        next(err);
    }
}

export default getUserProfile;