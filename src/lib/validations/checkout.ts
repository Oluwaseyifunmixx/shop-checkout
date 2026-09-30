import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{9,14}$/, "Enter a valid phone number"),
  address: z.string().trim().min(5, "Enter your delivery address").max(200),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Enter your state").max(60),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;