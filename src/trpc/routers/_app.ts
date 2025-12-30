import { clippersRouter } from "@/features/clippers/server/router";
import { videosRouter } from "@/features/videos/server/router";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  clippers: clippersRouter,
  videos: videosRouter,
});

export type AppRouter = typeof appRouter;
