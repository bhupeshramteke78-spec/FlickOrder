"use client";

import { Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

export function CustomerAuthPanel({
  initialMode,
  redirectTo,
}: {
  initialMode: AuthMode;
  redirectTo: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const registration = await fetch("/api/auth/register-customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, phone, email, password, redirectTo }),
        });
        const registrationBody = (await registration.json().catch(() => null)) as {
          error?: string;
          requiresEmailConfirmation?: boolean;
        } | null;

        if (!registration.ok) {
          toast.error(registrationBody?.error ?? "Unable to create your account.");
          return;
        }

        if (registrationBody?.requiresEmailConfirmation) {
          toast.success("Account created. Confirm the link sent to your email, then continue.");
          setMode("login");
          return;
        }
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(mode === "register" ? "Account created" : "Welcome back");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 text-zinc-950 shadow-2xl sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          {mode === "login" ? <LockKeyhole className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-700">Customer account</p>
          <h1 className="text-2xl font-semibold">{mode === "login" ? "Sign in to book" : "Create your account"}</h1>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-500">
        Reservations and their updates stay securely connected to your account across devices.
      </p>

      <div className="mt-6 grid grid-cols-2 rounded-lg bg-zinc-100 p-1">
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`h-10 rounded-md text-sm font-semibold transition ${
              mode === item ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {item === "login" ? "Login" : "Register"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-3">
        {mode === "register" ? (
          <>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-zinc-700">Full name</span>
              <Input required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-zinc-700">Mobile number</span>
              <Input required type="tel" minLength={7} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
            </label>
          </>
        ) : null}
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-zinc-700">Email</span>
          <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-zinc-700">Password</span>
          <Input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </label>
        <Button type="submit" className="mt-2 h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "login" ? "Login and continue" : "Create account and continue"}
        </Button>
      </form>
    </div>
  );
}
