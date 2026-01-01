import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { VIDEOS_PARAMS } from "../params";
import { useQueryStates } from "nuqs";

export const useSuspenseVideos = () => {
  const trpc = useTRPC();
  const [params] = useVideosParams();

  return useSuspenseQuery(trpc.videos.getMany.queryOptions(params));
};

export const useSuspenseVideo = ({ id }: { id: string }) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.videos.getOne.queryOptions({ id }));
};

export const useVideosParams = () => {
  return useQueryStates(VIDEOS_PARAMS);
};

export const useCreateVideo = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.videos.create.mutationOptions({
      onSuccess: async (data) => {
        toast.success(`Video "${data.title}" created`);
        // Invalidate all getMany queries regardless of params
        queryClient.invalidateQueries({
          queryKey: [["videos", "getMany"]],
        });
      },
      onError: (error) => {
        toast.error(`Failed to create video: ${error.message}`);
      },
    })
  );
};

export const useUpdateVideo = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.videos.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Video "${data.title}" updated`);
        // Invalidate all getMany queries regardless of params
        queryClient.invalidateQueries({
          queryKey: [["videos", "getMany"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["videos", "getOne"], { input: { id: data.id } }],
        });
      },
      onError: (error) => {
        toast.error(`Failed to update video: ${error.message}`);
      },
    })
  );
};

export const useRemoveVideo = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.videos.remove.mutationOptions({
      onSuccess: async (data) => {
        toast.success(`Video "${data.title}" deleted`);
        // Invalidate all getMany queries regardless of params
        queryClient.invalidateQueries({
          queryKey: [["videos", "getMany"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["videos", "getOne"], { input: { id: data.id } }],
        });
      },
      onError: (error) => {
        toast.error(`Failed to delete video: ${error.message}`);
      },
    })
  );
};

export const useFetchYouTubeMetadata = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.videos.fetchYouTubeMetadata.mutationOptions({
      onError: (error) => {
        toast.error(`Failed to fetch YouTube metadata: ${error.message}`);
      },
    })
  );
};
