"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <AlertTriangle className="h-10 w-10 text-yellow-500" />
      <h2 className="text-lg font-semibold text-zinc-100">Something went wrong</h2>
      <p className="text-sm text-zinc-400 max-w-sm">
        {error?.message?.includes("DATABASE_URL") || error?.message?.includes("prisma")
          ? "Database is not connected. Set DATABASE_URL in your environment variables."
          : "An unexpected error occurred loading this page."}
      </p>
      <Button variant="outline" onClick={reset}>Try again</Button>
    </div>
  );
}
