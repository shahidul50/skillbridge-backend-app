import { z } from "zod";

export const reviewValidationSchema = z.object({
    body: z.object({
        bookingId: z.string({ error: "Booking ID is required" }),
        rating: z.number()
            .int()
            .min(1, "Rating must be at least 1")
            .max(5, "Rating cannot be more than 5"),
        comment: z.string().optional(),
    }),
});