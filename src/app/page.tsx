import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs/server";
import { searchParamsLoader } from "@/features/search/server/params";
import { prefetchSearch } from "@/features/search/server/prefetch";
import { SearchPageContent } from "@/features/search/components/search-page-content";
import { SearchLoading } from "@/features/search/components/search-loading";
import { SearchError } from "@/features/search/components/search-error";

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParamsLoader(searchParams);
  prefetchSearch(params);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Discover Haircut Tutorials</h1>
        <p className="text-muted-foreground mt-2">
          Search and filter videos by channel, clipper, and style
        </p>
      </div>

      <HydrateClient>
        <ErrorBoundary fallback={<SearchError />}>
          <Suspense fallback={<SearchLoading />}>
            <SearchPageContent />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </div>
  );
}
