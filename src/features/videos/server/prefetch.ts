import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type PrefetchVideosInput = inferInput<typeof trpc.videos.getMany>;

export async function prefetchVideos(input: PrefetchVideosInput) {
  return prefetch(trpc.videos.getMany.queryOptions(input));
}
