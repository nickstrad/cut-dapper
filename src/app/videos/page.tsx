import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PATH_BUILDERS } from "@/lib/constants";
import { VideosList } from "@/features/videos/components/videos-list";
import { VideosListLoading } from "@/features/videos/components/videos-list-loading";
import { VideosListError } from "@/features/videos/components/videos-list-error";
import { prefetchVideos } from "@/features/videos/server/prefetch";
import { videosParamsLoader } from "@/features/videos/server/params";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { SearchParams } from "nuqs/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function VideosPage({ searchParams }: Props) {
  const params = await videosParamsLoader(searchParams);
  prefetchVideos(params);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground mt-2">
            Manage hairstyle tutorial videos
          </p>
        </div>
        <Link href={PATH_BUILDERS.VIDEOS.create}>
          <Button variant="outline">Add New Video</Button>
        </Link>
      </div>

      <HydrateClient>
        <ErrorBoundary fallback={<VideosListError />}>
          <Suspense fallback={<VideosListLoading />}>
            <VideosList showActions={true} />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </div>
  );
}
