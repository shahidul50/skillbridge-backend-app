import { z } from "zod";

export const createBookingSchema = z.object({
    tutorProfileId: z.uuid("Invalid Tutor ID"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date format"),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid Time format"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid Time format"),
});