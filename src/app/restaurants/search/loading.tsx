export default function RestaurantSearchLoading() {
  return (
    <main className="min-h-screen bg-[#071117] px-5 py-24 text-white">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-9 w-80 rounded bg-white/10" />
        <div className="mt-4 h-5 w-[32rem] max-w-full rounded bg-white/10" />
        <div className="mt-8 h-14 rounded-lg bg-white/10" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/3] rounded-lg bg-white/10" />)}
        </div>
      </div>
    </main>
  );
}
