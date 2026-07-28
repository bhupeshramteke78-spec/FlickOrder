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

const fields: Array<{ name: keyof RestaurantRegistrationInput; label: string; type?: string; placeholder: string; required?: boolean }> = [
  { name: "ownerName", label: "Owner name", placeholder: "Aarav Mehta", required: true },
  { name: "restaurantName", label: "Restaurant name", placeholder: "The Copper Table", required: true },
  { name: "restaurantType", label: "Restaurant type", placeholder: "Family restaurant", required: true },
  { name: "cuisine", label: "Cuisine", placeholder: "North Indian, Chinese", required: true },
  { name: "email", label: "Email", type: "email", placeholder: "owner@restaurant.com", required: true },
  { name: "phone", label: "Phone", placeholder: "+91 98765 43210", required: true },
  { name: "password", label: "Password", type: "password", placeholder: "Minimum 8 characters", required: true },
  { name: "city", label: "City", placeholder: "Mumbai", required: true },
  { name: "state", label: "State", placeholder: "Maharashtra", required: true },
  { name: "address", label: "Address", placeholder: "Street, landmark, locality", required: true },
  { name: "upiId", label: "UPI ID", placeholder: "restaurant@oksbi", required: true },
  { name: "upiDisplayName", label: "UPI display name", placeholder: "The Copper Table", required: true },
  { name: "fssaiNumber", label: "FSSAI number", placeholder: "12345678901234", required: true },
  { name: "googleMapsUrl", label: "Google Maps URL", placeholder: "https://maps.google.com/..." },
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
  const [fssaiCertificate, setFssaiCertificate] = useState<File | null>(null);
  const [storefrontPhoto, setStorefrontPhoto] = useState<File | null>(null);
  const [businessProof, setBusinessProof] = useState<File | null>(null);
  const form = useForm<RestaurantRegistrationInput>({
    resolver: zodResolver(restaurantRegistrationSchema),
  });

  async function onSubmit(values: RestaurantRegistrationInput) {
    if (!fssaiCertificate || !storefrontPhoto) {
      toast.error("Add the FSSAI certificate and a storefront photo before registering.");
      return;
    }

    setIsSubmitting(true);

    try {
      const registration = new FormData();
      Object.entries(values).forEach(([key, value]) => registration.append(key, value ?? ""));
      registration.append("fssaiCertificate", fssaiCertificate);
      registration.append("storefrontPhoto", storefrontPhoto);

      if (businessProof) {
        registration.append("businessProof", businessProof);
      }

      const response = await fetch("/api/auth/register-restaurant", {
        method: "POST",
        body: registration,
      });

      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        return;
      }

      const result = (await response.json()) as { requiresEmailConfirmation?: boolean };
      toast.success(
        result.requiresEmailConfirmation
          ? "Registration received. Confirm your email before signing in."
          : "Restaurant created. Sign in to continue while verification is reviewed.",
      );
      router.push("/auth/owner?mode=login");
      router.refresh();
    } catch {
      toast.error("Registration could not be completed. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.name} className={`floating-field ${field.name === "address" ? "sm:col-span-2" : ""}`}>
          <Input className="floating-input" type={field.type} placeholder=" " {...form.register(field.name)} />
          <span className="floating-label">
            {field.label}
            {field.required ? <span className="ml-0.5 text-red-500">*</span> : null}
          </span>
          {form.formState.errors[field.name]?.message ? (
            <span className="mt-1 block text-xs text-rose-300">{form.formState.errors[field.name]?.message}</span>
          ) : null}
        </label>
      ))}
      <VerificationFileField
        label="FSSAI certificate"
        required
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={setFssaiCertificate}
      />
      <VerificationFileField
        label="Storefront photo"
        required
        accept="image/jpeg,image/png,image/webp"
        onChange={setStorefrontPhoto}
      />
      <VerificationFileField
        label="Business proof"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={setBusinessProof}
      />
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create restaurant
        </Button>
      </div>
    </form>
  );
}

function VerificationFileField({
  label,
  required = false,
  accept,
  onChange,
}: {
  label: string;
  required?: boolean;
  accept: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="grid gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
      <span className="font-medium">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      <Input
        type="file"
        accept={accept}
        required={required}
        className="h-auto border-0 p-0 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <span className="text-xs text-zinc-500">PDF, JPEG, PNG, or WebP. Maximum 1.2 MB.</span>
    </label>
  );
}
