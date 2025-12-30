import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const ClippersListError = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error Loading Clippers</AlertTitle>
      <AlertDescription>
        <p className="mb-4">
          Failed to load the clippers list. Please try again.
        </p>
        <Button variant="outline" size="sm" onClick={handleReload}>
          Reload Page
        </Button>
      </AlertDescription>
    </Alert>
  );
};
