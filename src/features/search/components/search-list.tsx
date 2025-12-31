// "use client";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   useSuspenseVideos,
//   useVideosParams,
//   useRemoveVideo,
// } from "../hooks/use-videos";
// import { Search, Pencil, Trash2 } from "lucide-react";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { PATH_BUILDERS } from "@/lib/constants";
// import { useState, useEffect, useTransition } from "react";
// import { useDebounce } from "react-use";
// import { formatDuration, parseDuration } from "@/lib/utils/time-formatters";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { TruncatedText } from "@/components/ui/truncated-text";

// type VideosListProps = {
//   showActions?: boolean;
// };

// export const VideosList = ({ showActions = false }: VideosListProps) => {
//   const { data } = useSuspenseVideos();
//   const [params, setParams] = useVideosParams();
//   const [searchValue, setSearchValue] = useState(params.search);
//   const [, startTransition] = useTransition();
//   const { mutate: removeVideo, isPending } = useRemoveVideo();
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

//   // Debounce search value by 500ms
//   const [debouncedSearchValue, setDebouncedSearchValue] = useState(searchValue);

//   useDebounce(
//     () => {
//       setDebouncedSearchValue(searchValue);
//     },
//     500,
//     [searchValue]
//   );

//   // Update URL params when debounced value changes
//   useEffect(() => {
//     startTransition(() => {
//       setParams({ search: debouncedSearchValue, page: 1 });
//     });
//   }, [debouncedSearchValue, setParams]);

//   // Sync local search value with URL params on mount/navigation
//   useEffect(() => {
//     setSearchValue(params.search);
//   }, [params.search]);

//   const handleDelete = (id: string, title: string) => {
//     setDeletingId(id);
//     removeVideo(
//       { id },
//       {
//         onSettled: () => {
//           setDeletingId(null);
//           setDeleteDialogOpen(null);
//         },
//       }
//     );
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center gap-2">
//         <div className="relative flex-1 max-w-sm">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
//           <Input
//             type="search"
//             placeholder="Search videos by title, channel, tags..."
//             value={searchValue}
//             onChange={(e) => setSearchValue(e.target.value)}
//             className="pl-9"
//           />
//         </div>
//       </div>

