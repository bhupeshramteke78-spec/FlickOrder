"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { restaurantRegistrationSchema, type RestaurantRegistrationInput } from "@/lib/validations/auth";

const fields: Array<{ name: keyof RestaurantRegistrationInput; label: string; type?: string; placeholder: string }> = [
  { name: "ownerName", label: "Owner name", placeholder: "Aarav Mehta" },
  { name: "restaurantName", label: "Restaurant name", placeholder: "The Copper Table" },
  { name: "restaurantType", label: "Restaurant type", placeholder: "Family restaurant" },
  { name: "cuisine", label: "Cuisine", placeholder: "North Indian, Chinese" },
  { name: "email", label: "Email", type: "email", placeholder: "owner@restaurant.com" },
  { name: "phone", label: "Phone", placeholder: "+91 98765 43210" },
  { name: "password", label: "Password", type: "password", placeholder: "Minimum 8 characters" },
  { name: "city", label: "City", placeholder: "Mumbai" },
  { name: "state", label: "State", placeholder: "Maharashtra" },
  { name: "address", label: "Address", placeholder: "Street, landmark, locality" },
  { name: "upiId", label: "UPI ID", placeholder: "restaurant@oksbi" },
  { name: "upiDisplayName", label: "UPI display name", placeholder: "The Copper Table" },
  { name: "fssaiNumber", label: "FSSAI number", placeholder: "12345678901234" },
  { name: "googleMapsUrl", label: "Google Maps URL", placeholder: "https://maps.google.com/..." },
  { name: "storefrontPhotoUrl", label: "Storefront photo URL", placeholder: "https://..." },
  { name: "businessProofUrl", label: "Business proof URL", placeholder: "https://..." },
];

async function readErrorMessage(response: Response) {
  const fallback = response.statusText || "Registration failed.";
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    return text.trim() || fallback;
  }

  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function OwnerRegistrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<RestaurantRegistrationInput>({
    resolver: zodResolver(restaurantRegistrationSchema),
  });

  async function onSubmit(values: RestaurantRegistrationInput) {
    setIsSubmitting(true);
    const response = await fetch("/api/auth/register-restaurant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      toast.error(await readErrorMessage(response));
      return;
    }

    toast.success("Restaurant created. Verification is pending.");
    router.push("/dashboard");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.name} className={`floating-field ${field.name === "address" ? "sm:col-span-2" : ""}`}>
          <Input className="floating-input" type={field.type} placeholder=" " {...form.register(field.name)} />
          <span className="floating-label">{field.label}</span>
          {form.formState.errors[field.name]?.message ? (
            <span className="mt-1 block text-xs text-rose-300">{form.formState.errors[field.name]?.message}</span>
          ) : null}
        </label>
      ))}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create restaurant
        </Button>
      </div>
    </form>
  );
}
