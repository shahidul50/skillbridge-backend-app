import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string({
        error: "Category name is required!",
    }).min(3, "Name must be at least 3 characters!"),
});