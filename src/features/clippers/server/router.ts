import { PAGINATION } from "@/lib/constants";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import prisma from "@/lib/db";
import z from "zod";

const clipperInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  description: z.string().min(1, "Description is required"),
  amazonUrl: z.string().url("Must be a valid URL").min(1, "Amazon URL is required"),
  imageUrls: z.array(z.string().url("Must be a valid URL")).default([]),
});

export const clippersRouter = createTRPCRouter({
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
              { name: { contains: search, mode: "insensitive" as const } },
              { brand: { contains: search, mode: "insensitive" as const } },
              { model: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [clippers, total] = await Promise.all([
        prisma.clipper.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.clipper.count({ where }),
      ]);

      return {
        clippers,
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

      const clipper = await prisma.clipper.findUnique({
        where: { id },
      });

      if (!clipper) {
        throw new Error("Clipper not found");
      }

      return clipper;
    }),

  create: baseProcedure
    .input(clipperInputSchema)
    .mutation(async ({ input }) => {
      const clipper = await prisma.clipper.create({
        data: input,
      });

      return clipper;
    }),

  update: baseProcedure
    .input(
      clipperInputSchema.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const clipper = await prisma.clipper.update({
        where: { id },
        data,
      });

      return clipper;
    }),

  remove: baseProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input;

      const clipper = await prisma.clipper.delete({
        where: { id },
      });

      return clipper;
    }),
});
