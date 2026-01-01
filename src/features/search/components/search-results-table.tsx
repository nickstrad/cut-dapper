"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TruncatedText } from "@/components/ui/truncated-text";
import { formatDuration, parseDuration } from "@/lib/utils/time-formatters";
import { EntityPagination } from "@/components/entity-pagination";
import { ExternalLink } from "lucide-react";

type Clipper = {
  id: string;
  name: string;
  brand: string;
  model: string;
  amazonUrl: string;
};

type VideoClipper = {
  clipper: Clipper;
};

type Video = {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  duration: string;
  tags: Record<string, string> | null;
  clippers: VideoClipper[];
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type SearchResultsTableProps = {
  videos: Video[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
};

export const SearchResultsTable = ({
  videos,
  pagination,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: SearchResultsTableProps) => {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No videos found matching your filters. Try adjusting your search
          criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Title</TableHead>
            <TableHead className="w-[15%]">Channel</TableHead>
            <TableHead className="w-[10%]">Duration</TableHead>
            <TableHead className="w-[22.5%]">Tags</TableHead>
            <TableHead className="w-[22.5%]">Associated Clippers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => {
            const durationSeconds = parseDuration(video.duration);
            return (
              <TableRow key={video.id}>
                <TableCell className="font-medium w-[30%]">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-start gap-1.5 group"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-3">{video.title}</span>
                  </a>
                </TableCell>
                <TableCell className="w-[15%]">
                  <TruncatedText text={video.channelTitle} maxWidth="100%" />
                </TableCell>
                <TableCell className="w-[10%]">
                  <TruncatedText
                    text={formatDuration(durationSeconds)}
                    maxWidth="100%"
                    className="whitespace-nowrap"
                  />
                </TableCell>
                <TableCell className="w-[22.5%]">
                  {(() => {
                    const tags = (video.tags || {}) as Record<string, string>;
                    const tagKeys = Object.keys(tags);
                    return tagKeys.length > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col gap-1 cursor-help">
                            <Badge
                              variant="secondary"
                              className="text-xs w-fit"
                            >
                              {tagKeys[0]}
                            </Badge>
                            {tagKeys.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                + {tagKeys.length - 1} more tag
                                {tagKeys.length - 1 > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <pre className="text-xs max-w-md whitespace-pre-wrap">
                            {JSON.stringify(tags, null, 2)}
                          </pre>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No tags
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="w-[22.5%]">
                  {video.clippers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {video.clippers.map((vc) => (
                        <a
                          key={vc.clipper.id}
                          href={vc.clipper.amazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline flex items-center gap-1 group"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span>
                            {vc.clipper.brand} {vc.clipper.model}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No clippers
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <EntityPagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalCount={pagination.total}
        totalPages={pagination.totalPages}
        hasNextPage={pagination.page < pagination.totalPages}
        hasPreviousPage={pagination.page > 1}
        disabled={disabled}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};
