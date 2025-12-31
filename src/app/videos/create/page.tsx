"use client";

import { VideoForm } from "@/features/videos/components/video-form";
import { useRouter } from "next/navigation";
import { STATIC_PATHS } from "@/lib/constants";

export default function CreateVideoPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(STATIC_PATHS.VIDEOS);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Video</h1>
        <p className="text-muted-foreground mt-2">
          Add a YouTube video showcasing hairstyles and clippers
        </p>
      </div>
      <VideoForm onSuccess={handleSuccess} />
    </div>
  );
}
