"use client"

import { useEffect } from "react"
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangleIcon className="text-destructive size-12" />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Bir hata oluştu</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          Sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.
        </p>
        {error.digest && (
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Hata kodu: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        <RefreshCwIcon className="mr-2 size-4" />
        Tekrar Dene
      </Button>
    </div>
  )
}
