import { ExternalLinkIcon } from "lucide-react"

import { ConnectionStatus } from "@/components/shared/connection-status"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader({
  staffLoginUsername,
}: {
  readonly staffLoginUsername?: string | null
}) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-2 px-4 lg:gap-3 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-1 h-4 data-vertical:self-auto"
          />
          <h1 className="text-sm sm:text-base font-bold text-foreground">Adisyon & POS</h1>
        </div>

        {/* Live System Connection Indicator */}
        <div className="flex items-center gap-2">
          <ConnectionStatus />

          {staffLoginUsername ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-xl"
              render={
                <a
                  href="/personelgiris"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLinkIcon className="size-4" />
              Personel Girişi
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
