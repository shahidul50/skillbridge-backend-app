import { z } from "zod";

export const updateUserProfileSchema = z.object({
    body: z.object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        phoneNumber: z.string().min(11, "Invalid phone number").optional(),
    }),
});