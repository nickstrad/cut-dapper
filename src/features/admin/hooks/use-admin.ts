import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export const useIsAdmin = () => {
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.admin.checkAdmin.queryOptions(),
    retry: false, // Don't retry on 403 errors
  });

  // If there's an error (403 for non-admin), treat as not admin
  if (query.error) {
    return { ...query, data: false };
  }

  // Return true if successful, false if loading or no data
  return { ...query, data: query.data?.isAdmin ?? false };
};
