import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookingStatus } from "@/components/customer/booking-status";
import { createClient } from "@/lib/supabase/server";

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect(`/auth/customer?mode=login&returnTo=${encodeURIComponent(`/bookings/${bookingId}`)}`);
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-zinc-950 sm:py-10">
      <section className="mx-auto max-w-3xl">
        <Link href="/restaurants/search" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600"><ArrowLeft className="h-4 w-4" />Explore restaurants</Link>
        <BookingStatus bookingId={bookingId} />
      </section>
    </main>
  );
}
