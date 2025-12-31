import { VideoEditor } from "@/features/videos/components/video-editor";
import { VideoError } from "@/features/videos/components/video-error";
import { VideoLoading } from "@/features/videos/components/video-loading";
import { prefetchVideo } from "@/features/videos/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
  const { id } = await params;

  prefetchVideo({ id });

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<VideoError videoId={id} />}>
        <Suspense fallback={<VideoLoading />}>
          <VideoEditor videoId={id} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default Page;
