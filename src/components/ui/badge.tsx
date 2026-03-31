import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-zinc-800 text-zinc-300",
        destructive:
          "border-transparent bg-red-900/50 text-red-400 border-red-800",
        outline:
          "text-zinc-400 border-zinc-700",
        success:
          "border-transparent bg-green-900/50 text-green-400 border-green-800",
        warning:
          "border-transparent bg-yellow-900/50 text-yellow-400 border-yellow-800",
        info:
          "border-transparent bg-blue-900/50 text-blue-400 border-blue-800",
        purple:
          "border-transparent bg-purple-900/50 text-purple-400 border-purple-800",
        kling:
          "border-transparent bg-blue-900/50 text-blue-400 border-blue-800",
        veo:
          "border-transparent bg-purple-900/50 text-purple-400 border-purple-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
