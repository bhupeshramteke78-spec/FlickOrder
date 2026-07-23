import { LoginForm } from "@/components/auth/login-form";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Card } from "@/components/ui/card";

export default function CustomerAuthPage() {
  return (
    <main className="customer-surface min-h-screen text-white">
      <section className="flex min-h-[70vh] items-center justify-center px-5 py-10">
        <Card className="auth-form-card w-full max-w-md">
          <h1 className="auth-title-pulse text-2xl font-semibold text-emerald-700">Customer login</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            QR table ordering works without login. Customer login is for saved favorites, reviews, and account features.
          </p>
          <div className="mt-6">
            <LoginForm redirectTo="/" />
          </div>
        </Card>
      </section>
      <MarketingFooter />
    </main>
  );
}
