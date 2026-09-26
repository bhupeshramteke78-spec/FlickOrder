"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function DashboardHeaderSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    // Navigate to live orders or order history with search filter
    const trimmed = encodeURIComponent(query.trim());
    router.push(`/dashboard/orders?q=${trimmed}`);
  }

  return (
    <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orders, dishes..."
          className="h-9 w-48 lg:w-60 rounded-l-xl border border-r-0 border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-800 placeholder-zinc-400 transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-200"
        />
      </div>
      <button
        type="submit"
        className="h-9 rounded-r-xl bg-rose-600 px-3.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-95 shadow-xs flex items-center gap-1.5"
      >
        <Search className="h-3 w-3 stroke-[2.5]" />
        <span>Search</span>
      </button>
    </form>
  );
}
