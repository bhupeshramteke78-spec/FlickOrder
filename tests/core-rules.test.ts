import { describe, expect, it } from "vitest";
import { getMinimumPlanForFeature, getPlanAmount, getPlanRules } from "@/lib/billing-plans";
import { getMatchingFoodImages } from "@/lib/food-images";
import { extractCoordinatesFromGoogleMapsUrl, isGoogleMapsUrl } from "@/lib/maps";
import { getAllowedOrderStatuses, hasPermission } from "@/lib/permissions";
import { safeCompare } from "@/lib/super-admin";
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

  it("calculates monthly and yearly subscription pricing with ~20% discount", () => {
    expect(getPlanAmount("basic", "MONTHLY")).toBe(299);
    expect(getPlanAmount("basic", "YEARLY")).toBe(2990);
    expect(getPlanAmount("growth", "MONTHLY")).toBe(799);
    expect(getPlanAmount("growth", "YEARLY")).toBe(7990);
    expect(getPlanAmount("pro", "MONTHLY")).toBe(1499);
    expect(getPlanAmount("pro", "YEARLY")).toBe(14990);
  });
});

describe("restaurant role permissions", () => {
  it("keeps billing owner-only and scopes operational staff", () => {
    expect(hasPermission("OWNER", "manageBilling")).toBe(true);
    expect(hasPermission("MANAGER", "manageBilling")).toBe(false);
    expect(hasPermission("KITCHEN", "viewKitchen")).toBe(true);
    expect(hasPermission("KITCHEN", "viewBilling")).toBe(false);
    expect(getAllowedOrderStatuses("WAITER")).toEqual(["READY"]);
    expect(getAllowedOrderStatuses("KITCHEN")).toEqual(["ACCEPTED", "PREPARING"]);
  });
});

describe("super admin constant-time string comparison", () => {
  it("compares strings securely and accurately", () => {
    expect(safeCompare("supersecretpassword123", "supersecretpassword123")).toBe(true);
    expect(safeCompare("supersecretpassword123", "wrongpassword")).toBe(false);
    expect(safeCompare("short", "muchlongerexpectedstring")).toBe(false);
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

describe("smart food image suggestion matcher", () => {
  it("finds matching food images by Indian dish keyword or category", () => {
    const paneerMatches = getMatchingFoodImages("Paneer Butter Masala", "Curries");
    expect(paneerMatches.length).toBeGreaterThanOrEqual(3);
    expect(paneerMatches[0].id).toContain("paneer_butter_masala");

    const biryaniMatches = getMatchingFoodImages("Hyderabadi Chicken Biryani", "Rice");
    expect(biryaniMatches.length).toBeGreaterThanOrEqual(3);
    expect(biryaniMatches[0].id).toContain("chicken_biryani");

    const dosaMatches = getMatchingFoodImages("Mysore Masala Dosa", "South Indian");
    expect(dosaMatches.length).toBeGreaterThanOrEqual(3);
    expect(dosaMatches[0].id).toContain("masala_dosa");

    const choleMatches = getMatchingFoodImages("Amritsari Chole Bhature");
    expect(choleMatches.length).toBeGreaterThanOrEqual(3);
    expect(choleMatches[0].id).toContain("chole_bhature");

    const chaiMatches = getMatchingFoodImages("Adrak Masala Chai", "Beverages");
    expect(chaiMatches.length).toBeGreaterThanOrEqual(3);
    expect(chaiMatches[0].id).toContain("masala_chai");

    const categoryFallbackMatches = getMatchingFoodImages("Chef Special Dish", "South Indian");
    expect(categoryFallbackMatches.length).toBeGreaterThanOrEqual(3);
  });
});
