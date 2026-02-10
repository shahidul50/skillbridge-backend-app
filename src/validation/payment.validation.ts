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