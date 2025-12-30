"use client";

import { ClipperForm } from "./clipper-form";
import { useSuspenseClipper } from "../hooks/use-clippers";
import { useRouter } from "next/navigation";
import { STATIC_PATHS } from "@/lib/constants";
import type { Clipper } from "@/generated/prisma/client";

type ClipperEditorProps = {
  clipperId: string;
};

export const ClipperEditor = ({ clipperId }: ClipperEditorProps) => {
  const { data } = useSuspenseClipper({ id: clipperId });
  const clipper = data as Clipper;
  const router = useRouter();

  const handleSuccess = () => {
    router.push(STATIC_PATHS.CLIPPERS);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Clipper</h1>
        <p className="text-muted-foreground mt-2">
          Update clipper information
        </p>
      </div>
      <ClipperForm clipper={clipper} onSuccess={handleSuccess} />
    </div>
  );
};
