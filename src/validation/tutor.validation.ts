import { z } from "zod";

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

export const setTutorCategoriesSchema = z.object({
    body: z.object({
        categoryId: z.array(z.string().uuid("Invalid Category ID")).min(1, "At least one category is required"),
    }),
});


export const createTutorExceptionSchema = z.object({
    body: z.object({
        // ISO Date format (e.g., "2026-02-15")
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format. Use YYYY-MM-DD",
        }),
        reason: z.string().min(5, "Reason must be at least 5 characters long").optional(),
    }),
});