export default function RestaurantDetailLoading() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-5 w-40 rounded bg-zinc-200" />
        <div className="mt-5 h-80 rounded-lg bg-zinc-200" />
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="h-72 rounded-lg bg-zinc-200" />
          <div className="h-72 rounded-lg bg-zinc-200" />
        </div>
      </div>
    </main>
  );
}
