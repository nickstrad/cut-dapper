"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { STATIC_PATHS } from "@/lib/constants";
import { useIsAdmin } from "../hooks/use-admin";

export function AdminNav() {
  const { data: isAdmin, isLoading } = useIsAdmin();

  // Don't show anything while loading or if not admin
  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href={STATIC_PATHS.CLIPPERS}>Clippers</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={STATIC_PATHS.VIDEOS}>Videos</Link>
      </Button>
    </div>
  );
}
