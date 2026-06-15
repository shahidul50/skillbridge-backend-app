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
        limit: z.string().optional().transform((val) => (val ? Number(val) : 12)),
        sortBy: z.enum(["createdAt", "highest-rated", "low-to-high", "high-to-low", "most-reviews"]).optional().default("createdAt"),
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
        categoryId: z.array(z.string().uuid("Invalid Category ID")).min(1, "At least one category is required").max(1, "Only one category can be added at a time"),
    }),
});

// Validation schema for creating tutor exception
export const createTutorExceptionSchema = z.object({
    body: z.object({
        // ISO Date format (e.g., "2026-02-15")
        date: z.string({
            error: "Date is required",
        }).refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format. Use YYYY-MM-DD",
        }),
        reason: z.string({
            error: "Reason is required",
        }).min(5, "Reason must be at least 5 characters long"),
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

// Validation schema for updating weekly availability slot
export const updateWeeklyAvailabilitySchema = z.object({
    params: z.object({
        id: z.uuid("Invalid Slot ID format"),
    }),
    body: z.object({
        isActive: z.boolean(),
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
        page: z.string().optional().transform((val) => (val ? Number(val) : 1)),
        limit: z.string().optional().transform((val) => (val ? Number(val) : 10)),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        searchTerm: z.string().optional(), // student name, subject and date searching
        status: z.enum(["CONFIRMED", "COMPLETED"]).optional(),
    }),
});


//validation schema for updating booking status marked as 'COMPLETED'
export const updateBookingStatusByTutorSchema = z.object({
    params: z.object({
        bookingId: z.string({ error: "Booking ID is required in query params" })
    }),
    body: z.object({
        status: z.enum(["CONFIRMED", "COMPLETED"]),
        meetingLink: z.string().optional(),
    }).refine((data) => data.status === "COMPLETED" ? data.meetingLink : true, {
        message: "Meeting link is required when status is COMPLETED",
        path: ["meetingLink"],
    })
});

// Validation schema for deleting tutor exception
export const deleteTutorExceptionSchema = z.object({
    params: z.object({
        id: z.uuid("Invalid Exception ID format"),
    }),
});

// Validation schema for tutor dashboard query
export const getDashboardRevenueTrendsQuerySchema = z.object({
    query: z.object({
        trendPeriod: z.enum(["one-week", "one-month", "three-month", "six-month", "this-year", "all-time"]).optional().default("six-month"),
    }),
});

// Validation schema for tutor schedule events query
export const scheduleEventsQuerySchema = z.object({
    query: z.object({
        startDate: z.string({ error: "Start date is required" }).min(1, "Start date is required"),
        endDate: z.string({ error: "End date is required" }).min(1, "End date is required"),
    }),
});
