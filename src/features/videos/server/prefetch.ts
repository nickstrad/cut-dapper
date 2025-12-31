import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type PrefetchVideoInput = inferInput<typeof trpc.videos.getOne>;
type PrefetchVideosInput = inferInput<typeof trpc.videos.getMany>;

export async function prefetchVideo(input: PrefetchVideoInput) {
  return prefetch(trpc.videos.getOne.queryOptions(input));
}

export async function prefetchVideos(input: PrefetchVideosInput) {
  return prefetch(trpc.videos.getMany.queryOptions(input));
}
