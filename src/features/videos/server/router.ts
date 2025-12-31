import { PAGINATION } from "@/lib/constants";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import prisma from "@/lib/db";
import { YouTubeMetadataFetcher } from "@/lib/youtube-metadata";
import z from "zod";

const videoInputSchema = z.object({
  videoId: z.string().min(1, "YouTube video ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  thumbnailUrl: z.string().url("Must be a valid URL"),
  duration: z.string().min(1, "Duration is required"),
  channelTitle: z.string().min(1, "Channel title is required"),
  tags: z.record(z.string(), z.string()).default({}),
  clipperIds: z.array(z.string()).default([]),
});

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
      const skip = (page - 1) * pageSize;

      const where = search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              {
                description: { contains: search, mode: "insensitive" as const },
              },
              {
                channelTitle: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {};

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            clippers: {
              include: {
                clipper: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                  },
                },
              },
            },
          },
        }),
        prisma.video.count({ where }),
      ]);

      return {
        videos,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  getOne: baseProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { id } = input;

      const video = await prisma.video.findUnique({
        where: { id },
        include: {
          clippers: {
            include: {
              clipper: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  model: true,
                },
              },
            },
          },
        },
      });

      if (!video) {
        throw new Error("Video not found");
      }

      return video;
    }),

  create: baseProcedure
    .input(videoInputSchema)
    .mutation(async ({ input }) => {
      const { clipperIds, ...videoData } = input;

      // Check if video already exists
      const existing = await prisma.video.findUnique({
        where: { videoId: input.videoId },
      });

      if (existing) {
        throw new Error("Video with this YouTube ID already exists");
      }

      const video = await prisma.video.create({
        data: {
          ...videoData,
          clippers: {
            create: clipperIds.map((clipperId) => ({
              clipperId,
            })),
          },
        },
        include: {
          clippers: {
            include: {
              clipper: {
                select: { id: true, name: true, brand: true, model: true },
              },
            },
          },
        },
      });

      return video;
    }),

  update: baseProcedure
    .input(videoInputSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, clipperIds, ...videoData } = input;

      // Delete existing associations and create new ones
      const video = await prisma.video.update({
        where: { id },
        data: {
          ...videoData,
          clippers: {
            deleteMany: {},
            create: clipperIds.map((clipperId) => ({
              clipperId,
            })),
          },
        },
        include: {
          clippers: {
            include: {
              clipper: {
                select: { id: true, name: true, brand: true, model: true },
              },
            },
          },
        },
      });

      return video;
    }),

  remove: baseProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input;

      const video = await prisma.video.delete({
        where: { id },
      });

      return video;
    }),

  fetchYouTubeMetadata: baseProcedure
    .input(
      z.object({
        urlOrId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.YOUTUBE_API_KEY;

      if (!apiKey) {
        throw new Error("YouTube API key not configured");
      }

      const fetcher = new YouTubeMetadataFetcher(apiKey);
      const metadata = await fetcher.getMetadata(input.urlOrId);

      return {
        videoId: metadata.id,
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnails.high,
        duration: metadata.duration,
        channelTitle: metadata.channelTitle,
      };
    }),
});
