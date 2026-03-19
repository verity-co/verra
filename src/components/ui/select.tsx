import * as React from "react"

import { cn } from "@/lib/utils"

type SelectProps = React.ComponentProps<"select">

function Select({ className, ...props }: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Select }

