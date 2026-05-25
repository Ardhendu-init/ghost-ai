import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-10 max-w-sm w-full rounded-2xl border border-border bg-card shadow-xl">
      {/* Icon box */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted mb-5">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Text */}
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Access denied
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-7">
        This project doesn&apos;t exist or you don&apos;t have permission to
        view it. Contact the owner to request access.
      </p>

      {/* Action */}
      <Link
        href="/editor"
        className={buttonVariants({ variant: "default", size: "default" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to editor
      </Link>
    </div>
  );
}
