"use client";

import { ClipperForm } from "@/features/clippers/components/clipper-form";
import { useRouter } from "next/navigation";
import { STATIC_PATHS } from "@/lib/constants";

export default function CreateClipperPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(STATIC_PATHS.CLIPPERS);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Clipper</h1>
        <p className="text-muted-foreground mt-2">
          Add a new clipper to your collection
        </p>
      </div>
      <ClipperForm onSuccess={handleSuccess} />
    </div>
  );
}
