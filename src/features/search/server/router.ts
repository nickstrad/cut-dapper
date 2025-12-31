import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import prisma from "@/lib/db";
import { PAGINATION } from "@/lib/constants";

const searchInputSchema = z.object({
  // Pagination
  page: z.number().default(PAGINATION.DEFAULT_PAGE),
  pageSize: z
    .number()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),

  // Text search
  search: z.string().default(""),

  // Facet filters
  channels: z.array(z.string()).default([]),
  brands: z.array(z.string()).default([]),
  models: z.array(z.string()).default([]),

  // Tag filters: { "hairstyle": ["fade", "mohawk"], "difficulty": ["beginner"] }
  tags: z.record(z.string(), z.array(z.string())).default({}),
});

// Helper: Build SQL WHERE conditions for materialized view
function buildSqlWhereConditions(filters: {
  search: string;
  channels: string[];
  brands: string[];
  models: string[];
  tags: Record<string, string[]>;
}): { sql: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Text search across multiple fields (case-insensitive)
  if (filters.search) {
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    conditions.push(
      `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1} OR "channelTitle" ILIKE $${paramIndex + 2})`
    );
    paramIndex += 3;
  }

  // Channel filter
  if (filters.channels.length > 0) {
    params.push(filters.channels);
    conditions.push(`"channelTitle" = ANY($${paramIndex})`);
    paramIndex += 1;
  }

  // Brand filter (array contains any)
  if (filters.brands.length > 0) {
    params.push(filters.brands);
    conditions.push(`brands && $${paramIndex}::text[]`);
    paramIndex += 1;
  }

  // Model filter (array contains any)
  if (filters.models.length > 0) {
    params.push(filters.models);
    conditions.push(`models && $${paramIndex}::text[]`);
    paramIndex += 1;
  }

  // Tag filters (JSONB exact match)
  Object.entries(filters.tags).forEach(([key, values]) => {
    if (values.length > 0) {
      // For each tag key, check if ANY of the values match (exact match)
      const tagConditions = values.map((value) => {
        params.push(key, `"${value}"`); // JSON strings are quoted
        const condition = `(tags->$${paramIndex})::text = $${paramIndex + 1}`;
        paramIndex += 2;
        return condition;
      });
      conditions.push(`(${tagConditions.join(" OR ")})`);
    }
  });

  const sql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { sql, params };
}

// Helper: Get facet counts using database aggregation
async function getFacetCounts(filters: {
  search: string;
  channels: string[];
  brands: string[];
  models: string[];
  tags: Record<string, string[]>;
}) {
  const { sql: whereClause, params } = buildSqlWhereConditions(filters);

  // Get channel counts
  const channelCounts = await prisma.$queryRawUnsafe<
    Array<{ value: string; count: number }>
  >(
    `
    SELECT "channelTitle" as value, COUNT(*)::int as count
    FROM video_search_mv
    ${whereClause}
    GROUP BY "channelTitle"
    ORDER BY count DESC
  `,
    ...params
  );

  // Get brand counts (unnest the array and count)
  const brandCounts = await prisma.$queryRawUnsafe<
    Array<{ value: string; count: number }>
  >(
    `
    SELECT brand as value, COUNT(*)::int as count
    FROM video_search_mv, unnest(brands) as brand
    ${whereClause}
    GROUP BY brand
    ORDER BY count DESC
  `,
    ...params
  );

  // Get model counts (unnest the array and count)
  const modelCounts = await prisma.$queryRawUnsafe<
    Array<{ value: string; count: number }>
  >(
    `
    SELECT model as value, COUNT(*)::int as count
    FROM video_search_mv, unnest(models) as model
    ${whereClause}
    GROUP BY model
    ORDER BY count DESC
  `,
    ...params
  );

  // Get tag counts (more complex - need to unnest JSONB)
  const tagRows = await prisma.$queryRawUnsafe<
    Array<{ key: string; value: string; count: number }>
  >(
    `
    SELECT
      key,
      value,
      COUNT(*)::int as count
    FROM video_search_mv,
    LATERAL jsonb_each_text(tags) as tag(key, value)
    ${whereClause}
    GROUP BY key, value
    ORDER BY key, count DESC
  `,
    ...params
  );

  // Group tags by key
  const tagsByKey: Record<string, Array<{ value: string; count: number }>> = {};
  tagRows.forEach((row) => {
    if (!tagsByKey[row.key]) {
      tagsByKey[row.key] = [];
    }
    tagsByKey[row.key].push({ value: row.value, count: row.count });
  });

  return {
    channels: channelCounts,
    brands: brandCounts,
    models: modelCounts,
    tags: tagsByKey,
  };
}

export const searchRouter = createTRPCRouter({
  search: baseProcedure.input(searchInputSchema).query(async ({ input }) => {
    const { page, pageSize, search, channels, brands, models, tags } = input;
    const skip = (page - 1) * pageSize;

    const filters = { search, channels, brands, models, tags };
    const { sql: whereClause, params } = buildSqlWhereConditions(filters);

    // Execute queries in parallel
    const [videosRaw, totalResult, facets] = await Promise.all([
      // 1. Fetch paginated videos from materialized view
      prisma.$queryRawUnsafe<
        Array<{
          id: string;
          videoId: string;
          title: string;
          description: string;
          thumbnailUrl: string;
          duration: string;
          channelTitle: string;
          tags: any;
          createdAt: Date;
          updatedAt: Date;
          clipper_details: any;
        }>
      >(
        `
        SELECT
          id,
          "videoId",
          title,
          description,
          "thumbnailUrl",
          duration,
          "channelTitle",
          tags,
          "createdAt",
          "updatedAt",
          clipper_details
        FROM video_search_mv
        ${whereClause}
        ORDER BY "createdAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `,
        ...params,
        pageSize,
        skip
      ),

      // 2. Count total matching videos
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `
        SELECT COUNT(*) as count
        FROM video_search_mv
        ${whereClause}
      `,
        ...params
      ),

      // 3. Get facet aggregations
      getFacetCounts(filters),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    // Transform clipper_details from JSONB to match expected structure
    const videos = videosRaw.map((video) => ({
      ...video,
      clippers: (video.clipper_details as any[]).map((clipper) => ({
        clipper: {
          id: clipper.id,
          name: clipper.name,
          brand: clipper.brand,
          model: clipper.model,
        },
      })),
    }));

    return {
      videos,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      facets,
      input: {
        search,
        channels,
        brands,
        models,
        tags,
      },
    };
  }),
});
