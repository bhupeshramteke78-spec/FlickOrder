export type StaffRole = "chef" | "waiter";

export type StaffSession = {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  role: StaffRole;
  date: string; // YYYY-MM-DD
};

export type RestaurantStaffPins = {
  kitchenPin: string;
  waiterPin: string;
};

export type StoredStaffPins = {
  kitchenPin?: string;
  waiterPin?: string;
  updatedAtDate?: string; // YYYY-MM-DD
  lastResetTimestamp?: number; // Epoch ms
};

export type StaffPinsSaveResult = {
  success: boolean;
  cooldownRemainingSeconds?: number;
  lastResetTimestamp?: number;
  error?: string;
};

export const PIN_RESET_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
