"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  useBatchExtractFromAmazonURLs,
  useBatchExtractAndCreate,
} from "../hooks/use-bulk-extract";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { STATIC_PATHS } from "@/lib/constants";

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
  const router = useRouter();
  const [extractionResults, setExtractionResults] = useState<
    ExtractionResult[]
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urls: "",
    },
  });

  const batchExtractMutation = useBatchExtractFromAmazonURLs();
  const batchExtractAndCreateMutation = useBatchExtractAndCreate();

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

  const onExtractAndCreate = async (data: FormValues) => {
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
    setIsCreating(true);

    try {
      // Extract and create all in one step
      const result = await batchExtractAndCreateMutation.mutateAsync({ urls });

      // Update results
      setExtractionResults(
        urls.map((url) => {
          const created = result.created.find((c) => c.amazonUrl === url);
          const error = result.errors.find((e) => e.url === url);

          if (created) {
            return {
              url,
              status: "success" as const,
              data: {
                name: created.name,
                brand: created.brand,
                model: created.model,
                description: created.description,
                amazonUrl: created.amazonUrl,
                imageUrls: created.imageUrls,
              },
            };
          } else if (error) {
            return {
              url,
              status: "error" as const,
              error: error.error,
            };
          } else {
            return {
              url,
              status: "error" as const,
              error: "Unknown error",
            };
          }
        })
      );

      // Redirect to clippers page if any were created
      if (result.created.length > 0) {
        router.push(STATIC_PATHS.CLIPPERS);
      }
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
      setIsCreating(false);
    }
  };

  const onCreateAll = async () => {
    const urls = extractionResults
      .filter((r) => r.status === "success" && r.data)
      .map((r) => r.url);

    if (urls.length === 0) {
      return;
    }

    setIsCreating(true);

    try {
      // Extract and create all in parallel batches
      const result = await batchExtractAndCreateMutation.mutateAsync({ urls });

      // Update results based on creation success/failure
      setExtractionResults((prev) =>
        prev.map((r) => {
          const error = result.errors.find((e) => e.url === r.url);
          if (error) {
            return {
              ...r,
              status: "error" as const,
              error: error.error,
            };
          }
          return r;
        })
      );

      // Redirect to clippers page if any were created
      if (result.created.length > 0) {
        router.push(STATIC_PATHS.CLIPPERS);
      }
    } catch (error) {
      // Handle error
      setExtractionResults((prev) =>
        prev.map((r) =>
          r.status === "success"
            ? {
                ...r,
                status: "error" as const,
                error:
                  error instanceof Error ? error.message : "Failed to create",
              }
            : r
        )
      );
    } finally {
      setIsCreating(false);
    }
  };

  const successCount = extractionResults.filter(
    (r) => r.status === "success"
  ).length;
  const errorCount = extractionResults.filter(
    (r) => r.status === "error"
  ).length;
  const hasResults = extractionResults.length > 0;

  return (
    <div className="space-y-6">
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
                    disabled={isExtracting || isCreating}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </FormControl>
                <FormDescription>
                  Enter one Amazon product URL per line. Data will be extracted
                  using AI.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={form.handleSubmit(onExtract)}
              disabled={isExtracting || isCreating}
              variant="outline"
            >
              {isExtracting && !isCreating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Extract Data (Preview)"
              )}
            </Button>

            <Button
              type="button"
              onClick={form.handleSubmit(onExtractAndCreate)}
              disabled={isExtracting || isCreating}
              variant="outline"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Extract and Create"
              )}
            </Button>

            {hasResults && successCount > 0 && (
              <Button
                type="button"
                onClick={onCreateAll}
                disabled={isExtracting || isCreating || successCount === 0}
                variant="secondary"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  `Create ${successCount} Previewed`
                )}
              </Button>
            )}
          </div>
        </div>
      </Form>

      {/* Results Section */}
      {hasResults && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Extraction Results</h3>
            <div className="flex gap-2">
              {successCount > 0 && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="size-3" />
                  {successCount} Success
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="size-3" />
                  {errorCount} Error
                </Badge>
              )}
            </div>
          </div>

          <ScrollArea className="h-125 rounded-md border">
            <div className="p-4 space-y-4">
              {extractionResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-sm font-mono break-all flex-1">
                        {result.url}
                      </CardTitle>
                      <div className="shrink-0">
                        {result.status === "pending" && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {result.status === "extracting" && (
                          <Badge variant="secondary" className="gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Extracting
                          </Badge>
                        )}
                        {result.status === "success" && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            Success
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

                  {result.data && (
                    <CardContent>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="font-semibold text-muted-foreground">
                            Name:
                          </dt>
                          <dd>{result.data.name}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-muted-foreground">
                            Brand:
                          </dt>
                          <dd>{result.data.brand}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-muted-foreground">
                            Model:
                          </dt>
                          <dd>{result.data.model}</dd>
                        </div>
                        {result.data.description && (
                          <div>
                            <dt className="font-semibold text-muted-foreground">
                              Description:
                            </dt>
                            <dd className="text-muted-foreground">
                              {result.data.description}
                            </dd>
                          </div>
                        )}
                        {result.data.imageUrls.length > 0 && (
                          <div>
                            <dt className="font-semibold text-muted-foreground">
                              Images:
                            </dt>
                            <dd className="text-muted-foreground">
                              {result.data.imageUrls.length} image(s)
                            </dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  )}

                  {result.error && (
                    <CardContent>
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="size-4 mt-0.5 shrink-0" />
                        <p>{result.error}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
