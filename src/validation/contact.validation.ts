import { z } from "zod";

export const contactMessageBodySchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.email("Invalid email address").min(1, "Email is required"),
  role: z.enum(["STUDENT", "TUTOR"]),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(1, "Message is required"),
});