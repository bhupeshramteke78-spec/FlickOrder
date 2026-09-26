import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SearchResultsClient } from "@/components/dashboard/search/search-results-client";
import { getDashboardSearchResults } from "@/lib/dashboard-search";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DashboardSearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const results = await getDashboardSearchResults(query);

  return (
    <DashboardShell
      title={query ? `Search: "${query}"` : "Search Dishes & Orders"}
      eyebrow="Instant Dish & Customer Order Explorer"
    >
      <SearchResultsClient initialResults={results} />
    </DashboardShell>
  );
}
