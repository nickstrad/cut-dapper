import { PAGINATION } from "@/lib/constants";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";

export const videosRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search } = input;

      //TOOD: implement search that makes sense
      return `Fetching videos - Page: ${page}, Page Size: ${pageSize}, Search: ${search}`;
    }),
});
