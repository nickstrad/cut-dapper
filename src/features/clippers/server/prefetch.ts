import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type PrefetchClipperInput = inferInput<typeof trpc.clippers.getOne>;
type PrefetchClippersInput = inferInput<typeof trpc.clippers.getMany>;

export async function prefetchClipper(input: PrefetchClipperInput) {
  return prefetch(trpc.clippers.getOne.queryOptions(input));
}

export async function prefetchClippers(input: PrefetchClippersInput) {
  return prefetch(trpc.clippers.getMany.queryOptions(input));
}
