import { z } from "zod";

export const updateUserProfileSchema = z.object({
    body: z.object({
        name: z.string().min(3, "Name must be at least 3 characters").optional(),
        phoneNumber: z.string().min(11, "Invalid phone number").optional(),
    }),
});

export const userQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("10"),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        searchTerm: z.string().optional(),
        role: z.string().optional().transform((val) => val?.toUpperCase()),
        isActive: z.enum(["true", "false"]).optional(),
    }),
});

export const bannedUserSchema = z.object({
    params: z.object({
        id: z.string({
            error: "User ID is required",
        }),
    }),
    body: z.object({
        isActive: z.boolean({
            error: "isActive status is required",
        }),
    }),
});