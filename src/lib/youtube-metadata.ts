import { YOUTUBE_LIMITS } from "./constants";
import { parseDuration, formatDuration } from "./utils/time-formatters";

export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string; // ISO 8601 format (e.g., "PT1H30M5S")
  durationInSeconds: number; // Parsed duration for convenience
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
    maxres?: string;
  };
}

interface YouTubeApiResponse {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      channelTitle: string;
      channelId: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
        maxres?: { url: string };
      };
    };
    contentDetails: {
      duration: string;
    };
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
  }>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extracts YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - Plain VIDEO_ID string
 */
export function extractVideoId(urlOrId: string): string | null {
  // If it's already just an ID (11 characters, alphanumeric with dashes/underscores)
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }

  try {
    const url = new URL(urlOrId);

    // youtube.com/watch?v=VIDEO_ID
    if (
      url.hostname === "www.youtube.com" ||
      url.hostname === "youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      const videoId = url.searchParams.get("v");
      if (videoId) return videoId;
    }

    // youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.slice(1); // Remove leading slash
      if (videoId) return videoId;
    }

    // youtube.com/embed/VIDEO_ID or youtube.com/shorts/VIDEO_ID
    if (
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      (url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/shorts/"))
    ) {
      const videoId = url.pathname.split("/")[2];
      if (videoId) return videoId;
    }
  } catch {
    // Not a valid URL, might be a plain ID
    return null;
  }

  return null;
}

// ============================================================================
// YOUTUBE METADATA FETCHER
// ============================================================================

export class YouTubeMetadataFetcher {
  private youtubeApiKey: string;
  private baseUrl = "https://www.googleapis.com/youtube/v3/videos";

  constructor(youtubeApiKey: string) {
    this.youtubeApiKey = youtubeApiKey;
  }

  /**
   * Fetches metadata for a YouTube video by URL or video ID
   * @throws Error if video ID is invalid or video not found
   */
  async getMetadata(urlOrId: string): Promise<YouTubeVideoMetadata> {
    const videoId = extractVideoId(urlOrId);

    if (!videoId) {
      throw new Error(`Invalid YouTube URL or video ID: ${urlOrId}`);
    }

    const apiUrl = `${this.baseUrl}?id=${videoId}&key=${this.youtubeApiKey}&part=snippet,contentDetails,statistics`;

    try {
      console.log(`📹 Fetching metadata for video: ${videoId}`);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: YouTubeApiResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error(`Video not found: ${videoId}`);
      }

      const item = data.items[0];
      const durationInSeconds = parseDuration(item.contentDetails.duration);

      const metadata: YouTubeVideoMetadata = {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails.duration,
        durationInSeconds,
        viewCount: parseInt(item.statistics.viewCount, 10),
        likeCount: parseInt(item.statistics.likeCount, 10),
        commentCount: parseInt(item.statistics.commentCount, 10),
        thumbnails: {
          default: item.snippet.thumbnails.default.url,
          medium: item.snippet.thumbnails.medium.url,
          high: item.snippet.thumbnails.high.url,
          maxres: item.snippet.thumbnails.maxres?.url,
        },
      };

      console.log(
        `✅ Metadata fetched: "${metadata.title}" (${formatDuration(
          durationInSeconds
        )})`
      );

      return metadata;
    } catch (error) {
      console.error("Error fetching YouTube metadata:", error);
      throw error;
    }
  }

  /**
   * Fetches metadata for multiple videos at once (batch request)
   * YouTube API supports up to 50 video IDs per request
   */
  async getMetadataBatch(urlsOrIds: string[]): Promise<YouTubeVideoMetadata[]> {
    if (urlsOrIds.length === 0) return [];
    if (urlsOrIds.length > YOUTUBE_LIMITS.MAX_BATCH_SIZE) {
      throw new Error(
        `YouTube API supports max ${YOUTUBE_LIMITS.MAX_BATCH_SIZE} videos per batch request`
      );
    }

    const videoIds = urlsOrIds
      .map(extractVideoId)
      .filter((id): id is string => id !== null);

    if (videoIds.length === 0) {
      throw new Error("No valid video IDs found");
    }

    const apiUrl = `${this.baseUrl}?id=${videoIds.join(",")}&key=${
      this.youtubeApiKey
    }&part=snippet,contentDetails,statistics`;

    try {
      console.log(`📹 Fetching metadata for ${videoIds.length} videos`);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: YouTubeApiResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        return [];
      }

      const metadataList = data.items.map((item) => {
        const durationInSeconds = parseDuration(item.contentDetails.duration);

        return {
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          publishedAt: item.snippet.publishedAt,
          duration: item.contentDetails.duration,
          durationInSeconds,
          viewCount: parseInt(item.statistics.viewCount, 10),
          likeCount: parseInt(item.statistics.likeCount, 10),
          commentCount: parseInt(item.statistics.commentCount, 10),
          thumbnails: {
            default: item.snippet.thumbnails.default.url,
            medium: item.snippet.thumbnails.medium.url,
            high: item.snippet.thumbnails.high.url,
            maxres: item.snippet.thumbnails.maxres?.url,
          },
        };
      });

      console.log(`✅ Fetched metadata for ${metadataList.length} videos`);

      return metadataList;
    } catch (error) {
      console.error("Error fetching YouTube metadata batch:", error);
      throw error;
    }
  }
}

// ============================================================================
// FACTORY FUNCTION (SIMPLE API)
// ============================================================================

/**
 * Simple function to get YouTube video metadata
 * @throws Error if video ID is invalid or video not found
 */
export async function getYouTubeVideoMetadata({
  videoId,
  youtubeApiKey,
}: {
  videoId: string;
  youtubeApiKey: string;
}): Promise<YouTubeVideoMetadata> {
  const fetcher = new YouTubeMetadataFetcher(youtubeApiKey);
  return await fetcher.getMetadata(videoId);
}
