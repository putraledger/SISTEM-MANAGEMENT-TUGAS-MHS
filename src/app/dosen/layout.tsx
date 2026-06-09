import React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SidebarDosen } from "@/components/sidebar-dosen"

export default function DosenLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout sidebar={<SidebarDosen />}>
      {children}
    </DashboardLayout>
  )
}
