"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        toast.error(error.message);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
      <label className="floating-field">
        <Input className="floating-input" type="email" placeholder=" " {...form.register("email")} />
        <span className="floating-label">Email</span>
        {form.formState.errors.email?.message ? (
          <span className="mt-1 block text-xs text-rose-500">{form.formState.errors.email.message}</span>
        ) : null}
      </label>
      <label className="floating-field">
        <Input className="floating-input" type="password" placeholder=" " {...form.register("password")} />
        <span className="floating-label">Password</span>
        {form.formState.errors.password?.message ? (
          <span className="mt-1 block text-xs text-rose-500">{form.formState.errors.password.message}</span>
        ) : null}
      </label>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Login
      </Button>
    </form>
  );
}
