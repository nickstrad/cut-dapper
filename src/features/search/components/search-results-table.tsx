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
import { PATH_BUILDERS } from "@/lib/constants";
import Link from "next/link";

type Clipper = {
  id: string;
  name: string;
  brand: string;
  model: string;
};

type VideoClipper = {
  clipper: Clipper;
};

type Video = {
  id: string;
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
};

export const SearchResultsTable = ({
  videos,
  pagination,
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={PATH_BUILDERS.VIDEOS.detailsView(video.id)}
                        className="hover:underline line-clamp-2 block"
                      >
                        <TruncatedText text={video.title} maxWidth="100%" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-md">{video.title}</p>
                    </TooltipContent>
                  </Tooltip>
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
                            <Badge variant="secondary" className="text-xs w-fit">
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col gap-1 cursor-help">
                          {video.clippers.slice(0, 2).map((vc) => (
                            <span
                              key={vc.clipper.id}
                              className="text-sm truncate"
                            >
                              {vc.clipper.brand} {vc.clipper.model}
                            </span>
                          ))}
                          {video.clippers.length > 2 && (
                            <span className="text-sm text-muted-foreground">
                              +{video.clippers.length - 2} more
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs max-w-md space-y-1">
                          {video.clippers.map((vc) => (
                            <div key={vc.clipper.id}>
                              {vc.clipper.brand} {vc.clipper.model} -{" "}
                              {vc.clipper.name}
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
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

      <div className="text-sm text-muted-foreground">
        Showing {videos.length} of {pagination.total} videos
      </div>
    </div>
  );
};
