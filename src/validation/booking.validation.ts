import { z } from "zod";

export const createBookingSchema = z.object({
    tutorProfileId: z.uuid("Invalid Tutor ID"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date format"),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid Time format"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid Time format"),
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