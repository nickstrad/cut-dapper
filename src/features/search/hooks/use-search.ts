import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { SEARCH_PARAMS } from "../params";

export const useSuspenseSearch = () => {
  const trpc = useTRPC();
  const [params] = useSearchParams();

  return useSuspenseQuery(trpc.search.search.queryOptions(params));
};

export const useSearchParams = () => {
  return useQueryStates(SEARCH_PARAMS);
};
