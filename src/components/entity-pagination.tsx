"use client";

import { PAGINATION } from "@/lib/constants";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils/css-helpers";

export type EntityPaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const getPagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage > totalPages - 4) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export const EntityPagination = ({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: EntityPaginationProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [customPageSize, setCustomPageSize] = React.useState(
    `${pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE}`
  );

  if (totalPages <= 0) {
    return null;
  }

  const pages = getPagination(page, totalPages);

  const handlePageSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newPageSize = parseInt(customPageSize, 10);
    if (isNaN(newPageSize)) {
      return;
    }
    if (newPageSize > PAGINATION.MAX_PAGE_SIZE) {
      newPageSize = PAGINATION.MAX_PAGE_SIZE;
    }
    if (newPageSize < PAGINATION.MIN_PAGE_SIZE) {
      newPageSize = PAGINATION.MIN_PAGE_SIZE;
    }

    onPageSizeChange(newPageSize);
    setCustomPageSize(`${newPageSize}`);
    onPageChange(PAGINATION.DEFAULT_PAGE);
    setIsPopoverOpen(false);
  };

  const from = totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {from}-{to} of {totalCount} results
      </div>

      <div className="flex items-center gap-6">
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(page - 1)}
                aria-disabled={!hasPreviousPage || disabled}
                className={cn({
                  "pointer-events-none opacity-50":
                    !hasPreviousPage || disabled,
                })}
              />
            </PaginationItem>

            {pages.map((p, i) => (
              <PaginationItem key={`${p}-${i}`}>
                {p === "..." ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={page === p}
                    aria-disabled={disabled}
                    className={cn({
                      "pointer-events-none opacity-50": disabled,
                    })}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(p as number);
                    }}
                  >
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(page + 1)}
                aria-disabled={!hasNextPage || disabled}
                className={cn({
                  "pointer-events-none opacity-50": !hasNextPage || disabled,
                })}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" disabled={disabled}>
              <Settings2 className="h-4 w-4" />
              <span className="sr-only">Page Size</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4">
            <form onSubmit={handlePageSizeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page-size">Page Size</Label>
                <Input
                  id="page-size"
                  type="number"
                  min={PAGINATION.MIN_PAGE_SIZE}
                  max={PAGINATION.MAX_PAGE_SIZE}
                  value={customPageSize}
                  disabled={disabled}
                  onChange={(e) => setCustomPageSize(e.target.value)}
                  className="w-24"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={disabled}
                className="w-full"
              >
                Set
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
