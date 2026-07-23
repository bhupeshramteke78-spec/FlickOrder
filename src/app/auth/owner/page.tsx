import { OwnerRegistrationForm } from "@/components/auth/owner-registration-form";
import { LoginForm } from "@/components/auth/login-form";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Card } from "@/components/ui/card";

export default function OwnerAuthPage() {
  return (
    <main className="customer-surface min-h-screen text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-[1fr_0.82fr]">
        <section>
          <p className="text-sm font-medium text-emerald-200">Restaurant owner access</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Create your restaurant and start a real 3-day trial.</h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Registration creates the Supabase Auth user, owner profile, restaurant, membership, subscription, and settings in one validated flow.
          </p>
          <Card className="auth-form-card mt-8">
            <div className="mb-5">
              <p className="auth-title-pulse text-2xl font-semibold text-emerald-700">Register</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Start your restaurant trial with real QR ordering, table management, UPI settings, and owner access.
              </p>
            </div>
            <OwnerRegistrationForm />
          </Card>
        </section>
        <Card className="auth-form-card self-start">
          <h2 className="auth-title-pulse text-xl font-semibold text-emerald-700">Owner login</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Use Supabase Auth credentials. Passwords are never stored in FlickOrder tables.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </Card>
      </div>
      <MarketingFooter />
    </main>
  );
}
