import { adminProcedure, createTRPCRouter } from "@/trpc/init";

export const adminRouter = createTRPCRouter({
  // Returns true if user is admin, throws FORBIDDEN error if not
  checkAdmin: adminProcedure.query(() => {
    return { isAdmin: true };
  }),
});
