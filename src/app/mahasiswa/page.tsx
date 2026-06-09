"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ChangePasswordForm } from "@/components/change-password-form"
import { StatCard } from "@/components/ui/stat-card"
import { CountdownPill } from "@/components/ui/countdown-pill"
import { DataTable } from "@/components/ui/data-table"
import { getMahasiswaDashboardStats } from "./actions"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Trophy, BookOpen, ClipboardList, Clock, Bell, User, Calendar, Megaphone, CheckCircle, ChevronRight, AlertTriangle, GraduationCap } from "lucide-react"
import Link from "next/link"

export default function MahasiswaDashboard() {
  const [data, setData] = useState<{
    stats: {
      totalCourses: number
      totalSks: number
      pendingTasks: number
      activeSemesterNama: string
      semesterAktif: number
      angkatan: number
      prodiNama: string
      fakultasNama: string
      nama: string
      nim: string
    }
    activeTasks: any[]
    announcements: any[]
    telegramVerified: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getMahasiswaDashboardStats()
        setData(res)
      } catch (err) {
        console.error("Gagal memuat dashboard mahasiswa:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          {/* Welcome Banner Skeleton */}
          <div className="h-32 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
            ))}
          </div>

          {/* Details Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
              <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
            </div>
            <div className="lg:col-span-1">
              <div className="h-96 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const taskColumns = [
    {
      header: "Mata Kuliah",
      accessor: (item: any) => (
        <span className="font-bold text-blue-600 font-mono text-[10px] block">
          {item.courseKode} - {item.courseNama}
        </span>
      ),
    },
    {
      header: "Nama Tugas",
      accessor: (item: any) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]" title={item.judul}>
          {item.judul}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (item: any) => (
        item.hasSubmitted ? (
          <span className="text-[9px] px-2.5 py-0.5 rounded border border-emerald-100 bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider dark:bg-emerald-950/20 dark:text-emerald-400">
            Sudah Kumpul
          </span>
        ) : (
          <span className="text-[9px] px-2.5 py-0.5 rounded border border-amber-100 bg-amber-50 text-amber-600 font-bold uppercase tracking-wider dark:bg-amber-950/20 dark:text-amber-400">
            Belum Kumpul
          </span>
        )
      ),
    },
    {
      header: "Tenggat Waktu",
      accessor: (item: any) => (
        <div className="flex flex-col gap-0.5 items-start">
          <CountdownPill deadline={item.deadline} />
          <span className="text-[9px] text-slate-400 font-semibold block pt-0.5">
            {new Date(item.deadline).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* Telegram Warning Banner */}
        {data && !data.telegramVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl border border-amber-200 bg-amber-50/20 relative overflow-hidden dark:border-amber-900/30 dark:bg-amber-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-450 shrink-0">
                <AlertTriangle className="size-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  ⚠️ PENTING: AKTIFKAN NOTIFIKASI TELEGRAM SIMATU!
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Anda belum menghubungkan akun dengan Bot Telegram. Segera hubungkan agar tidak terlewat notifikasi real-time tugas baru, nilai akhir, perbaikan tugas, dan pengumuman.
                  Dapatkan Chat ID Anda via{" "}
                  <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-600 dark:text-blue-400 hover:text-blue-700">
                    t.me/userinfobot
                  </a>{" "}
                  dan aktifkan Bot SIMATU di{" "}
                  <a href="https://t.me/SIMATU_NOTIF_bot" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-600 dark:text-blue-400 hover:text-blue-700">
                    t.me/SIMATU_NOTIF_bot
                  </a>.
                </p>
              </div>
            </div>
            <Link href="/mahasiswa/telegram" className="shrink-0">
              <button className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 active:scale-95 transition-all shadow-md shadow-amber-600/15 cursor-pointer">
                Hubungkan Sekarang
              </button>
            </Link>
          </motion.div>
        )}

        {/* Academic Profile & Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white border border-slate-100 shadow-xs relative overflow-hidden dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 blur-3xl rounded-full" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-blue-50 text-blue-650 flex items-center justify-center dark:bg-blue-950/30 dark:text-blue-450 shrink-0 border border-blue-100/30">
                <GraduationCap className="size-8" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-blue-650 font-bold uppercase tracking-wider dark:text-blue-400">
                  Profil Mahasiswa Aktif
                </p>
                <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight truncate">
                  {data?.stats.nama}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-450 font-mono mt-0.5">
                  NIM: {data?.stats.nim} | Angkatan {data?.stats.angkatan}
                </p>
              </div>
            </div>

            {/* Academic Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col items-start bg-slate-50 border border-slate-100 dark:bg-slate-850/50 dark:border-slate-800 px-3.5 py-2 rounded-xl">
                <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wider block">
                  Semester Aktif
                </span>
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                  Semester {data?.stats.semesterAktif}
                </span>
              </div>
              <div className="flex flex-col items-start bg-slate-50 border border-slate-100 dark:bg-slate-850/50 dark:border-slate-800 px-3.5 py-2 rounded-xl">
                <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wider block">
                  Program Studi
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-0.5">
                  {data?.stats.prodiNama}
                </span>
              </div>
              <div className="flex flex-col items-start bg-slate-50 border border-slate-100 dark:bg-slate-850/50 dark:border-slate-800 px-3.5 py-2 rounded-xl">
                <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wider block">
                  Fakultas
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-0.5">
                  {data?.stats.fakultasNama}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-[11px] text-slate-450 max-w-2xl leading-relaxed">
              Pantau beban SKS belajar semester ini, tugas aktif, dan info terbaru dosen pengampu. Klik tombol <strong>Buka Tugas Saya</strong> untuk mengumpulkan file.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/35 text-[9px] text-blue-650 font-bold uppercase tracking-wider dark:bg-blue-950/20 dark:border-blue-900/20 dark:text-blue-400 shrink-0">
              <span className="size-1.5 rounded-full bg-blue-500 animate-ping" />
              Tahun Akademik: {data?.stats.activeSemesterNama}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Mata Kuliah Diambil"
            value={`${data?.stats.totalCourses || 0} MK`}
            icon={BookOpen}
            change="Terdaftar aktif semester ini"
            changeType="positive"
          />
          <StatCard
            label="Kredit SKS Diambil"
            value={`${data?.stats.totalSks || 0} SKS`}
            icon={Trophy}
            change="Beban belajar aktif"
            changeType="neutral"
          />
          <StatCard
            label="Tugas Belum Dikumpul"
            value={`${data?.stats.pendingTasks || 0} Tugas`}
            icon={ClipboardList}
            change="Perlu segera dikerjakan"
            changeType={data?.stats.pendingTasks && data.stats.pendingTasks > 0 ? "negative" : "positive"}
          />
        </div>

        {/* Main Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Tasks and Announcements */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Table: Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                  Tenggat Tugas Terdekat
                </span>
                <Link href="/mahasiswa/tugas" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                  Buka Tugas Saya
                  <ChevronRight className="size-3" />
                </Link>
              </div>
              
              {data?.activeTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-white border border-slate-100 rounded-xl dark:bg-slate-900/40 dark:border-slate-850">
                  <CheckCircle className="size-8 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Semua Tugas Selesai!</p>
                  <p className="text-[10px] text-slate-400">Tidak ada tugas aktif yang belum dikerjakan.</p>
                </div>
              ) : (
                <DataTable
                  data={data?.activeTasks || []}
                  columns={taskColumns}
                  rowKey={(item) => item.id}
                />
              )}
            </div>

            {/* List: Announcements */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Pengumuman Akademik Terbaru
              </span>

              {data?.announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-white border border-slate-100 rounded-xl dark:bg-slate-900/40 dark:border-slate-850">
                  <Megaphone className="size-8 text-slate-350 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Tidak Ada Pengumuman</p>
                  <p className="text-[10px] text-slate-400">Belum ada info pengumuman disiarkan untuk Anda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs relative overflow-hidden dark:border-slate-850 dark:bg-slate-900/30 flex flex-col justify-between"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 blur-lg rounded-full" />
                      <div>
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-50 dark:border-slate-850">
                          <span className="text-[8px] font-bold text-purple-650 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/20 uppercase tracking-wider">
                            {ann.target === "semua" ? "Umum" : "Mahasiswa"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-850 dark:text-white leading-tight mb-1.5">
                          {ann.judul}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed truncate-3-lines">
                          {ann.isi}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100/55 dark:border-slate-850 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(ann.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate max-w-[110px]">
                          <User className="size-3 shrink-0" />
                          {ann.sender}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Password Form */}
          <div className="lg:col-span-1 space-y-6">
            <ChangePasswordForm />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}

