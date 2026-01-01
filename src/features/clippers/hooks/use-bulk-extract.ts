import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useExtractFromAmazonURL = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.clippers.extractFromAmazonURL.mutationOptions({
      onError: (error) => {
        toast.error(`Failed to extract clipper data: ${error.message}`);
      },
    })
  );
};

export const useExtractAndCreate = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.clippers.extractAndCreate.mutationOptions({
      onSuccess: async (data) => {
        toast.success(`Clipper "${data.name}" created from Amazon URL`);
        // Invalidate all getMany queries regardless of params
        queryClient.invalidateQueries({
          queryKey: [["clippers", "getMany"]],
        });
      },
      onError: (error) => {
        toast.error(`Failed to create clipper: ${error.message}`);
      },
    })
  );
};

export const useBatchExtractFromAmazonURLs = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.clippers.batchExtractFromAmazonURLs.mutationOptions({
      onError: (error) => {
        toast.error(`Failed to extract clippers: ${error.message}`);
      },
    })
  );
};

export const useBatchExtractAndCreate = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.clippers.batchExtractAndCreate.mutationOptions({
      onSuccess: async (data) => {
        const successCount = data.created.length;
        const errorCount = data.errors.length;

        if (successCount > 0) {
          toast.success(`Created ${successCount} clipper${successCount !== 1 ? "s" : ""}`);
          // Invalidate all getMany queries regardless of params
          queryClient.invalidateQueries({
            queryKey: [["clippers", "getMany"]],
          });
        }

        if (errorCount > 0) {
          toast.error(`Failed to create ${errorCount} clipper${errorCount !== 1 ? "s" : ""}`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to create clippers: ${error.message}`);
      },
    })
  );
};
