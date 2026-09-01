import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        404
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Button asChild className="mt-6" data-ocid="notfound.home">
        <Link to="/">Back to Overview</Link>
      </Button>
    </div>
  );
}
