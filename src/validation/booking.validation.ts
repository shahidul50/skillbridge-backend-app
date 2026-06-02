import { z } from "zod";

export const createBookingSchema = z.object({
    tutorProfileId: z.uuid("Invalid Tutor ID"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date format"),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid Time format"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid Time format"),
    paymentMethod: z.enum(["BKASH", "NAGAD", "ROCKET"]),
    transactionId: z.string().min(6, "Transaction ID is too short"),
});

export const bookingQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        searchTerm: z.string().optional(),
        status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
    }),
});


export const cancelBookingSchema = z.object({
    params: z.object({
        id: z.uuid("Invalid Booking ID format"),
    }),
});


export const adminBookingQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        searchTerm: z.string().optional(), // for searching student name, email or tutor name, email, category name
        bookingStatus: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
    }),
});

export const adminBookingReceiptSchema = z.object({
    params: z.object({
        id: z.string({
            error: "Booking ID is required",
        }),
    }),
});

