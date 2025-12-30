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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useState } from "react";

export const ClippersList = () => {
  const { data } = useSuspenseClippers();
  const { mutate: removeClipper, isPending } = useRemoveClipper();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [params, setParams] = useClippersParams();

  const handleDelete = (id: string, name: string) => {
    setDeletingId(id);
    removeClipper(
      { id },
      {
        onSettled: () => {
          setDeletingId(null);
        },
      }
    );
  };

  const handleSearch = (value: string) => {
    setParams({ search: value, page: 1 });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clippers..."
            value={params.search}
            onChange={(e) => handleSearch(e.target.value)}
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

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isPending && deletingId === clipper.id}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Clipper</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;
                              {clipper.name}
                              &quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDelete(clipper.id, clipper.name)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
