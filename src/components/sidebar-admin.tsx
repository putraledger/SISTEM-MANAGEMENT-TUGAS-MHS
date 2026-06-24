"use client"

import React, { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LogOut,
  Sun,
  Moon,
  Laptop,
  Shield,
  Users,
  ScrollText,
  BookOpen,
  BookOpenCheck,
  FileSpreadsheet,
  Bell,
  FileText,
  Home,
  Inbox,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { getAppSettings } from "@/app/admin/actions"

export function SidebarAdmin() {
  const { data: session } = useSession()
  const { setTheme } = useTheme()
  const [appName, setAppName] = useState("SIMATU")
  const pathname = usePathname()

  const user = session?.user

  useEffect(() => {
    getAppSettings().then((settings) => {
      if (settings && settings.appName) {
        setAppName(settings.appName)
      }
    })
  }, [])

  const links = [
    { name: "Beranda Admin", icon: Home, href: "/admin" },
    { name: "Manajemen Mahasiswa", icon: Users, href: "/admin/mahasiswa" },
    { name: "Manajemen Dosen", icon: Users, href: "/admin/dosen" },
    { name: "Manajemen Admin", icon: Shield, href: "/admin/admins" },
    { name: "Mata Kuliah", icon: ScrollText, href: "/admin/mata-kuliah" },
    { name: "Fakultas & Prodi", icon: BookOpen, href: "/admin/fakultas" },
    { name: "Dosen Pengampu", icon: BookOpenCheck, href: "/admin/dosen-pengampu" },
    { name: "Enrollment", icon: Users, href: "/admin/enrollment" },
    { name: "Manajemen Semester", icon: FileSpreadsheet, href: "/admin/semester" },
    { name: "Pengumuman", icon: Bell, href: "/admin/pengumuman" },
    { name: "Notifikasi Saya", icon: Inbox, href: "/admin/notifikasi" },
    { name: "Audit Log", icon: FileSpreadsheet, href: "/admin/audit-logs" },
    { name: "Laporan & Analitik", icon: FileText, href: "/admin/reporting" },
    { name: "Pengaturan", icon: Laptop, href: "/admin/settings" },
  ]

  return (
    <div className="flex flex-col justify-between h-full p-5 min-h-full md:min-h-0 bg-white dark:bg-slate-950/80">
      <div className="space-y-6">
        {/* Logo & Branding */}
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-95 transition-transform duration-150">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-slate-800 dark:text-white">
              {appName}
            </h1>
            <p className="text-[9px] text-slate-400 font-semibold tracking-tight uppercase">
              Sistem Akademik
            </p>
          </div>
        </div>

        {/* Profile Card */}
        {user && (
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 space-y-3 dark:border-slate-800/80 dark:bg-slate-900/30">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-slate-200/80">
                <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold dark:bg-slate-850 dark:text-blue-400">
                  {user.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate dark:text-white leading-none mb-1">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-none">
                  {user.identifier}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
              <span className="text-[8px] px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 font-bold uppercase tracking-wider dark:border-blue-900/20 dark:bg-blue-950/20 dark:text-blue-400">
                {user.role}
              </span>
              {user.prodi && (
                <span className="text-[9px] text-slate-400 truncate max-w-[90px] font-semibold">
                  {user.prodi}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2.5 mb-2">
            Navigasi Utama
          </span>
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href))
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 mt-4 md:mt-0 dark:border-slate-900">
        <div className="flex items-center justify-between px-2">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sistem</span>
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger className="size-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer outline-none dark:hover:bg-slate-900 dark:hover:text-white">
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-slate-100 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
              <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-slate-50 hover:text-slate-800 cursor-pointer text-xs">
                <Sun className="size-3.5 mr-2" /> Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-slate-50 hover:text-slate-800 cursor-pointer text-xs">
                <Moon className="size-3.5 mr-2" /> Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-slate-50 hover:text-slate-800 cursor-pointer text-xs">
                <Laptop className="size-3.5 mr-2" /> System Mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog>
          <DialogTrigger render={
            <Button
              variant="ghost"
              className="w-full justify-start text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-all p-2.5 rounded-lg border border-transparent cursor-pointer"
            >
              <LogOut className="size-4 mr-2" />
              Keluar Sesi
            </Button>
          } />
          <DialogContent className="max-w-[340px] sm:max-w-[340px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
            <DialogHeader className="pt-2">
              <DialogTitle className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <LogOut className="size-4.5 text-rose-600" />
                Konfirmasi Keluar Sesi
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Apakah Anda yakin ingin keluar dari sesi ini?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-row justify-end gap-2 border-t pt-3 mt-4 border-slate-150 dark:border-slate-800">
              <DialogClose render={
                <Button variant="outline" className="text-[10px] font-semibold px-4 py-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 cursor-pointer" />
              }>
                Batal
              </DialogClose>
              <Button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[10px] font-semibold bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-all active:scale-95"
              >
                Keluar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
