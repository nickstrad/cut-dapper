"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useBatchExtractFromAmazonURLs } from "../hooks/use-bulk-extract";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipperForm } from "./clipper-form";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  urls: z.string().min(1, "At least one URL is required"),
});

type FormValues = z.infer<typeof formSchema>;

type ExtractionResult = {
  url: string;
  status: "pending" | "extracting" | "success" | "error";
  data?: {
    name: string;
    brand: string;
    model: string;
    description: string;
    amazonUrl: string;
    imageUrls: string[];
  };
  error?: string;
};

export const BulkForm = () => {
  const [extractionResults, setExtractionResults] = useState<
    ExtractionResult[]
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urls: "",
    },
  });

  const batchExtractMutation = useBatchExtractFromAmazonURLs();

  const onExtract = async (data: FormValues) => {
    // Parse URLs (one per line)
    const urls = data.urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      return;
    }

    // Initialize results
    const initialResults: ExtractionResult[] = urls.map((url) => ({
      url,
      status: "extracting",
    }));
    setExtractionResults(initialResults);
    setCompletedCount(0);
    setIsExtracting(true);

    try {
      // Extract all URLs in parallel batches
      const results = await batchExtractMutation.mutateAsync({ urls });

      // Update results with extraction data
      setExtractionResults(
        results.map((result) => ({
          url: result.url,
          status: result.status,
          data: result.data,
          error: result.error,
        }))
      );
    } catch (error) {
      // Handle error - mark all as failed
      setExtractionResults((prev) =>
        prev.map((result) => ({
          ...result,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        }))
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFormSuccess = () => {
    setCompletedCount((prev) => prev + 1);
  };

  const successCount = extractionResults.filter(
    (r) => r.status === "success"
  ).length;
  const errorCount = extractionResults.filter(
    (r) => r.status === "error"
  ).length;
  const hasResults = extractionResults.length > 0;

  return (
    <div className="space-y-8">
      {/* Step 1: Extract URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Extract Product Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="urls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amazon URLs</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={`Paste Amazon URLs here (one per line):\nhttps://www.amazon.com/product1\nhttps://www.amazon.com/product2\nhttps://www.amazon.com/product3`}
                        disabled={isExtracting}
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter one Amazon product URL per line. Data will be
                      extracted from each page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={form.handleSubmit(onExtract)}
                disabled={isExtracting}
                variant="outline"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "Extract Product Data"
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Step 2: Review and Submit Forms */}
      {hasResults && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Step 2: Review and Submit
            </h2>
            <div className="flex gap-2">
              {successCount > 0 && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="size-3" />
                  {successCount} Extracted
                </Badge>
              )}
              {completedCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {completedCount} Submitted
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="size-3" />
                  {errorCount} Failed
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {extractionResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">
                        Product {index + 1}
                      </CardTitle>
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {result.url}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {result.status === "extracting" && (
                        <Badge variant="secondary" className="gap-1">
                          <Loader2 className="size-3 animate-spin" />
                          Extracting
                        </Badge>
                      )}
                      {result.status === "success" && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="size-3" />
                          Ready
                        </Badge>
                      )}
                      {result.status === "error" && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="size-3" />
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {result.status === "success" && result.data && (
                  <CardContent>
                    <ClipperForm
                      clipper={{
                        id: "",
                        name: result.data.name,
                        brand: result.data.brand,
                        model: result.data.model,
                        description: result.data.description,
                        amazonUrl: result.data.amazonUrl,
                        imageUrls: result.data.imageUrls,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      }}
                      onSuccess={handleFormSuccess}
                    />
                  </CardContent>
                )}

                {result.status === "error" && (
                  <CardContent>
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="size-4 mt-0.5 shrink-0" />
                      <p>{result.error}</p>
                    </div>
                  </CardContent>
                )}

                {index < extractionResults.length - 1 && (
                  <Separator className="mt-6" />
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
