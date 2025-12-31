"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "../hooks/use-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { X, Search } from "lucide-react";

type FacetOption = {
  value: string;
  count: number;
};

type Facets = {
  channels: FacetOption[];
  brands: FacetOption[];
  models: FacetOption[];
  tags: Record<string, FacetOption[]>;
};

type FacetedSearchPanelProps = {
  facets: Facets;
  onFilterChange?: () => void;
};

export const FacetedSearchPanel = ({
  facets,
  onFilterChange,
}: FacetedSearchPanelProps) => {
  const [params, setParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local search state for immediate feedback
  const [searchValue, setSearchValue] = useState(params.search || "");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== params.search) {
        startTransition(() => {
          void setParams({ search: searchValue || null, page: 1 });
        });
        onFilterChange?.();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, params.search, setParams, onFilterChange]);

  // Sync local state when URL changes externally
  useEffect(() => {
    setSearchValue(params.search || "");
  }, [params.search]);

  const handleChannelToggle = (channel: string) => {
    startTransition(() => {
      const newChannels = params.channels.includes(channel)
        ? params.channels.filter((c) => c !== channel)
        : [...params.channels, channel];
      void setParams({ channels: newChannels.length ? newChannels : null, page: 1 });
    });
    onFilterChange?.();
  };

  const handleBrandToggle = (brand: string) => {
    startTransition(() => {
      const newBrands = params.brands.includes(brand)
        ? params.brands.filter((b) => b !== brand)
        : [...params.brands, brand];
      void setParams({ brands: newBrands.length ? newBrands : null, page: 1 });
    });
    onFilterChange?.();
  };

  const handleModelToggle = (model: string) => {
    startTransition(() => {
      const newModels = params.models.includes(model)
        ? params.models.filter((m) => m !== model)
        : [...params.models, model];
      void setParams({ models: newModels.length ? newModels : null, page: 1 });
    });
    onFilterChange?.();
  };

  const handleTagToggle = (tagKey: string, tagValue: string) => {
    startTransition(() => {
      const currentTagValues = params.tags[tagKey] || [];
      const newTagValues = currentTagValues.includes(tagValue)
        ? currentTagValues.filter((v) => v !== tagValue)
        : [...currentTagValues, tagValue];

      const newTags = { ...params.tags };
      if (newTagValues.length === 0) {
        delete newTags[tagKey];
      } else {
        newTags[tagKey] = newTagValues;
      }

      void setParams({
        tags: Object.keys(newTags).length ? newTags : null,
        page: 1,
      });
    });
    onFilterChange?.();
  };

  const handleRemoveChannel = (channel: string) => {
    startTransition(() => {
      const newChannels = params.channels.filter((c) => c !== channel);
      void setParams({ channels: newChannels.length ? newChannels : null, page: 1 });
    });
    onFilterChange?.();
  };

  const handleRemoveBrand = (brand: string) => {
    startTransition(() => {
      const newBrands = params.brands.filter((b) => b !== brand);
      void setParams({ brands: newBrands.length ? newBrands : null, page: 1 });
    });
    onFilterChange?.();
  };

  const handleRemoveModel = (model: string) => {
    startTransition(() => {
      const newModels = params.models.filter((m) => m !== model);
      void setParams({ models: newModels.length ? newModels : null, page: 1 });
    });
    onFilterChange?.();
  };

  const handleRemoveTag = (tagKey: string, tagValue: string) => {
    startTransition(() => {
      const currentTagValues = params.tags[tagKey] || [];
      const newTagValues = currentTagValues.filter((v) => v !== tagValue);

      const newTags = { ...params.tags };
      if (newTagValues.length === 0) {
        delete newTags[tagKey];
      } else {
        newTags[tagKey] = newTagValues;
      }

      void setParams({
        tags: Object.keys(newTags).length ? newTags : null,
        page: 1,
      });
    });
    onFilterChange?.();
  };

  const handleClearAll = () => {
    startTransition(() => {
      void setParams({
        search: null,
        channels: null,
        brands: null,
        models: null,
        tags: null,
        page: 1,
      });
    });
    setSearchValue("");
    onFilterChange?.();
  };

  const hasActiveFilters =
    params.search ||
    params.channels.length > 0 ||
    params.brands.length > 0 ||
    params.models.length > 0 ||
    Object.keys(params.tags).length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search videos..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
          disabled={isPending}
        />
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Active Filters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={isPending}
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {params.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {params.search}
                <button
                  onClick={() => {
                    setSearchValue("");
                    startTransition(() => {
                      void setParams({ search: null, page: 1 });
                    });
                    onFilterChange?.();
                  }}
                  className="ml-1 rounded-full hover:bg-muted"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {params.channels.map((channel) => (
              <Badge key={channel} variant="secondary" className="gap-1">
                {channel}
                <button
                  onClick={() => handleRemoveChannel(channel)}
                  className="ml-1 rounded-full hover:bg-muted"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {params.brands.map((brand) => (
              <Badge key={brand} variant="secondary" className="gap-1">
                {brand}
                <button
                  onClick={() => handleRemoveBrand(brand)}
                  className="ml-1 rounded-full hover:bg-muted"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {params.models.map((model) => (
              <Badge key={model} variant="secondary" className="gap-1">
                {model}
                <button
                  onClick={() => handleRemoveModel(model)}
                  className="ml-1 rounded-full hover:bg-muted"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {Object.entries(params.tags).map(([tagKey, tagValues]) =>
              tagValues.map((tagValue) => (
                <Badge
                  key={`${tagKey}-${tagValue}`}
                  variant="secondary"
                  className="gap-1"
                >
                  {tagKey}: {tagValue}
                  <button
                    onClick={() => handleRemoveTag(tagKey, tagValue)}
                    className="ml-1 rounded-full hover:bg-muted"
                    disabled={isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>
      )}

      {/* Facet Accordions */}
      <Accordion type="multiple" className="w-full" defaultValue={["channels", "brands", "models", "tags"]}>
        {/* Channels */}
        {facets.channels.length > 0 && (
          <AccordionItem value="channels">
            <AccordionTrigger>
              Channels ({facets.channels.length})
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {facets.channels.map((channel) => (
                    <div key={channel.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel.value}`}
                        checked={params.channels.includes(channel.value)}
                        onCheckedChange={() => handleChannelToggle(channel.value)}
                        disabled={isPending}
                      />
                      <Label
                        htmlFor={`channel-${channel.value}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {channel.value} ({channel.count})
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brands */}
        {facets.brands.length > 0 && (
          <AccordionItem value="brands">
            <AccordionTrigger>
              Brands ({facets.brands.length})
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {facets.brands.map((brand) => (
                    <div key={brand.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand.value}`}
                        checked={params.brands.includes(brand.value)}
                        onCheckedChange={() => handleBrandToggle(brand.value)}
                        disabled={isPending}
                      />
                      <Label
                        htmlFor={`brand-${brand.value}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {brand.value} ({brand.count})
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Models */}
        {facets.models.length > 0 && (
          <AccordionItem value="models">
            <AccordionTrigger>
              Models ({facets.models.length})
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-4">
                  {facets.models.map((model) => (
                    <div key={model.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`model-${model.value}`}
                        checked={params.models.includes(model.value)}
                        onCheckedChange={() => handleModelToggle(model.value)}
                        disabled={isPending}
                      />
                      <Label
                        htmlFor={`model-${model.value}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {model.value} ({model.count})
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Tags (Nested Accordion) */}
        {Object.keys(facets.tags).length > 0 && (
          <AccordionItem value="tags">
            <AccordionTrigger>
              Tags ({Object.keys(facets.tags).length})
            </AccordionTrigger>
            <AccordionContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(facets.tags).map(([tagKey, tagOptions]) => (
                  <AccordionItem key={tagKey} value={tagKey}>
                    <AccordionTrigger className="text-sm">
                      {tagKey} ({tagOptions.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-2 pr-4">
                          {tagOptions.map((tag) => (
                            <div
                              key={tag.value}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`tag-${tagKey}-${tag.value}`}
                                checked={
                                  params.tags[tagKey]?.includes(tag.value) ||
                                  false
                                }
                                onCheckedChange={() =>
                                  handleTagToggle(tagKey, tag.value)
                                }
                                disabled={isPending}
                              />
                              <Label
                                htmlFor={`tag-${tagKey}-${tag.value}`}
                                className="flex-1 cursor-pointer text-sm font-normal"
                              >
                                {tag.value} ({tag.count})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
