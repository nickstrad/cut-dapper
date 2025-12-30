import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { CLIPPERS_PARAMS } from "../params";
import { useQueryStates } from "nuqs";

export const useSuspenseClippers = () => {
  const trpc = useTRPC();
  const [params] = useClippersParams();

  return useSuspenseQuery(trpc.clippers.getMany.queryOptions(params));
};

export const useSuspenseClipper = ({ id }: { id: string }) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.clippers.getOne.queryOptions({ id }));
};

export const useClippersParams = () => {
  return useQueryStates(CLIPPERS_PARAMS);
};

export const useCreateClipper = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.clippers.create.mutationOptions({
      onSuccess: async (data) => {
        toast.success(`Clipper "${data.name}" created`);
        queryClient.invalidateQueries(trpc.clippers.getMany.queryOptions({}));
      },
      onError: (error) => {
        toast.error(`Failed to create clipper: ${error.message}`);
      },
    })
  );
};

export const useUpdateClipper = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.clippers.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Clipper "${data.name}" updated`);
        queryClient.invalidateQueries(trpc.clippers.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.clippers.getOne.queryOptions({ id: data.id })
        );
      },
      onError: (error) => {
        toast.error(`Failed to update clipper: ${error.message}`);
      },
    })
  );
};

export const useRemoveClipper = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.clippers.remove.mutationOptions({
      onSuccess: async (data) => {
        toast.success(`Clipper "${data.name}" deleted`);
        queryClient.invalidateQueries(trpc.clippers.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.clippers.getOne.queryFilter({ id: data.id })
        );
      },
      onError: (error) => {
        toast.error(`Failed to delete clipper: ${error.message}`);
      },
    })
  );
};
