import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch all clippers for multi-select dropdown
 * Uses regular useQuery (not suspense) to avoid blocking form rendering
 */
export const useClippersForSelection = () => {
  const trpc = useTRPC();

  return useQuery(
    trpc.clippers.getMany.queryOptions({
      page: 1,
      pageSize: 100,
      search: "",
    })
  );
};
