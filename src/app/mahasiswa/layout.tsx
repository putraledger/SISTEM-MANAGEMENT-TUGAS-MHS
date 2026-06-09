import React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SidebarMahasiswa } from "@/components/sidebar-mahasiswa"

export default function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout sidebar={<SidebarMahasiswa />}>
      {children}
    </DashboardLayout>
  )
}
