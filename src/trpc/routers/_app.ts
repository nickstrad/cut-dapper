import { clippersRouter } from "@/features/clippers/server/router";
import { videosRouter } from "@/features/videos/server/router";
import { searchRouter } from "@/features/search/server/router";
import { adminRouter } from "@/features/admin/server/router";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  clippers: clippersRouter,
  videos: videosRouter,
  search: searchRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
