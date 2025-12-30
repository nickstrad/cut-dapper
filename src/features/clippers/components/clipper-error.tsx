import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { STATIC_PATHS } from "@/lib/constants";

type ClipperErrorProps = {
  clipperId?: string;
};

export const ClipperError = ({ clipperId }: ClipperErrorProps) => {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Error Loading Clipper</AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            {clipperId
              ? `Failed to load clipper with ID: ${clipperId}`
              : "Failed to load clipper data"}
          </p>
          <Link href={STATIC_PATHS.CLIPPERS}>
            <Button variant="outline" size="sm">
              Back to Clippers
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  );
};
