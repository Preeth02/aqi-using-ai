import { z } from "zod";

export const usernameValidation = z
  .string()
  .min(3, "Username must be atleast 3 characters")
  .max(50, "Username should not be more thane 50 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username must not contain any special characters");

export const signUpSchema = z.object({
  username: usernameValidation,
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be atleast 8 characters" }),
});
