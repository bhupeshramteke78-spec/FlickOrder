import { z } from "zod";
import { isGoogleMapsUrl, normalizeGoogleMapsUrl } from "@/lib/maps";

const optionalUrlSchema = z.string().url().optional().or(z.literal(""));
const optionalGoogleMapsUrlSchema = optionalUrlSchema.refine((value) => {
  const normalized = normalizeGoogleMapsUrl(value);

  return !normalized || isGoogleMapsUrl(normalized);
}, "Use a valid Google Maps link.");

export const restaurantRegistrationSchema = z.object({
  ownerName: z.string().min(2).max(120),
  restaurantName: z.string().min(2).max(140),
  restaurantType: z.string().min(2).max(80),
  cuisine: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(128),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  address: z.string().min(6).max(400),
  upiId: z.string().min(3).max(120),
  upiDisplayName: z.string().min(2).max(120),
  fssaiNumber: z.string().min(6).max(30),
  googleMapsUrl: optionalGoogleMapsUrlSchema,
  storefrontPhotoUrl: optionalUrlSchema,
  businessProofUrl: optionalUrlSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RestaurantRegistrationInput = z.infer<typeof restaurantRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
