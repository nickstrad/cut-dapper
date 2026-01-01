"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateClipper, useUpdateClipper } from "../hooks/use-clippers";
import { useEffect } from "react";
import { Clipper } from "@/generated/prisma/client";

const formSchema = z.object({
  name: z.string(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  description: z.string(),
  amazonUrl: z
    .string()
    .url("Must be a valid URL")
    .min(1, "Amazon URL is required"),
  imageUrls: z.array(
    z.object({
      value: z.string().url("Must be a valid URL").or(z.literal("")),
    })
  ),
});

export type FormValues = z.infer<typeof formSchema>;

type ClipperFormProps = {
  clipper?: Clipper;
  onSuccess?: () => void;
};

export const ClipperForm = ({ clipper, onSuccess }: ClipperFormProps) => {
  const isEditing = !!clipper;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: clipper?.name ?? "",
      brand: clipper?.brand ?? "",
      model: clipper?.model ?? "",
      description: clipper?.description ?? "",
      amazonUrl: clipper?.amazonUrl ?? "",
      imageUrls: clipper?.imageUrls?.map((url) => ({ value: url })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "imageUrls",
  });

  const createMutation = useCreateClipper();
  const updateMutation = useUpdateClipper();

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (clipper) {
      form.reset({
        name: clipper.name,
        brand: clipper.brand,
        model: clipper.model,
        description: clipper.description,
        amazonUrl: clipper.amazonUrl,
        imageUrls: clipper.imageUrls?.map((url) => ({ value: url })) ?? [],
      });
    }
  }, [clipper, form]);

  const onSubmit = (data: FormValues) => {
    const imageUrls = data.imageUrls
      .map((img) => img.value)
      .filter((url) => url.trim() !== "");

    const payload = {
      name: data.name,
      brand: data.brand,
      model: data.model,
      description: data.description,
      amazonUrl: data.amazonUrl,
      imageUrls,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: clipper.id, ...payload },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Professional Hair Clipper"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Andis"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Black Label MLC"
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
                  placeholder="Detailed description of the clipper..."
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
          name="amazonUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amazon URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="url"
                  placeholder="https://www.amazon.com/..."
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Image URLs (Optional)</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => append({ value: "" })}
              disabled={isPending}
            >
              Add Image URL
            </Button>
          </div>

          {fields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`imageUrls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        disabled={isPending}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => remove(index)}
                      disabled={isPending}
                    >
                      ×
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending} variant="outline">
            {isPending
              ? "Saving..."
              : isEditing
              ? "Update Clipper"
              : "Create Clipper"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
