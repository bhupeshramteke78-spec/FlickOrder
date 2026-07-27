import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createBookingSchema = z.object({
  restaurantSlug: z.string().min(2).max(160),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(7).max(20),
  partySize: z.number().int().min(1).max(100),
  bookingDate: z.string().regex(datePattern),
  bookingTime: z.string().regex(timePattern),
  specialRequest: z.string().trim().max(500).optional().nullable(),
});

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  declineReason: z.string().trim().max(300).optional().nullable(),
});
