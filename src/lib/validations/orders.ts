import { z } from "zod";
import { paymentMethods } from "@/lib/constants";

export const orderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().max(500).optional(),
  options: z.array(z.string().max(80)).max(12).default([]),
});

export const createOrderSchema = z.object({
  restaurantSlug: z.string().min(1).max(160),
  tableNumber: z.string().min(1).max(40),
  customerName: z.string().trim().min(2).max(80),
  guestCount: z.number().int().min(1).max(30),
  kitchenNotes: z.string().max(800).optional(),
  items: z.array(orderItemSchema).min(1),
});

export const addOrderItemsSchema = z.object({
  restaurantSlug: z.string().min(1).max(160),
  tableNumber: z.string().min(1).max(40),
  items: z.array(orderItemSchema).min(1),
});

export const confirmPaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentId: z.string().uuid(),
});

export const paymentIntentSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(paymentMethods),
});

export const serviceRequestSchema = z.object({
  restaurantSlug: z.string().min(1).max(160),
  tableNumber: z.string().min(1).max(40),
  orderId: z.string().uuid().optional(),
  type: z.enum(["WATER", "TISSUE", "SPOON", "FORK", "BILL", "WAITER"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>;
