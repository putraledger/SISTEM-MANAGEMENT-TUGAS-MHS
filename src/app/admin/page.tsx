"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ChangePasswordForm } from "@/components/change-password-form"
import { StatCard } from "@/components/ui/stat-card"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Users, BookOpen, ScrollText, Activity, AlertCircle, FileText } from "lucide-react"
import { getDashboardStats, getAuditLogs } from "./actions"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalMahasiswa: number
    totalDosen: number
    totalMataKuliah: number
    totalTugasAktif: number
    activeSemesterNama: string
    chartData: any[]
  } | null>(null)

  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const dashboardStats = await getDashboardStats()
        const auditLogs = await getAuditLogs()
        setStats(dashboardStats)
        setLogs(auditLogs.slice(0, 5)) // get latest 5 logs
      } catch (err) {
        console.error("Error loading dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const logColumns = [
    {
      header: "Aktivitas",
      accessor: (item: any) => (
        <span className="font-semibold text-slate-700 dark:text-slate-350 block truncate max-w-[200px]">
          {item.action}
        </span>
      ),
    },
    {
      header: "Detail",
      accessor: (item: any) => (
        <span className="text-slate-500 text-xs dark:text-slate-400 block truncate max-w-[250px]">
          {item.detail || "-"}
        </span>
      ),
    },
    {
      header: "Pelaku",
      accessor: (item: any) => (
        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50/50 border border-blue-100/50 text-blue-600 font-bold dark:bg-blue-950/20 dark:border-blue-900/20 dark:text-blue-400">
          {item.user_id} ({item.user_role})
        </span>
      ),
    },
    {
      header: "Waktu",
      accessor: (item: any) => (
        <span className="text-slate-400 text-xs">
          {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-450">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white border border-slate-100 shadow-xs relative overflow-hidden dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
          <h3 className="text-base font-bold text-slate-800 mb-1 dark:text-white">
            Selamat Datang di Portal Administrator
          </h3>
          <p className="text-xs text-slate-450 max-w-xl leading-relaxed">
            Gunakan portal ini untuk melakukan pemantauan sistem, manajemen mahasiswa, manajemen dosen, dan pengelolaan mata kuliah secara terpusat.
          </p>
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            Semester Aktif: {stats?.activeSemesterNama}
          </div>
        </motion.div>

        {/* Stats Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Mahasiswa"
            value={stats?.totalMahasiswa || 0}
            icon={Users}
            change="Terdaftar aktif"
            changeType="positive"
          />
          <StatCard
            label="Total Dosen"
            value={stats?.totalDosen || 0}
            icon={BookOpen}
            change="Pengajar aktif"
            changeType="neutral"
          />
          <StatCard
            label="Mata Kuliah"
            value={stats?.totalMataKuliah || 0}
            icon={ScrollText}
            change="Tersedia aktif"
            changeType="positive"
          />
          <StatCard
            label="Tugas Aktif"
            value={stats?.totalTugasAktif || 0}
            icon={FileText}
            change="Diterbitkan semester ini"
            changeType="positive"
          />
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <DashboardCard className="lg:col-span-2 p-5" animateHover={false}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  Statistik Pengumpulan Tugas
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase mt-0.5">
                  Visualisasi Ketepatan Waktu 7 Hari Terakhir
                </p>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/30">
                Mingguan
              </span>
            </div>
            
            <div className="h-[280px] w-full text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats?.chartData || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="tanggal" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    name="Tepat Waktu"
                    dataKey="TepatWaktu"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorOnTime)"
                  />
                  <Area
                    type="monotone"
                    name="Terlambat"
                    dataKey="Terlambat"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorLate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Side distribution chart */}
          <DashboardCard className="lg:col-span-1 p-5" animateHover={false}>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                Rasio Pengumpulan
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase mt-0.5 mb-6">
                Pembagian Tepat Waktu vs Terlambat
              </p>
            </div>
            
            <div className="h-[200px] w-full flex items-center justify-center text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="tanggal" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar name="Tepat Waktu" dataKey="TepatWaktu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar name="Terlambat" dataKey="Terlambat" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-450 font-medium">Berdasarkan data terkini</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <AlertCircle className="size-3.5" /> Terupdate otomatis
              </span>
            </div>
          </DashboardCard>
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Controls & Logs Table */}
          <div className="lg:col-span-2">
            <DataTable
              title="Audit Log Aktivitas Terbaru"
              data={logs}
              columns={logColumns}
              rowKey={(item) => item.id}
              actionButton={
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="size-3.5 animate-pulse" /> Live Monitoring
                </span>
              }
            />
          </div>

          {/* Right Column: Password Form */}
          <div className="lg:col-span-1">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
