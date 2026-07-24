export default function Loading() {
  return (
    <main className="min-h-screen bg-[#04111f] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="h-10 w-36 animate-pulse rounded-xl bg-white/10" />
        <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
          <div className="h-12 max-w-xl animate-pulse rounded-xl bg-white/10" />
          <div className="mt-4 h-5 max-w-2xl animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-52 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
