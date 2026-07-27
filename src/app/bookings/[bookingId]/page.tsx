import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingStatus } from "@/components/customer/booking-status";

export default async function BookingStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const [{ bookingId }, query] = await Promise.all([params, searchParams]);
  const token = Array.isArray(query.token) ? query.token[0] : query.token;

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-zinc-950 sm:py-10">
      <section className="mx-auto max-w-3xl">
        <Link href="/restaurants/search" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600"><ArrowLeft className="h-4 w-4" />Explore restaurants</Link>
        {token ? <BookingStatus bookingId={bookingId} token={token} /> : <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900">This booking link is incomplete.</div>}
      </section>
    </main>
  );
}
