import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string({
        error: "Category name is required!",
    }).min(3, "Name must be at least 3 characters!"),
});

export const categoryQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => (val ? Number(val) : 1)),
        limit: z.string().optional().transform((val) => (val ? Number(val) : 10)),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
        searchTerm: z.string().optional(),
    }),
});