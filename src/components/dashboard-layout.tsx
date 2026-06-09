"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Shield,
  BookOpen,
  GraduationCap,
  User,
  Bell,
  Menu,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getAppSettings } from "@/app/admin/actions"

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
}

const DashboardLayoutContext = createContext<boolean>(false)

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  const isNested = useContext(DashboardLayoutContext)
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState(0)
  const [appName, setAppName] = useState("SIMATU")
  
  const user = session?.user

  useEffect(() => {
    getAppSettings().then((settings) => {
      if (settings && settings.appName) {
        setAppName(settings.appName)
      }
    })

    if (user?.identifier && user?.role) {
      fetch("/api/notifications/unread-count")
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.count === "number") {
            setNotifications(data.count)
          }
        })
        .catch((err) => console.error("Error fetching unread notifications count:", err))
    }
  }, [user])

  // If this DashboardLayout is rendered inside another DashboardLayout, just return children
  if (isNested) {
    return <>{children}</>
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin":
        return <Shield className="size-5 text-blue-600" />
      case "dosen":
        return <BookOpen className="size-5 text-blue-600" />
      case "mahasiswa":
        return <GraduationCap className="size-5 text-blue-600" />
      default:
        return <User className="size-5 text-slate-500" />
    }
  }

  return (
    <DashboardLayoutContext.Provider value={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50/50 text-slate-700 font-sans dark:bg-slate-950 dark:text-slate-200">
        {/* Desktop Sidebar (Fixed 260px wide, independent scrolling) */}
        <aside className="hidden md:block w-[260px] shrink-0 border-r border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950/80 dark:backdrop-blur-md h-full overflow-y-auto">
          {sidebar}
        </aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-100 px-6 md:px-8 flex items-center justify-between shrink-0 z-10 dark:bg-slate-950 dark:border-slate-900">
            <div className="flex items-center gap-2">
              {/* Mobile Sidebar Hamburger Trigger */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger render={
                    <Button variant="ghost" size="icon" className="size-8 cursor-pointer">
                      <Menu className="size-4" />
                    </Button>
                  } />
                  <SheetContent side="left" className="w-[260px] p-0 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 h-full overflow-y-auto">
                    {sidebar}
                  </SheetContent>
                </Sheet>
              </div>
              {getRoleIcon(user?.role)}
              <h2 className="text-sm font-semibold text-slate-800 capitalize dark:text-white">
                Dashboard {user?.role}
              </h2>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-4">
              {/* Notification Badge */}
              <Link
                href={
                  user?.role === "mahasiswa"
                    ? "/mahasiswa/notifikasi"
                    : user?.role === "dosen"
                    ? "/dosen/notifikasi"
                    : "/admin/pengumuman"
                }
                className="relative p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer active:scale-90 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                <Bell className="size-4" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 size-3 rounded-full bg-blue-600 border-2 border-white text-[7px] font-bold text-white flex items-center justify-center dark:border-slate-950">
                    {notifications}
                  </span>
                )}
              </Link>

              {/* User Mini Avatar */}
              {user && (
                <div className="flex items-center gap-2.5 border-l border-slate-100 pl-4 dark:border-slate-900">
                  <Avatar className="size-7.5 border border-slate-200/50">
                    <AvatarFallback className="bg-slate-50 text-blue-600 text-[10px] font-bold">
                      {user.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
                    {user.name}
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Main Scroll Content */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayoutContext.Provider>
  )
}
