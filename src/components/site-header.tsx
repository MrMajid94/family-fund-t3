"use client"

import { SidebarIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import React from "react"

import { SearchForm } from "@/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DynamicBreadcrumbs />
        {/* <SearchForm className="w-full sm:ml-auto sm:w-auto" /> */}
      </div>
    </header>
  )
}

function DynamicBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const routeMapping: Record<string, string> = {
    dashboard: "الرئيسية",
    payments: "المدفوعات",
    members: "الأعضاء",
    "archived-payments": "أرشيف الدفعات",
    spendings: "المصاريف",
    bank: "رصيد البنك",
    docs: "الوثائق",
    settings: "الإعدادات",
    new: "إضافة جديد",
    edit: "تعديل",
  }

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">صندوق العائلة</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          // Skip "dashboard" since it's hardcoded as the root if desired, 
          // or we can handle it differently. The user request showed:
          // Home (Family Fund) > Dashboard (Control Panel) in the hardcoded version.
          // Let's align with: Family Fund > Segment 1 > Segment 2
          
          // Actually, the original code had:
          // Family Fund (#) > Control Panel (Dashboard)
          // Ideally "dashboard" segment corresponds to the view. 
          // If we want "Family Fund" to be the static root, and then segments follow.
          
          if (segment === "dashboard" && index === 0) return null

          const path = `/${segments.slice(0, index + 1).join("/")}`
          const isLast = index === segments.length - 1
          const name = routeMapping[segment] ?? segment

          return (
            <React.Fragment key={path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={path}>{name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
