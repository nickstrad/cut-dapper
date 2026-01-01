"use client";

import { useState, useTransition } from "react";
import { useSuspenseSearch, useSearchParams } from "../hooks/use-search";
import { FacetedSearchPanel } from "./faceted-search-panel";
import { SearchResultsTable } from "./search-results-table";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter } from "lucide-react";

export const SearchPageContent = () => {
  const { data } = useSuspenseSearch();
  const [params, setParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isPendingTransition, startTransition] = useTransition();

  // Calculate active filter count for mobile button badge
  const activeFilterCount =
    data.input.channels.length +
    data.input.brands.length +
    data.input.models.length +
    Object.values(data.input.tags).reduce(
      (sum, tagValues) => sum + tagValues.length,
      0
    ) +
    (data.input.search ? 1 : 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <div className="sticky top-4">
          <FacetedSearchPanel
            facets={data.facets}
            onFilterChange={() => {
              // Filters are managed via URL params, no callback needed
            }}
          />
        </div>
      </aside>

      {/* Mobile Filter Button & Sheet */}
      <div className="md:hidden mb-4">
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-75 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FacetedSearchPanel
                facets={data.facets}
                onFilterChange={() => {
                  // Auto-close sheet on mobile after filter selection
                  setMobileFiltersOpen(false);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Results Table */}
      <main>
        <SearchResultsTable
          videos={data.videos}
          pagination={data.pagination}
          onPageChange={(page) => setParams({ page })}
          onPageSizeChange={(pageSize) => setParams({ pageSize, page: 1 })}
          disabled={isPendingTransition}
        />
      </main>
    </div>
  );
};
