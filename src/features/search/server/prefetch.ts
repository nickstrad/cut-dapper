import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type PrefetchSearchInput = inferInput<typeof trpc.search.search>;

export async function prefetchSearch(input: PrefetchSearchInput) {
  return prefetch(trpc.search.search.queryOptions(input));
}
