"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useEffect } from "react";

type KeyValueMapBuilderProps = {
  name: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
  keyLabel?: string;
  valueLabel?: string;
  addButtonLabel?: string;
  emptyMessage?: string;
};

export const KeyValueMapBuilder = ({
  name,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  disabled = false,
  keyLabel = "Key",
  valueLabel = "Value",
  addButtonLabel = "Add Entry",
  emptyMessage = "No entries added yet.",
}: KeyValueMapBuilderProps) => {
  const { control, setError, clearErrors, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  // Validate unique keys
  useEffect(() => {
    const values = fields as Array<{ id: string; key: string; value: string }>;
    const keys = values.map((field) => field.key).filter((key) => key.trim() !== "");
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);

    if (duplicates.length > 0) {
      const duplicateSet = new Set(duplicates);
      values.forEach((field, index) => {
        if (duplicateSet.has(field.key)) {
          setError(`${name}.${index}.key`, {
            type: "manual",
            message: "Duplicate key",
          });
        }
      });
    } else {
      // Clear all key errors if no duplicates
      type FieldArrayError = { key?: { message?: string }; value?: { message?: string } };
      const nameErrors = formState.errors[name] as FieldArrayError[] | undefined;
      values.forEach((_, index) => {
        if (nameErrors?.[index]?.key?.message === "Duplicate key") {
          clearErrors(`${name}.${index}.key`);
        }
      });
    }
  }, [fields, name, setError, clearErrors, formState.errors]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{addButtonLabel.replace("Add ", "")}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ key: "", value: "" })}
          disabled={disabled}
        >
          <Plus className="size-4 mr-2" />
          {addButtonLabel}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            type FieldArrayError = { key?: { message?: string }; value?: { message?: string } };
            const nameErrors = formState.errors[name] as FieldArrayError[] | undefined;
            return (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Input
                      {...control.register(`${name}.${index}.key`)}
                      placeholder={keyPlaceholder}
                      disabled={disabled}
                      className={
                        nameErrors?.[index]?.key
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {nameErrors?.[index]?.key && (
                      <p className="text-xs text-destructive">
                        {nameErrors[index].key.message as string}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      {...control.register(`${name}.${index}.value`)}
                      placeholder={valuePlaceholder}
                      disabled={disabled}
                      className={
                        nameErrors?.[index]?.value
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {nameErrors?.[index]?.value && (
                      <p className="text-xs text-destructive">
                        {nameErrors[index].value.message as string}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={disabled}
                className="shrink-0"
              >
                <X className="size-4" />
              </Button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
