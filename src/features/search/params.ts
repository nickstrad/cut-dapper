import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsJson,
} from "nuqs/server";
import { PAGINATION } from "@/lib/constants";
import { z } from "zod";

const tagsSchema = z.record(z.string(), z.array(z.string()));

export const SEARCH_PARAMS = {
  // Pagination
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),

  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),

  // Text search
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),

  // Facet filters - arrays of strings
  channels: parseAsArrayOf(parseAsString)
    .withDefault([])
    .withOptions({ clearOnDefault: true }),

  brands: parseAsArrayOf(parseAsString)
    .withDefault([])
    .withOptions({ clearOnDefault: true }),

  models: parseAsArrayOf(parseAsString)
    .withDefault([])
    .withOptions({ clearOnDefault: true }),

  // Tag filters - JSON object { "hairstyle": ["fade"], "difficulty": ["beginner"] }
  tags: parseAsJson<Record<string, string[]>>(tagsSchema)
    .withDefault({})
    .withOptions({ clearOnDefault: true }),
} as const;
