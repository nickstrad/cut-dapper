import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PATH_BUILDERS } from "@/lib/constants";
import { ClippersList } from "@/features/clippers/components/clippers-list";
import { ClippersListLoading } from "@/features/clippers/components/clippers-list-loading";
import { ClippersListError } from "@/features/clippers/components/clippers-list-error";
import { prefetchClippers } from "@/features/clippers/server/prefetch";
import { clippersParamsLoader } from "@/features/clippers/server/params";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function ClippersPage({ searchParams }: Props) {
  const params = await clippersParamsLoader(searchParams);
  prefetchClippers(params);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Clippers</h1>
          <p className="text-muted-foreground mt-2">
            Manage your clipper collection
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={PATH_BUILDERS.CLIPPERS.bulk}>
            <Button variant="outline">Bulk Import from Amazon</Button>
          </Link>
          <Link href={PATH_BUILDERS.CLIPPERS.create}>
            <Button variant="outline">Create New Clipper</Button>
          </Link>
        </div>
      </div>

      <HydrateClient>
        <ErrorBoundary fallback={<ClippersListError />}>
          <Suspense fallback={<ClippersListLoading />}>
            <ClippersList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </div>
  );
}
