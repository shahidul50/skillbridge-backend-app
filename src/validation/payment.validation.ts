import { z } from "zod";

export const paymentSchema = z.object({
    body: z.object({
        bookingId: z.uuid("Invalid Booking ID"),
        paymentMethod: z.enum(["BKASH", "NAGAD", "ROCKET"]),
        transactionId: z.string().min(6, "Transaction ID is too short")
    }),
});

export const paymentAccountSchema = z.object({
    body: z.object({
        method: z.enum(["BKASH", "NAGAD", "ROCKET"]),
        accountNumber: z.string()
            .min(11, "Account number must be at least 11 digits")
            .max(15, "Account number is too long")
    }),
});

export const paymentAccountQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        sortBy: z.string().optional().default("method"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
        searchTerm: z.string().optional(),
        method: z.string().optional(), // BKASH, NAGAD etc.
        isActive: z.enum(["true", "false"]).optional(),
    }),
});


//for admin route get all payments
export const paymentQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        sortBy: z.string().optional().default("submittedAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        searchTerm: z.string().optional(),
        paymentMethod: z.string().optional().transform(val => val?.toUpperCase()),
        status: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]).optional(),
    }),
});

export const verifyPaymentSchema = z.object({
    params: z.object({
        id: z.string({ error: "Payment ID is required" }),
    }),
    body: z.object({
        status: z.enum(["SUCCESS", "FAILED"], {
            error: "Verification status (SUCCESS/FAILED) is required",
        }),
    }),
});