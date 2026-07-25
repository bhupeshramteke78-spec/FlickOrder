import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { OwnerRegistrationForm } from "@/components/auth/owner-registration-form";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Card } from "@/components/ui/card";

type OwnerAuthMode = "login" | "register";

export default async function OwnerAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const mode = getOwnerAuthMode((await searchParams).mode);
  const isRegisterMode = mode === "register";

  return (
    <main className="customer-surface min-h-screen text-white">
      <div className="mx-auto grid min-h-[calc(100vh-22rem)] max-w-5xl place-items-center px-5 py-10">
        <section className="w-full">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-emerald-200">Restaurant owner access</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
              {isRegisterMode ? "Create your restaurant and start a real 3-day trial." : "Login to manage your restaurant."}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
              {isRegisterMode
                ? "Registration creates your owner profile, restaurant, membership, subscription, and settings in one validated flow."
                : "Use your FlickOrder owner credentials to access orders, menus, tables, payments, and restaurant settings."}
            </p>
          </div>

          <div className={`auth-mode-tabs mx-auto mt-8 ${isRegisterMode ? "is-register" : "is-login"}`}>
            <span className="auth-mode-thumb" aria-hidden="true" />
            <Link
              href="/auth/owner?mode=login"
              className={`auth-mode-tab ${
                mode === "login" ? "text-zinc-950" : "text-zinc-300 hover:text-white"
              }`}
            >
              Login
            </Link>
            <Link
              href="/auth/owner?mode=register"
              className={`auth-mode-tab ${
                mode === "register" ? "text-zinc-950" : "text-zinc-300 hover:text-white"
              }`}
            >
              Register
            </Link>
          </div>

          <Card className={`auth-form-card auth-switch-card mx-auto mt-6 max-w-2xl ${isRegisterMode ? "is-register" : "is-login"}`}>
            {isRegisterMode ? (
              <div className="auth-panel-motion auth-panel-register">
                <div className="mb-5">
                  <p className="auth-title-pulse text-2xl font-semibold text-emerald-700">Register</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Start your restaurant trial with real QR ordering, table management, UPI settings, and owner access.
                  </p>
                </div>
                <OwnerRegistrationForm />
                <p className="mt-5 text-center text-sm text-zinc-600">
                  Already have an account?{" "}
                  <Link href="/auth/owner?mode=login" className="font-semibold text-emerald-700 underline underline-offset-4">
                    Login
                  </Link>
                </p>
              </div>
            ) : (
              <div className="auth-panel-motion auth-panel-login">
                <h2 className="auth-title-pulse text-2xl font-semibold text-emerald-700">Owner login</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Use Supabase Auth credentials. Passwords are never stored in FlickOrder tables.
                </p>
                <div className="mt-6">
                  <LoginForm />
                </div>
                <p className="mt-5 text-center text-sm text-zinc-600">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/owner?mode=register" className="font-semibold text-emerald-700 underline underline-offset-4">
                    Create account
                  </Link>
                </p>
              </div>
            )}
          </Card>
        </section>
      </div>
      <MarketingFooter />
    </main>
  );
}

function getOwnerAuthMode(value: string | string[] | undefined): OwnerAuthMode {
  const mode = Array.isArray(value) ? value[0] : value;

  return mode === "register" ? "register" : "login";
}
