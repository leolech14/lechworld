import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("glass-card rounded-xl", className)}
      {...props}
    />
  )
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
