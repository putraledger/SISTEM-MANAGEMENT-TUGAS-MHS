"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ChangePasswordForm } from "@/components/change-password-form"
import { StatCard } from "@/components/ui/stat-card"
import { CountdownPill } from "@/components/ui/countdown-pill"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Users, BookOpenCheck, ListTodo, AlertTriangle, BookOpen, GraduationCap, ChevronRight, CheckCircle } from "lucide-react"
import { getDosenDashboardStats, getDosenDashboardDetails } from "./actions"
import Link from "next/link"

export default function DosenDashboard() {
  const [stats, setStats] = useState<{
    totalClasses: number
    totalTasks: number
    ungradedCount: number
    activeSemesterNama: string
    telegramVerified: boolean
  } | null>(null)
  const [details, setDetails] = useState<{
    courses: any[]
    ungradedTasks: any[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getDosenDashboardStats()
        setStats(res)
        const detailsRes = await getDosenDashboardDetails()
        setDetails(detailsRes)
      } catch (err) {
        console.error("Gagal memuat statistik dosen:", err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
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

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* Telegram Warning Banner */}
        {stats && !stats.telegramVerified && (
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
                  Anda belum menghubungkan akun dengan Bot Telegram. Segera hubungkan agar tidak terlewat notifikasi real-time jika ada submisi tugas, nilai baru, atau pengumuman penting.
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
            <Link href="/dosen/telegram" className="shrink-0">
              <button className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 active:scale-95 transition-all shadow-md shadow-amber-600/15 cursor-pointer">
                Hubungkan Sekarang
              </button>
            </Link>
          </motion.div>
        )}

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white border border-slate-100 shadow-xs relative overflow-hidden dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
          <h3 className="text-base font-bold text-slate-800 mb-1 dark:text-white">
            Selamat Datang di Portal Pengajaran Dosen
          </h3>
          <p className="text-xs text-slate-450 max-w-xl leading-relaxed">
            Portal akademik Anda untuk mengelola mata kuliah diampu, membuat tugas pembelajaran digital, mengoreksi submissions secara praktis, dan mengirimkan nilai langsung.
          </p>
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
            <span className="size-2 rounded-full bg-blue-500 animate-ping" />
            Tahun Akademik: {stats?.activeSemesterNama}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Mata Kuliah Saya"
            value={stats?.totalClasses || 0}
            icon={BookOpenCheck}
            change="Aktif diampu semester ini"
            changeType="positive"
          />
          <StatCard
            label="Total Tugas Dibuat"
            value={stats?.totalTasks || 0}
            icon={ListTodo}
            change="Tugas terbit/draft"
            changeType="neutral"
          />
          <StatCard
            label="Submissions Perlu Dinilai"
            value={stats?.ungradedCount || 0}
            icon={Users}
            change="Belum dikoreksi dosen"
            changeType={stats?.ungradedCount && stats.ungradedCount > 0 ? "negative" : "positive"}
          />
        </div>

        {/* Interactive Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left / Middle: Dynamic Academic Summaries */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* List of Tasks Needing Grading */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/50 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 dark:border-slate-850">
                <div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                    Tugas Perlu Segera Dinilai
                  </h4>
                  <p className="text-[10px] text-slate-400">Pekerjaan mahasiswa yang menunggu penilaian Anda</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400">
                  {details?.ungradedTasks.length || 0} Tugas Menunggu
                </span>
              </div>

              {details?.ungradedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 mb-2 dark:bg-emerald-950/20 dark:text-emerald-400">
                    <CheckCircle className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Semua Beres!</p>
                  <p className="text-[10px] text-slate-400">Seluruh pengumpulan tugas mahasiswa telah dinilai.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-850">
                  {details?.ungradedTasks.map((task) => (
                    <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tight block">
                          {task.mataKuliahKode} - {task.mataKuliahNama}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {task.judul}
                        </h5>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] text-rose-500 font-semibold">
                            {task.ungradedCount} dari {task.totalSubmissions} submission belum dinilai
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <CountdownPill deadline={task.deadline} />
                        </div>
                      </div>
                      <Link href={`/dosen/submissions?tugasId=${task.id}`} className="shrink-0">
                        <button className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100/70 border border-blue-100/50 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/20">
                          Koreksi
                          <ChevronRight className="size-3.5" />
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* List of Courses Taught */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/50 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 dark:border-slate-850">
                <div>
                  <h4 className="text-xs font-bold text-slate-855 dark:text-white uppercase tracking-wider">
                    Mata Kuliah yang Saya Ampu
                  </h4>
                  <p className="text-[10px] text-slate-400">Daftar kelas perkuliahan aktif di semester ini</p>
                </div>
                <Link href="/dosen/kelas" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                  Lihat Semua
                  <ChevronRight className="size-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {details?.courses.map((course) => (
                  <div key={course.id} className="p-3.5 rounded-xl border border-slate-50 bg-slate-50/20 dark:border-slate-850 dark:bg-slate-900/20 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[9px] font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100/40 px-2 py-0.5 rounded-full dark:bg-blue-950/20 dark:text-blue-400">
                        {course.kode}
                      </span>
                      <h5 className="text-xs font-bold text-slate-850 dark:text-slate-100 mt-2 leading-snug truncate">
                        {course.nama}
                      </h5>
                      <p className="text-[10px] text-slate-450 mt-1 font-medium">
                        {course.sks} SKS • {course.prodi}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100/55 pt-2.5 dark:border-slate-850">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                        <GraduationCap className="size-3.5 text-blue-600" />
                        {course.studentCount} Mahasiswa
                      </span>
                      
                      <Link href={`/dosen/kelas`} className="text-[10px] font-bold text-blue-650 hover:underline">
                        Buka Kelas
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Telegram Notice */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450 shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-850 dark:text-white leading-none mb-1">
                    Ingat Pengiriman Notifikasi Telegram
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    Sistem SIMATU terintegrasi dengan Bot Telegram Universitas. Setiap tugas perkuliahan yang diterbitkan (*publish*) akan memicu pemberitahuan instan ke ponsel seluruh mahasiswa terdaftar. Pengiriman lembar penilaian (angka dan revisi) juga dikabarkan secara personal kepada mahasiswa yang bersangkutan.
                  </p>
                </div>
              </div>
            </motion.div>
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

