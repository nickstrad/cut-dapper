import { Skeleton } from "@/components/ui/skeleton";

export const SearchLoading = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-100 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
};
