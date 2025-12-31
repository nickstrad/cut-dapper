"use client";

import { VideoForm } from "./video-form";
import { useSuspenseVideo } from "../hooks/use-videos";
import { useRouter } from "next/navigation";
import { STATIC_PATHS } from "@/lib/constants";

type VideoEditorProps = {
  videoId: string;
};

export const VideoEditor = ({ videoId }: VideoEditorProps) => {
  const { data: video } = useSuspenseVideo({ id: videoId });
  const router = useRouter();

  const handleSuccess = () => {
    router.push(STATIC_PATHS.VIDEOS);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Video</h1>
        <p className="text-muted-foreground mt-2">
          Update video information and associations
        </p>
      </div>
      <VideoForm video={video} onSuccess={handleSuccess} />
    </div>
  );
};
