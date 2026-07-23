"use client";

import Link from "next/link";
import { useState } from "react";
import { OwnerRegistrationForm } from "@/components/auth/owner-registration-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TrialSection() {
  const [showRegistration, setShowRegistration] = useState(false);

  return (
    <section id="trial" className="mt-12 rounded-xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">For restaurants</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Try FlickOrder free for 3 days.</h2>
          <p className="mt-4 text-sm leading-7 text-zinc-300">
            Register your restaurant, generate table QR menus, manage orders, and explore the owner dashboard before
            choosing a paid plan.
          </p>
          {!showRegistration ? (
            <Button
              type="button"
              variant="glass"
              size="sm"
              className="mt-6"
              onClick={() => setShowRegistration(true)}
            >
              Start free trial
            </Button>
          ) : null}
          <p className="mt-4 text-sm text-zinc-300">
            Already have an account?{" "}
            <Link href="/auth/owner" className="font-semibold text-white underline underline-offset-4">
              Login
            </Link>
          </p>
        </div>

        {showRegistration ? (
          <Card className="border-0 bg-white">
            <OwnerRegistrationForm />
          </Card>
        ) : null}
      </div>
    </section>
  );
}
