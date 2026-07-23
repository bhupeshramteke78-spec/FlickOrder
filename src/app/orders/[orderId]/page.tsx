import { Check, Clock, CreditCard, ListOrdered } from "lucide-react";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  ["Pending", "Your order has been received", "10:24 AM", true],
  ["Accepted", "Order has been accepted by the restaurant", "10:26 AM", true],
  ["Preparing", "Your order is being prepared", "10:30 AM", true],
  ["Ready", "Food is ready to be served", "--:--", false],
  ["Served", "Enjoy your meal", "--:--", false],
  ["Completed", "Thank you for dining with us", "--:--", false],
] as const;

export default async function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  return (
    <main className="customer-surface min-h-screen text-white">
      <header className="mx-auto mb-4 flex max-w-4xl items-center justify-between px-4 pt-5">
        <div className="flex items-center gap-2 font-semibold">
          <FlickOrderLogo className="h-8 w-8 rounded-lg" priority />
          FlickOrder
        </div>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Help</Button>
      </header>
      <section className="mx-auto max-w-4xl px-4 pb-10">
        <Card className="mx-auto max-w-3xl p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-emerald-700">Order Confirmed!</h1>
          <p className="mt-2 text-sm text-zinc-500">Your order has been placed successfully.</p>
          <p className="mt-5 text-lg font-semibold text-zinc-950">Order ID: {orderId}</p>
          <p className="text-sm text-zinc-500">Table status and order details come from Supabase.</p>

          <div className="mx-auto mt-8 max-w-2xl text-left">
            {steps.map(([label, text, time, complete], index) => (
              <div key={label} className="grid grid-cols-[28px_1fr_auto] gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 h-3 w-3 rounded-full ${complete ? "bg-emerald-700" : "border border-zinc-300 bg-white"}`} />
                  {index < steps.length - 1 ? <span className={`h-12 w-px ${complete ? "bg-emerald-700" : "bg-zinc-200"}`} /> : null}
                </div>
                <div>
                  <h2 className={complete ? "font-semibold text-emerald-800" : "font-semibold text-zinc-500"}>{label}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{text}</p>
                </div>
                <span className="text-xs text-zinc-500">{time}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 border-t border-zinc-200 pt-5 md:grid-cols-3">
            {[
              { icon: Clock, title: "Estimated time", text: "Live kitchen ETA" },
              { icon: CreditCard, title: "Payment", text: "UPI, cash, card machine" },
              { icon: ListOrdered, title: "Realtime", text: "Customer order channel" },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-zinc-200 p-4 text-left">
                <item.icon className="mb-3 h-5 w-5 text-emerald-700" />
                <h3 className="font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{item.text}</p>
              </div>
            ))}
          </div>
        </Card>
        <p className="mt-6 text-center text-sm text-zinc-300">Thank you for choosing FlickOrder</p>
      </section>
      <MarketingFooter />
    </main>
  );
}
