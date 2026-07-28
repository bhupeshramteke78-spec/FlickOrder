import { describe, expect, it } from "vitest";
import { getMinimumPlanForFeature, getPlanRules } from "@/lib/billing-plans";
import { extractCoordinatesFromGoogleMapsUrl, isGoogleMapsUrl } from "@/lib/maps";
import { getAllowedOrderStatuses, hasPermission } from "@/lib/permissions";
import { restaurantRegistrationSchema } from "@/lib/validations/auth";

describe("subscription feature rules", () => {
  it("keeps Basic operational and reserves reporting for higher plans", () => {
    expect(getPlanRules("basic").qrOrdering).toBe(true);
    expect(getPlanRules("basic").analytics).toBe(false);
    expect(getPlanRules("growth").orderHistory).toBe(true);
    expect(getPlanRules("growth").orderHistorySearch).toBe(false);
    expect(getPlanRules("pro").orderHistorySearch).toBe(true);
    expect(getMinimumPlanForFeature("advancedReporting")).toBe("Pro");
  });
});

describe("restaurant role permissions", () => {
  it("keeps billing owner-only and scopes operational staff", () => {
    expect(hasPermission("OWNER", "manageBilling")).toBe(true);
    expect(hasPermission("MANAGER", "manageBilling")).toBe(false);
    expect(hasPermission("KITCHEN", "viewKitchen")).toBe(true);
    expect(hasPermission("KITCHEN", "viewBilling")).toBe(false);
    expect(getAllowedOrderStatuses("WAITER")).toEqual(["SERVED"]);
  });
});

describe("registration validation", () => {
  it("rejects incomplete or insecure registration details", () => {
    const result = restaurantRegistrationSchema.safeParse({
      ownerName: "B",
      restaurantName: "",
      restaurantType: "Cafe",
      cuisine: "Indian",
      email: "not-email",
      phone: "",
      password: "short",
      city: "Pune",
      state: "Maharashtra",
      address: "Main road",
      upiId: "cafe@upi",
      upiDisplayName: "Cafe",
      fssaiNumber: "12345678901234",
      googleMapsUrl: "http://example.com",
    });

    expect(result.success).toBe(false);
  });
});

describe("Google Maps location parsing", () => {
  it("accepts Google Maps HTTPS links and extracts coordinates", () => {
    const url = "https://www.google.com/maps/place/Test/@18.5204,73.8567,17z";
    expect(isGoogleMapsUrl(url)).toBe(true);
    expect(extractCoordinatesFromGoogleMapsUrl(url)).toEqual({
      latitude: 18.5204,
      longitude: 73.8567,
    });
  });
});
