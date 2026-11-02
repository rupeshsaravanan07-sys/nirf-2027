"use client"

import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-2">
      {toasts.map(({ id, title, description, variant }) => {
        const isSuccess = variant === "success"
        const isDestructive = variant === "destructive"

        return (
          <div
            key={id}
            className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all ${
              isSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-100"
                : isDestructive
                ? "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20"
                : "border-border bg-card text-card-foreground"
            }`}
          >
            {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />}
            {isDestructive && <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />}
            {!isSuccess && !isDestructive && <Info className="h-5 w-5 text-primary mt-0.5" />}

            <div className="flex-1">
              {title && <h5 className="font-semibold text-sm">{title}</h5>}
              {description && (
                <div className="text-xs opacity-90 mt-1">{description}</div>
              )}
            </div>

            <button
              onClick={() => dismiss(id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
