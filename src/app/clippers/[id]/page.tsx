import { ClipperEditor } from "@/features/clippers/components/clipper-editor";
import { ClipperError } from "@/features/clippers/components/clipper-error";
import { ClipperLoading } from "@/features/clippers/components/clipper-loading";
import { prefetchClipper } from "@/features/clippers/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
  const { id } = await params;

  prefetchClipper({ id });

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<ClipperError clipperId={id} />}>
        <Suspense fallback={<ClipperLoading />}>
          <ClipperEditor clipperId={id} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default Page;
