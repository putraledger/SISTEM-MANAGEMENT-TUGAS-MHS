"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { getAuditLogs } from "../actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { RefreshCw, Activity, Terminal } from "lucide-react"

export default function AuditLogsList() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadLogs() {
    setLoading(true)
    try {
      const res = await getAuditLogs()
      setLogs(res)
    } catch (err) {
      toast.error("Gagal memuat log aktivitas sistem")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const columns = [
    {
      header: "ID Log",
      accessor: (item: any) => <span className="font-mono text-xs text-slate-500">#{item.id}</span>,
    },
    {
      header: "Pengguna (ID)",
      accessor: (item: any) => (
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {item.user_id}
        </span>
      ),
    },
    {
      header: "Hak Akses",
      accessor: (item: any) => (
        <span className="text-[9px] px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 font-bold dark:border-blue-900/20 dark:bg-blue-950/20 dark:text-blue-400 uppercase tracking-wider">
          {item.user_role}
        </span>
      ),
    },
    {
      header: "Tindakan / Event",
      accessor: (item: any) => (
        <span className="text-xs px-2 py-1 rounded bg-slate-50 border border-slate-100 font-mono text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350">
          {item.action}
        </span>
      ),
    },
    {
      header: "Detail Perubahan",
      accessor: (item: any) => (
        <span className="text-slate-500 text-xs truncate block max-w-[250px] dark:text-slate-400">
          {item.detail || "-"}
        </span>
      ),
    },
    {
      header: "IP Address",
      accessor: (item: any) => <span className="font-mono text-[10px] text-slate-400">{item.ip_address || "localhost"}</span>,
    },
    {
      header: "Tanggal & Waktu",
      accessor: (item: any) => (
        <span className="text-slate-400 text-xs font-medium">
          {new Date(item.created_at).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Audit Logs Sistem SIMATU
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Pantau Rekam Jejak Aktivitas CRUD dan Perubahan Data Secara Real-Time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadLogs}
              variant="outline"
              size="icon"
              className="size-8 cursor-pointer ml-auto"
              title="Refresh Data"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/20 p-4 flex items-center gap-3 dark:border-slate-900 dark:bg-slate-950/5">
          <Terminal className="size-5 text-blue-600 shrink-0" />
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
            Catatan Keamanan: Halaman ini memuat 100 tindakan sistem terkini. Data tersimpan secara permanen untuk mematuhi standar audit sistem perguruan tinggi.
          </div>
        </div>

        {/* Main Data Table */}
        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <DataTable
            data={logs}
            columns={columns}
            rowKey={(item) => item.id}
            title="Log Riwayat Perubahan Sistem"
          />
        )}
      </div>
    </DashboardLayout>
  )
}
