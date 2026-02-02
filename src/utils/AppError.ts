export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, code: string = "APP_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}