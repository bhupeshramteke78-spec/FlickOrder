"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function CustomerAccountActions() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await createClient().auth.signOut();
    setIsSigningOut(false);

    if (error) {
      toast.error("Unable to sign out.");
      return;
    }

    router.push("/restaurants/search");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isSigningOut}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
