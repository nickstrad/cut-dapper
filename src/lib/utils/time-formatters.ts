/**
 * Time formatting and parsing utilities
 */

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds
 * @returns Human-readable duration string (e.g., "1h 30m 5s", "5m 30s", "45s")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parses ISO 8601 duration format (e.g., "PT1H30M5S") to seconds
 * @param duration - ISO 8601 duration string
 * @returns Duration in seconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    console.warn(`Invalid duration format: ${duration}`);
    return 0;
  }

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Converts timestamp string (MM:SS or HH:MM:SS) to seconds
 * Also handles timestamp ranges by taking the start time (e.g., "02:12 - 02:28")
 * @param timestamp - Timestamp string in MM:SS or HH:MM:SS format
 * @returns Timestamp in seconds
 */
export function parseTimestamp(timestamp: string): number {
  try {
    // Handle ranges "02:12 - 02:28" by taking start time
    const startTime = timestamp.includes(" - ")
      ? timestamp.split(" - ")[0].trim()
      : timestamp.trim();

    const parts = startTime.split(":");

    if (parts.length === 2) {
      // MM:SS format
      const [minutesStr, secondsStr] = parts;
      const minutes = parseInt(minutesStr, 10);
      const seconds = parseInt(secondsStr, 10);

      if (isNaN(minutes) || isNaN(seconds)) {
        throw new Error(`Invalid timestamp format: ${timestamp}`);
      }

      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      // HH:MM:SS format
      const [hoursStr, minutesStr, secondsStr] = parts;
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      const seconds = parseInt(secondsStr, 10);

      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        throw new Error(`Invalid timestamp format: ${timestamp}`);
      }

      return hours * 3600 + minutes * 60 + seconds;
    } else {
      throw new Error(`Invalid timestamp format: ${timestamp}`);
    }
  } catch (error) {
    console.warn(`Failed to parse timestamp "${timestamp}":`, error);
    return 0;
  }
}
