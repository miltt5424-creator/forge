import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-28 w-full rounded-lg bg-card px-3 py-3 text-sm leading-relaxed text-foreground shadow-[var(--shadow-border)] placeholder:text-faint outline-none transition-[box-shadow] duration-150 focus-visible:shadow-[0_0_0_1px_var(--color-ring)] disabled:opacity-40 resize-y",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
