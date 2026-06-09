"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { getDosenNotifications, markAllDosenNotificationsAsRead } from "../actions"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Check, Inbox, Calendar, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function DosenNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    try {
      const res = await getDosenNotifications()
      setNotifications(res)
    } catch (err) {
      console.error("Gagal mengambil notifikasi dosen:", err)
      toast.error("Gagal memuat notifikasi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await markAllDosenNotificationsAsRead()
      toast.success("Semua notifikasi ditandai telah dibaca.")
      loadNotifications()
    } catch (err) {
      console.error("Gagal menandai semua dibaca:", err)
      toast.error("Gagal mengubah status notifikasi.")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-450">Memuat log notifikasi pengajaran...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Bell className="size-5 text-blue-600 dark:text-blue-400" />
              Notifikasi Saya
            </h3>
            <p className="text-xs text-slate-450">
              Riwayat pengumuman kelas yang telah Anda siarkan dan pesan pemberitahuan penting dari administrasi.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100/70 border border-blue-100/40 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/20 shrink-0"
            >
              <Check className="size-3.5" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* List Content */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-xl dark:bg-slate-900/40 dark:border-slate-850">
            <Inbox className="size-10 text-slate-350 mb-3" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Tidak Ada Notifikasi</p>
            <p className="text-[10px] text-slate-400">Log riwayat notifikasi Anda masih kosong.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, index) => {
              const isAlert = notif.judul.includes("⚠️") || notif.judul.includes("PENTING")

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`p-4 rounded-xl border bg-white shadow-xs relative overflow-hidden transition-all dark:bg-slate-900/30 ${
                    notif.is_read
                      ? "border-slate-100 dark:border-slate-850"
                      : "border-blue-100 bg-blue-50/5 dark:border-blue-950/20 dark:bg-blue-950/5"
                  }`}
                >
                  {/* Left accent color strip for unread */}
                  {!notif.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  )}

                  <div className="flex gap-3.5 items-start">
                    {/* Icon bubble */}
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isAlert
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-450"
                      }`}
                    >
                      {isAlert ? (
                        <AlertCircle className="size-4" />
                      ) : (
                        <Bell className="size-4" />
                      )}
                    </div>

                    {/* Content text */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate">
                          {notif.judul}
                        </h4>
                        {!notif.is_read && (
                          <span className="shrink-0 text-[8px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">
                            Baru
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line font-medium">
                        {notif.pesan}
                      </p>

                      <div className="flex items-center gap-1 text-[9px] text-slate-400 pt-2 font-semibold uppercase tracking-wider">
                        <Calendar className="size-3" />
                        {new Date(notif.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
