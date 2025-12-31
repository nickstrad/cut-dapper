export const APP_NAME = "Cut Dapper";

export const ERRORS = {
  FORBIDDEN: {
    code: "FORBIDDEN",
    message: "You do not have permission to access this resource.",
  },
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    message: "unauthorized",
  },
} as const;

export const ENTITIES = {
  CLIPPERS: "clippers",
  VIDEOS: "videos",
} as const;

export type Entity = (typeof ENTITIES)[keyof typeof ENTITIES];

export const STATIC_PATHS = {
  HOME: "/",
  CLIPPERS: `/${ENTITIES.CLIPPERS}`,
  VIDEOS: `/${ENTITIES.VIDEOS}`,
} as const;

export const PATH_BUILDERS = {
  CLIPPERS: {
    detailsView: (id: string) => `${STATIC_PATHS.CLIPPERS}/${id}`,
    create: `${STATIC_PATHS.CLIPPERS}/create`,
    edit: (id: string) => `${STATIC_PATHS.CLIPPERS}/${id}/edit`,
  },
  VIDEOS: {
    detailsView: (id: string) => `${STATIC_PATHS.VIDEOS}/${id}`,
    create: `${STATIC_PATHS.VIDEOS}/create`,
    edit: (id: string) => `${STATIC_PATHS.VIDEOS}/${id}/edit`,
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

export const YOUTUBE_LIMITS = {
  /** Maximum number of video IDs per batch metadata request */
  MAX_BATCH_SIZE: 50,
} as const;
