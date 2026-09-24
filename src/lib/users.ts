import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(120, "Name is too long.");

const lastNameSchema = z
  .string()
  .trim()
  .min(1, "Last name is required.")
  .max(120, "Last name is too long.");

const emailSchema = z.email("Enter a valid email.").trim().toLowerCase();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  lastName: lastNameSchema,
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  id: z.string().min(1, "Missing user."),
  email: emailSchema,
  name: nameSchema,
  lastName: lastNameSchema,
  password: passwordSchema.optional(),
});
