import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

const notFound = (req: Request, res: Response, next: NextFunction) => {
    // Message for the not found error
    const message = `Cannot find ${req.originalUrl} on this server!`;

    const error = new AppError(message, 404, "ROUTE_NOT_FOUND");

    next(error);
};

export default notFound;