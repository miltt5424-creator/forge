import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-card px-3 text-sm text-foreground shadow-[var(--shadow-border)] placeholder:text-faint outline-none transition-[box-shadow] duration-150 focus-visible:shadow-[0_0_0_1px_var(--color-ring)] disabled:opacity-40",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
