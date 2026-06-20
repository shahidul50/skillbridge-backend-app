import { z } from "zod";

export const getAllBookingWIthReviewValidationSchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        searchTerm: z.string().optional(),
        reviewStatus: z.enum(["Reviewed", "Unreviewed"]).optional()
    }),
});
export const reviewValidationSchema = z.object({
    body: z.object({
        bookingId: z.string({ error: "Booking ID is required" }),
        rating: z.number()
            .int()
            .min(1, "Rating must be at least 1")
            .max(5, "Rating cannot be more than 5"),
        comment: z.string().optional().default(""),
    }),
});