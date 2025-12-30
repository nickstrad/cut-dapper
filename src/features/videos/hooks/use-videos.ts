// import { useTRPC } from "@/trpc/client";
// import {
//   useMutation,
//   useQueryClient,
//   useSuspenseQuery,
// } from "@tanstack/react-query";
// import { toast } from "sonner";
// import { WORKFLOWS_PARAMS } from "../params";
// import { useQueryStates } from "nuqs";

// export const useSuspenseWorkflows = () => {
//   const trpc = useTRPC();
//   const [params] = useWorkflowParams();

//   return useSuspenseQuery(trpc.workflows.getMany.queryOptions(params));
// };

// export const useUpdateWorkflow = () => {
//   const trpc = useTRPC();
//   const queryClient = useQueryClient();

//   return useMutation(
//     trpc.workflows.update.mutationOptions({
//       onSuccess: (data) => {
//         toast.success(`Workflow "${data.name}" updated`);
//         queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
//         queryClient.invalidateQueries(
//           trpc.workflows.getOne.queryOptions({ id: data.id })
//         );
//       },
//       onError: (error) => {
//         toast.error(`Failed to save workflow: ${error.message}`);
//       },
//     })
//   );
// };

// export const useSuspenseWorkflow = ({ id }: { id: string }) => {
//   const trpc = useTRPC();

//   return useSuspenseQuery(trpc.workflows.getOne.queryOptions({ id }));
// };

// export const useWorkflowParams = () => {
//   return useQueryStates(WORKFLOWS_PARAMS);
// };

// export const useUpdateWorkflowName = () => {
//   const queryClient = useQueryClient();
//   const trpc = useTRPC();

//   return useMutation(
//     trpc.workflows.updateName.mutationOptions({
//       onSuccess: async (data) => {
//         toast.success(`Workflow name "${data.name}" updated`);
//         queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
//         queryClient.invalidateQueries(
//           trpc.workflows.getOne.queryOptions({ id: data.id })
//         );
//       },
//       onError: (error) => {
//         toast.error(`Failed to update workflow : ${error.message}`);
//       },
//     })
//   );
// };

// export const useRemoveWorkflow = () => {
//   const queryClient = useQueryClient();
//   const trpc = useTRPC();

//   return useMutation(
//     trpc.workflows.remove.mutationOptions({
//       onSuccess: async (data) => {
//         toast.success(`Workflow "${data.name}" delete`);
//         queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
//         queryClient.invalidateQueries(
//           trpc.workflows.getOne.queryFilter({ id: data.id })
//         );
//       },
//       onError: (error) => {
//         toast.error(`Error creating workflow: ${error.message}`);
//       },
//     })
//   );
// };

// export const useCreateWorkflow = () => {
//   const queryClient = useQueryClient();
//   const trpc = useTRPC();

//   return useMutation(
//     trpc.workflows.create.mutationOptions({
//       onSuccess: async (data) => {
//         toast.success(`Workflow "${data.name}" created`);
//         queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
//       },
//       onError: (error) => {
//         toast.error(`Error creating workflow: ${error.message}`);
//       },
//     })
//   );
// };

// export const useExecuteWorkflow = () => {
//   const trpc = useTRPC();

//   return useMutation(
//     trpc.workflows.execute.mutationOptions({
//       onSuccess: (data) => {
//         toast.success(`Workflow "${data.name}" executed`);
//       },
//       onError: (error) => {
//         toast.error(`Failed to execute workflow: ${error.message}`);
//       },
//     })
//   );
// };
