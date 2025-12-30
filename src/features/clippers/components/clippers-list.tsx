"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSuspenseClippers,
  useRemoveClipper,
  useClippersParams,
} from "../hooks/use-clippers";
import { Pencil, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { PATH_BUILDERS } from "@/lib/constants";
import { useState, useEffect, useTransition } from "react";
import { useDebounce } from "react-use";

export const ClippersList = () => {
  const { data } = useSuspenseClippers();
  const { mutate: removeClipper, isPending } = useRemoveClipper();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [params, setParams] = useClippersParams();
  const [searchValue, setSearchValue] = useState(params.search);
  const [isPendingTransition, startTransition] = useTransition();

  // Debounce search value by 500ms
  const [debouncedSearchValue, setDebouncedSearchValue] = useState(searchValue);

  useDebounce(
    () => {
      setDebouncedSearchValue(searchValue);
    },
    500,
    [searchValue]
  );

  // Update URL params when debounced value changes
  useEffect(() => {
    startTransition(() => {
      setParams({ search: debouncedSearchValue, page: 1 });
    });
  }, [debouncedSearchValue, setParams, startTransition]);

  // Sync local search value with URL params on mount/navigation
  useEffect(() => {
    setSearchValue(params.search);
  }, [params.search]);

  const handleDelete = (id: string, name: string) => {
    setDeletingId(id);
    removeClipper(
      { id },
      {
        onSettled: () => {
          setDeletingId(null);
          setDeleteDialogOpen(null);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clippers..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {!data.clippers.length ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {params.search
              ? `No clippers found matching "${params.search}"`
              : "No clippers found. Create your first clipper to get started!"}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.clippers.map((clipper) => (
                <TableRow key={clipper.id}>
                  <TableCell className="font-medium">{clipper.name}</TableCell>
                  <TableCell>{clipper.brand}</TableCell>
                  <TableCell>{clipper.model}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {clipper.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={PATH_BUILDERS.CLIPPERS.detailsView(clipper.id)}
                      >
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>

                      <Dialog
                        open={deleteDialogOpen === clipper.id}
                        onOpenChange={(open) =>
                          setDeleteDialogOpen(open ? clipper.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isPending && deletingId === clipper.id}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Clipper</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete &quot;
                              {clipper.name}
                              &quot;? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteDialogOpen(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleDelete(clipper.id, clipper.name)
                              }
                              disabled={isPending && deletingId === clipper.id}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="text-sm text-muted-foreground">
            Showing {data.clippers.length} of {data.pagination.total} clippers
          </div>
        </>
      )}
    </div>
  );
};
