import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Set default values
    let statusCode = err.statusCode || 500;
    let message = err.message || "An unexpected error occurred.";
    let errorCode = err.code || "INTERNAL_SERVER_ERROR";
    let errorDetails = err;

    // --- ১. CUSTOM APP ERROR (My created error) ---
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        errorCode = err.code;
    }

    // --- ২. ZOD VALIDATION ERRORS ---
    else if (err instanceof ZodError) {
        statusCode = 400;
        errorCode = "VALIDATION_ERROR";

        message = err.issues
            .map((issue) => `${issue.path.join(".")} is ${issue.message.toLowerCase()}`)
            .join(", ");

        errorDetails = err.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
        }));
    }

    // --- ৩. BETTER-AUTH ERRORS ---
    else if (err instanceof APIError || err.name === "BetterAuthError") {
        statusCode = err.status || 401;
        errorCode = err.code || "AUTH_ERROR";

        if (err.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
            message = "This email is already registered.";
        }
    }

    // --- ৪. PRISMA CLIENT ERRORS ---
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        errorCode = `PRISMA_${err.code}`;
        switch (err.code) {
            case 'P2002':
                statusCode = 400;
                message = `Duplicate entry found for ${err.meta?.target || "field"}.`;
                break;
            case 'P2025':
                statusCode = 404;
                message = "The requested record was not found.";
                break;
            default:
                statusCode = 400;
        }
    }

    // --- ৫. PRISMA VALIDATION OR CONNECTION ---
    else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = "Invalid data format provided to database.";
    }

    // --- FINAL JSON RESPONSE ---
    const isDev = process.env.NODE_ENV === 'development';

    res.status(statusCode).json({
        success: false,
        code: errorCode,
        message: message,
        // Only include detailed error info in development mode
        error: isDev ? errorDetails : {},
        stack: isDev ? err.stack : undefined
    });
};

export default errorHandler;