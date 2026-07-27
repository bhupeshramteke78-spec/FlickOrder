import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GuestBookings } from "@/components/customer/guest-bookings";

export default function CustomerBookingsPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-zinc-950 sm:py-10">
      <section className="mx-auto max-w-3xl">
        <Link href="/restaurants/search" className="inline-flex items-center gap-2 text-sm text-zinc-600"><ArrowLeft className="h-4 w-4" />Explore restaurants</Link>
        <h1 className="mt-5 text-3xl font-semibold">My bookings</h1>
        <p className="mt-2 text-sm text-zinc-500">Track table requests made from this browser.</p>
        <div className="mt-6"><GuestBookings /></div>
      </section>
    </main>
  );
}
