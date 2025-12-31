import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsJson,
} from "nuqs/server";
import { PAGINATION } from "@/lib/constants";

export const SEARCH_PARAMS = {
  // Pagination
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),

  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),

  // Text search
  search: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),

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
  tags: parseAsJson<Record<string, string[]>>()
    .withDefault({} as Record<string, string[]>)
    .withOptions({ clearOnDefault: true }),
} as const;