//       {!data.videos.length ? (
//         <div className="text-center py-12">
//           <p className="text-muted-foreground text-lg">
//             {params.search
//               ? `No videos found matching "${params.search}"`
//               : "No videos found. Create your first video to get started!"}
//           </p>
//         </div>
//       ) : (
//         <>
//           <Table className="table-fixed">
//             <TableHeader>
//               <TableRow>
//                 <TableHead className={showActions ? "w-[25%]" : "w-[30%]"}>
//                   Title
//                 </TableHead>
//                 <TableHead className={showActions ? "w-[12%]" : "w-[15%]"}>
//                   Channel
//                 </TableHead>
//                 <TableHead className={showActions ? "w-[8%]" : "w-[10%]"}>
//                   Duration
//                 </TableHead>
//                 <TableHead className={showActions ? "w-[20%]" : "w-[22.5%]"}>
//                   Tags
//                 </TableHead>
//                 <TableHead className={showActions ? "w-[20%]" : "w-[22.5%]"}>
//                   Associated Clippers
//                 </TableHead>
//                 {showActions && (
//                   <TableHead className="w-[15%] text-right">Actions</TableHead>
//                 )}
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {data.videos.map((video) => {
//                 const durationSeconds = parseDuration(video.duration);
//                 return (
//                   <TableRow key={video.id}>
//                     <TableCell
//                       className={
//                         showActions
//                           ? "font-medium w-[25%]"
//                           : "font-medium w-[30%]"
//                       }
//                     >
//                       <Tooltip>
//                         <TooltipTrigger asChild>
//                           <Link
//                             href={PATH_BUILDERS.VIDEOS.detailsView(video.id)}
//                             className="hover:underline line-clamp-2 block"
//                           >
//                             <TruncatedText text={video.title} maxWidth="100%" />
//                           </Link>
//                         </TooltipTrigger>
//                         <TooltipContent>
//                           <p className="max-w-md">{video.title}</p>
//                         </TooltipContent>
//                       </Tooltip>
//                     </TableCell>
//                     <TableCell className={showActions ? "w-[12%]" : "w-[15%]"}>
//                       <TruncatedText
//                         text={video.channelTitle}
//                         maxWidth="100%"
//                       />
//                     </TableCell>
//                     <TableCell className={showActions ? "w-[8%]" : "w-[10%]"}>
//                       <TruncatedText
//                         text={formatDuration(durationSeconds)}
//                         maxWidth="100%"
//                         className="whitespace-nowrap"
//                       />
//                     </TableCell>
//                     <TableCell className={showActions ? "w-[20%]" : "w-[22.5%]"}>
//                       {(() => {
//                         const tags = video.tags as Record<string, string>;
//                         const tagKeys = Object.keys(tags);
//                         return tagKeys.length > 0 ? (
//                           <Tooltip>
//                             <TooltipTrigger asChild>
//                               <div className="flex flex-col gap-1 cursor-help">
//                                 <Badge
//                                   variant="secondary"
//                                   className="text-xs w-fit"
//                                 >
//                                   {tagKeys[0]}
//                                 </Badge>
//                                 {tagKeys.length > 1 && (
//                                   <span className="text-xs text-muted-foreground">
//                                     + {tagKeys.length - 1} more tag
//                                     {tagKeys.length - 1 > 1 ? "s" : ""}
//                                   </span>
//                                 )}
//                               </div>
//                             </TooltipTrigger>
//                             <TooltipContent>
//                               <pre className="text-xs max-w-md whitespace-pre-wrap">
//                                 {JSON.stringify(tags, null, 2)}
//                               </pre>
//                             </TooltipContent>
//                           </Tooltip>
//                         ) : (
//                           <span className="text-sm text-muted-foreground">
//                             No tags
//                           </span>
//                         );
//                       })()}
//                     </TableCell>
//                     <TableCell className={showActions ? "w-[20%]" : "w-[22.5%]"}>
//                       {video.clippers.length > 0 ? (
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <div className="flex flex-col gap-1 cursor-help">
//                               {video.clippers.slice(0, 2).map((vc) => (
//                                 <span
//                                   key={vc.clipper.id}
//                                   className="text-sm truncate"
//                                 >
//                                   {vc.clipper.brand} {vc.clipper.model}
//                                 </span>
//                               ))}
//                               {video.clippers.length > 2 && (
//                                 <span className="text-sm text-muted-foreground">
//                                   +{video.clippers.length - 2} more
//                                 </span>
//                               )}
//                             </div>
//                           </TooltipTrigger>
//                           <TooltipContent>
//                             <div className="text-xs max-w-md space-y-1">
//                               {video.clippers.map((vc) => (
//                                 <div key={vc.clipper.id}>
//                                   {vc.clipper.brand} {vc.clipper.model} -{" "}
//                                   {vc.clipper.name}
//                                 </div>
//                               ))}
//                             </div>
//                           </TooltipContent>
//                         </Tooltip>
//                       ) : (
//                         <span className="text-sm text-muted-foreground">
//                           No clippers
//                         </span>
//                       )}
//                     </TableCell>
//                     {showActions && (
//                       <TableCell className="w-[15%] text-right">
//                         <div className="flex justify-end gap-2">
//                           <Link
//                             href={PATH_BUILDERS.VIDEOS.detailsView(video.id)}
//                           >
//                             <Button variant="ghost" size="icon-sm">
//                               <Pencil className="size-4" />
//                             </Button>
//                           </Link>

//                           <Dialog
//                             open={deleteDialogOpen === video.id}
//                             onOpenChange={(open) =>
//                               setDeleteDialogOpen(open ? video.id : null)
//                             }
//                           >
//                             <DialogTrigger asChild>
//                               <Button
//                                 variant="ghost"
//                                 size="icon-sm"
//                                 disabled={isPending && deletingId === video.id}
//                               >
//                                 <Trash2 className="size-4" />
//                               </Button>
//                             </DialogTrigger>
//                             <DialogContent>
//                               <DialogHeader>
//                                 <DialogTitle>Delete Video</DialogTitle>
//                                 <DialogDescription>
//                                   Are you sure you want to delete &quot;
//                                   {video.title}
//                                   &quot;? This action cannot be undone.
//                                 </DialogDescription>
//                               </DialogHeader>
//                               <DialogFooter>
//                                 <Button
//                                   variant="outline"
//                                   onClick={() => setDeleteDialogOpen(null)}
//                                 >
//                                   Cancel
//                                 </Button>
//                                 <Button
//                                   variant="destructive"
//                                   onClick={() =>
//                                     handleDelete(video.id, video.title)
//                                   }
//                                   disabled={
//                                     isPending && deletingId === video.id
//                                   }
//                                 >
//                                   Delete
//                                 </Button>
//                               </DialogFooter>
//                             </DialogContent>
//                           </Dialog>
//                         </div>
//                       </TableCell>
//                     )}
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//           </Table>

//           <div className="text-sm text-muted-foreground">
//             Showing {data.videos.length} of {data.pagination.total} videos
//           </div>
//         </>
//       )}
//     </div>
//   );
// };
