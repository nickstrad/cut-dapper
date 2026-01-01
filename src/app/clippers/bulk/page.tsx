import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BulkForm } from "@/features/clippers/components/bulk-form";
import { STATIC_PATHS } from "@/lib/constants";

export default function BulkClippersPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <Link href={STATIC_PATHS.CLIPPERS}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="size-4 mr-2" />
            Back to Clippers
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Bulk Import Clippers</h1>
        <p className="text-muted-foreground mt-2">
          Extract clipper data from Amazon URLs using AI
        </p>
      </div>

      <BulkForm />
    </div>
  );
}
