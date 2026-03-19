import * as React from "react"

import { cn } from "@/lib/utils"

export type BadgeVariant = "default" | "outline" | "success" | "warning" | "destructive"

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"

  const variants: Record<BadgeVariant, string> = {
    default: "border-transparent bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900",
    outline:
      "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200 bg-transparent",
    success:
      "border-transparent bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300",
    warning:
      "border-transparent bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300",
    destructive:
      "border-transparent bg-red-500/10 text-red-700 ring-1 ring-red-500/30 dark:text-red-300",
  }

  return (
    <span className={cn(base, variants[variant], className)} {...props} />
  )
}

