import React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SidebarAdmin } from "@/components/sidebar-admin"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout sidebar={<SidebarAdmin />}>
      {children}
    </DashboardLayout>
  )
}
