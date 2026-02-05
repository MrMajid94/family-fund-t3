"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Archive,
  CreditCard,
  Landmark,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

const data = {

  navMain: [
    {
      title: "الرئيسية",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      // items: [
      //   {
      //     title: "نظرة عامة",
      //     url: "/dashboard",
      //   },
      //   {
      //     title: "آخر النشاطات",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "المدفوعات",
      url: "/dashboard/payments",
      icon:  PieChart,
      isAdminOnly: true,
      // items: [
      //   {
      //     title: "دفع جديد",
      //     url: "/payments/new",
      //   },
      //   {
      //     title: "سجل المدفوعات",
      //     url: "/payments",
      //   },
      //   {
      //     title: "المتأخرات",
      //     url: "/payments/arrears",
      //   },
      // ],
    },
    {
      title: "الأعضاء",
      url: "/dashboard/members",
      icon: Bot,
      // items: [
      //   {
      //     title: "قائمة الأعضاء",
      //     url: "#",
      //   },
      //   {
      //     title: "إضافة عضو",
      //     url: "#",
      //   },
      // ],
    },
    
    {
      title: "أرشيف الدفعات",
      url: "/dashboard/archived-payments",
      icon: Archive,
      isAdminOnly: true,
    },
    {
      title: "المصاريف",
      url: "/dashboard/spendings",
      icon: CreditCard,
    },
    {
      title: "رصيد البنك",
      url: "/dashboard/bank",
      icon: Landmark,
      isAdminOnly: true,
    },
    {
      title: "الوثائق",
      url: "/dashboard/docs",
      icon: BookOpen,
    },
    {
      title: "الإعدادات",
      url: "/dashboard/settings",
      icon: Settings2,
      isAdminOnly: true,
    },
  ],
  // navSecondary: [
  //   {
  //     title: "الدعم الفني",
  //     url: "#",
  //     icon: LifeBuoy,
  //   },
  //   {
  //     title: "الملاحظات",
  //     url: "#",
  //     icon: Send,
  //   },
  // ],
  // projects: [
  //   {
  //     name: "صندوق العائلة",
  //     url: "#",
  //     icon: Frame,
  //   },
  // ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  // @ts-ignore - role exists on user but sometimes TS complains if types aren't fully generated
  const isAdmin = session?.user?.role === "admin";

  const filteredNavMain = data.navMain.filter(item => {
    // @ts-ignore - safe because we added isAdminOnly optional property
    if (item.isAdminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-sm leading-tight text-right">
                  <span className="truncate font-medium">صندوق العائلة</span>
                  <span className="truncate text-xs">نظام الإدارة</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        {/* <NavProjects projects={data.projects} />
        {/* <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser  />
      </SidebarFooter>
    </Sidebar>
  )
}
