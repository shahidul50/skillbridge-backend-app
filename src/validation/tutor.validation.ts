import { z } from "zod";

// Validation schema for updating tutor profile
export const updateTutorSchema = z.object({
    body: z.object({
        name: z.string().min(3).optional(),
        phoneNumber: z.string().optional(),
        title: z.string().min(5).optional(),
        bio: z.string().min(20).optional(),
        hourlyRate: z.string().transform((val) => Number(val)).optional(),
        experience: z.string().optional(),
    }),
});

// Validation schema for tutor query parameters
export const tutorQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? Number(val) : 1)),
        limit: z.string().optional().transform((val) => (val ? Number(val) : 10)),
        sortBy: z.enum(["hourlyRate", "rating", "createdAt"]).optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
        searchTerm: z.string().optional(),
        categories: z.string().optional(), // (e.g., "Math,Physics")
        minPrice: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
        maxPrice: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
        minRating: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
    }),
});

// Validation schema for setting tutor categories
export const setTutorCategoriesSchema = z.object({
    body: z.object({
        categoryId: z.array(z.string().uuid("Invalid Category ID")).min(1, "At least one category is required"),
    }),
});

// Validation schema for creating tutor exception
export const createTutorExceptionSchema = z.object({
    body: z.object({
        // ISO Date format (e.g., "2026-02-15")
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format. Use YYYY-MM-DD",
        }),
        reason: z.string().min(5, "Reason must be at least 5 characters long").optional(),
    }),
});

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Validation schema for creating weekly availability slot
export const createWeeklyAvailabilitySchema = z.object({
    body: z.object({
        dayOfWeek: z.enum(daysOfWeek as [string, ...string[]], {
            message: "Invalid day of the week",
        }),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
    }).refine((data) => data.startTime < data.endTime, {
        message: "End time must be after start time",
        path: ["endTime"],
    }),
});

// Validation schema for deleting weekly availability slot
export const deleteWeeklyAvailabilitySchema = z.object({
    params: z.object({
        id: z.uuid("Invalid Slot ID format"),
    }),
});

// Validation schema for getting available slots
export const getAvailableSlotsSchema = z.object({
    query: z.object({
        tutorProfileId: z.uuid("Invalid Tutor ID"),
        startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date").optional(),
    }),
});

//validation schema for getting tutor sessions
export const tutorSessionQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        searchTerm: z.string().optional(), // student name searching
        status: z.enum(["CONFIRMED", "COMPLETED"]).optional(),
        availabilitySlotDate: z.string().optional(), // YYYY-MM-DD format
    }),
});


//validation schema for updating booking status marked as 'COMPLETED'
export const updateBookingStatusByTutorSchema = z.object({
    params: z.object({
        bookingId: z.string({ error: "Booking ID is required in query params" })
    })
});