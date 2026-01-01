"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import type { Video } from "@/generated/prisma/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  useCreateVideo,
  useUpdateVideo,
  useFetchYouTubeMetadata,
} from "../hooks/use-videos";
import { useClippersForSelection } from "../hooks/use-clippers-for-selection";
import { Loader2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KeyValueMapBuilder } from "@/components/key-value-map-builder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClipperForm } from "@/features/clippers/components/clipper-form";

const formSchema = z
  .object({
    youtubeUrl: z.string().min(1, "YouTube URL or ID is required"),
    videoId: z.string().min(1, "Video ID is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    thumbnailUrl: z.string(),
    duration: z.string(),
    channelTitle: z.string(),
    tags: z.array(
      z.object({ key: z.string().min(1), value: z.string().min(1) })
    ),
    clipperIds: z.array(z.string()),
  })
  .refine(
    (data) => {
      const keys = data.tags.map((tag) => tag.key);
      const uniqueKeys = new Set(keys);
      return keys.length === uniqueKeys.size;
    },
    {
      message: "Tag keys must be unique",
      path: ["tags"],
    }
  );

export type VideoFormValues = z.infer<typeof formSchema>;

type VideoFormProps = {
  video?: Video & {
    clippers: Array<{
      clipper: {
        id: string;
        name: string;
        brand: string;
        model: string;
      };
    }>;
  };
  onSuccess?: () => void;
};

export const VideoForm = ({ video, onSuccess }: VideoFormProps) => {
  const isEditing = !!video;
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isClipperDialogOpen, setIsClipperDialogOpen] = useState(false);

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: video?.videoId ?? "",
      videoId: video?.videoId ?? "",
      title: video?.title ?? "",
      description: video?.description ?? "",
      thumbnailUrl: video?.thumbnailUrl ?? "",
      duration: video?.duration ?? "",
      channelTitle: video?.channelTitle ?? "",
      tags: video?.tags
        ? Object.entries(video.tags as Record<string, string>).map(
            ([key, value]) => ({ key, value })
          )
        : [{ key: "hairstyle", value: "" }],
      clipperIds: video?.clippers?.map((vc) => vc.clipper.id) ?? [],
    },
  });

  const createMutation = useCreateVideo();
  const updateMutation = useUpdateVideo();
  const fetchMetadataMutation = useFetchYouTubeMetadata();
  const {
    data: clippersData,
    isLoading: isLoadingClippers,
    refetch: refetchClippers,
  } = useClippersForSelection();

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Watch youtubeUrl changes to fetch metadata
  const youtubeUrl = form.watch("youtubeUrl");

  useEffect(() => {
    // Don't auto-fetch in edit mode
    if (isEditing) return;

    // Debounce and validate URL/ID before fetching
    const timer = setTimeout(async () => {
      if (!youtubeUrl || youtubeUrl.length < 11) return;

      setIsFetchingMetadata(true);
      try {
        const metadata = await fetchMetadataMutation.mutateAsync({
          urlOrId: youtubeUrl,
        });

        // Auto-populate form fields
        form.setValue("videoId", metadata.videoId);
        form.setValue("title", metadata.title);
        form.setValue("description", metadata.description);
        form.setValue("thumbnailUrl", metadata.thumbnailUrl);
        form.setValue("duration", metadata.duration);
        form.setValue("channelTitle", metadata.channelTitle);
      } catch (error) {
        // Error already toasted by mutation
        console.error("Failed to fetch metadata:", error);
      } finally {
        setIsFetchingMetadata(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [youtubeUrl, isEditing, fetchMetadataMutation, form]);

  const onSubmit = (data: VideoFormValues) => {
    // Convert array of {key, value} to Record<string, string>
    const tags = data.tags
      .filter((t) => t.key.trim() !== "" && t.value.trim() !== "")
      .reduce((acc, t) => {
        acc[t.key] = t.value;
        return acc;
      }, {} as Record<string, string>);

    const payload = {
      videoId: data.videoId,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      channelTitle: data.channelTitle,
      tags,
      clipperIds: data.clipperIds,
    };

    if (isEditing) {
      updateMutation.mutate({ id: video.id, ...payload }, { onSuccess });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* YouTube URL Input */}
        <FormField
          control={form.control}
          name="youtubeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube URL or Video ID</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    placeholder="https://www.youtube.com/watch?v=... or video ID"
                    disabled={isPending || isEditing}
                  />
                  {isFetchingMetadata && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </FormControl>
              <FormDescription>
                {isEditing
                  ? "YouTube URL cannot be changed after creation"
                  : "Paste a YouTube URL or video ID to auto-fetch metadata"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Auto-populated fields (editable) */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Video title"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Video description"
                  disabled={isPending}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="channelTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Channel name"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="url"
                  placeholder="https://..."
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags (Hairstyles) */}
        <KeyValueMapBuilder
          name="tags"
          keyPlaceholder="Tag name (e.g., fade, mohawk)"
          valuePlaceholder="Description"
          disabled={isPending}
          addButtonLabel="Add Tag"
          emptyMessage="No tags added yet. Add tags to help users find this video."
        />

        {/* Clippers Multi-Select */}
        <FormField
          control={form.control}
          name="clipperIds"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Associated Clippers</FormLabel>
                <Dialog
                  open={isClipperDialogOpen}
                  onOpenChange={setIsClipperDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                    >
                      <Plus className="size-4 mr-2" />
                      Create Clipper
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Clipper</DialogTitle>
                      <DialogDescription>
                        Add a new clipper to the database. It will be
                        automatically available for selection after creation.
                      </DialogDescription>
                    </DialogHeader>
                    <ClipperForm
                      onSuccess={async () => {
                        setIsClipperDialogOpen(false);
                        await refetchClippers();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <FormDescription>
                Select which clippers are featured in this video
              </FormDescription>
              {isLoadingClippers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading clippers...
                </div>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    {clippersData?.clippers.map((clipper) => (
                      <div
                        key={clipper.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={field.value.includes(clipper.id)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...field.value, clipper.id]
                              : field.value.filter((id) => id !== clipper.id);
                            field.onChange(newValue);
                          }}
                          disabled={isPending}
                        />
                        <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {clipper.brand} {clipper.model} - {clipper.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending} variant="outline">
            {isPending
              ? "Saving..."
              : isEditing
              ? "Update Video"
              : "Create Video"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
