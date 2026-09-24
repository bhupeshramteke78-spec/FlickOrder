import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, QrCode, ShieldCheck, Utensils } from "lucide-react";
import { CustomerAuthPanel } from "@/components/auth/customer-auth-panel";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerAuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const mode = getParam(params.mode) === "register" ? "register" : "login";
  const redirectTo = safeRedirect(getParam(params.returnTo));
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (auth.user) {
    redirect(redirectTo);
  }

  return (
    <main className="customer-surface min-h-screen text-white">
      <section className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <Link href="/restaurants/search" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />Explore restaurants
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase text-orange-400">KhaoScan for diners</p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">Your dining orders, available wherever you sign in.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">
            Create one customer account to view live orders, track receipts, and enjoy seamless contactless dining across all verified restaurants.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Feature icon={Utensils} title="Live Menu Access" />
            <Feature icon={ShieldCheck} title="Verified Payments" />
            <Feature icon={QrCode} title="Instant QR Ordering" />
          </div>
        </div>
        <CustomerAuthPanel initialMode={mode} redirectTo={redirectTo} />
      </section>
      <MarketingFooter />
    </main>
  );
}

function Feature({ icon: Icon, title }: { icon: typeof Utensils; title: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <Icon className="h-5 w-5 text-emerald-300" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
    </div>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function safeRedirect(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/restaurants/search";
}
