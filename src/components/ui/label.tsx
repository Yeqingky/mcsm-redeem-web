import * as React from "react";
import * as Primitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils";
export function Label({
  className,
  ...p
}: React.ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root className={cn("text-sm font-medium", className)} {...p} />
  );
}
