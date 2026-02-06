import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { BetterAuthError } from "better-auth";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Set default values
    let statusCode = err.statusCode ?? 500;
    let message = err.message ?? "An unexpected error occurred.";
    let errorCode = err.code ?? "INTERNAL_SERVER_ERROR";
    let errorDetails = err;


    // --- CUSTOM APP ERROR (My created error) ---
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        errorCode = err.code;

    }

    //-- Multer File Upload Errors --
    else if (err.name === 'MulterError') {
        statusCode = 400;
        errorCode = 'FILE_UPLOAD_ERROR';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size is too large. Maximum limit is 3MB.';
        } else {
            message = err.message;
        }
    }
    // --- DATABASE CONNECTION API ERRORS ---
    else if (err.body?.code === 'FAILED_TO_GET_SESSION' || err?.code === 'ECONNREFUSED') {
        statusCode = 503;
        errorCode = "DATABASE_CONNECTION_ERROR";
        message = "Could not connect to the database. Please ensure your database server is running.";
    }

    // --- ZOD VALIDATION ERRORS ---
    else if (err instanceof ZodError) {
        statusCode = 400;
        errorCode = "VALIDATION_ERROR";

        message = err.issues.map(issue => issue.message).join(", ");


        errorDetails = err.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
        }));
    }

    // --- BETTER-AUTH ERRORS ---
    else if (err instanceof APIError || err.name === "BetterAuthError") {
        statusCode = err.status || 401;
        errorCode = err.code || "AUTH_ERROR";

        if (err.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
            message = "This email is already registered.";
        }
    }

    else if (err?.code === 'INVALID_EMAIL_OR_PASSWORD') {
        statusCode = 401;
        errorCode = 'INVALID_EMAIL_OR_PASSWORD';
        message = 'Invalid email or password. Please try again.';
    }

    // --- PRISMA CLIENT ERRORS ---
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

    // --- PRISMA VALIDATION OR CONNECTION ---
    else if (err instanceof Prisma.PrismaClientValidationError) {
        errorCode = "PRISMA_VALIDATION_ERROR";
        statusCode = 400;
        message = "Invalid data format. Please check your input.";
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