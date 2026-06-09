"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { getTelegramLinkStatus, unlinkTelegram } from "../actions"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, CheckCircle, RefreshCw, Smartphone, ShieldCheck, XCircle, ArrowRight, ExternalLink, Info } from "lucide-react"
import toast from "react-hot-toast"

export default function DosenTelegramPage() {
  const [status, setStatus] = useState<{
    isVerified: boolean
    token: string | null
    chatId: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  // 1. Initial Load
  const loadStatus = async (showToast = false) => {
    try {
      const res = await getTelegramLinkStatus()
      if (res && res.success === false) {
        toast.error(res.error || "Gagal mengambil status Telegram.")
        setStatus(null)
        return
      }
      setStatus(res)
      if (showToast && res.isVerified) {
        toast.success("Telegram berhasil terhubung!")
      }
    } catch (err) {
      console.error("Gagal memuat status Telegram:", err)
      toast.error("Gagal mengambil status Telegram.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  // 2. Poll /api/telegram/poll when not verified
  useEffect(() => {
    if (!status || status.isVerified) return

    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/telegram/poll")
        if (res.ok) {
          const data = await res.json()
          if (data.verified) {
            setStatus({
              isVerified: true,
              token: data.token,
              chatId: data.chatId,
            })
            toast.success("Koneksi Bot Telegram Berhasil Terdeteksi! 🎉")
            clearInterval(interval)
            setPolling(false)
          }
        }
      } catch (err) {
        console.error("Error polling telegram updates:", err)
      }
    }, 5000) // Poll every 5 seconds for rapid feedback

    return () => {
      clearInterval(interval)
      setPolling(false)
    }
  }, [status?.isVerified])

  // 3. Unlink Handler
  const handleUnlink = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan koneksi bot Telegram? Anda tidak akan menerima notifikasi Telegram lagi.")) return
    setUnlinking(true)
    try {
      await unlinkTelegram()
      toast.success("Koneksi Telegram berhasil diputuskan.")
      loadStatus()
    } catch (err) {
      console.error("Error unlinking telegram:", err)
      toast.error("Gagal memutuskan koneksi Telegram.")
    } finally {
      setUnlinking(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-450">Memeriksa status integrasi Telegram...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Send className="size-5 text-blue-600 dark:text-blue-400" />
            Hubungkan Bot Telegram SIMATU
          </h3>
          <p className="text-xs text-slate-450 leading-relaxed">
            Tautkan akun SIMATU Anda dengan Telegram untuk memperoleh notifikasi instan langsung di ponsel Anda.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status?.isVerified ? (
            /* VERIFIED STATE UI */
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-6 rounded-xl bg-emerald-50/30 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 flex flex-col items-center text-center space-y-4 shadow-sm"
            >
              <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400 animate-pulse">
                <ShieldCheck className="size-10" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Telegram Terhubung & Aktif</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Akun Anda saat ini sudah terintegrasi secara penuh dengan sistem notifikasi Universitas. Anda akan menerima pesan real-time jika ada tugas baru, nilai, maupun pengumuman.
                </p>
              </div>

              {/* Chat Info Cards */}
              <div className="w-full grid grid-cols-2 gap-4 max-w-md pt-2">
                <div className="p-3 rounded-lg bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">ID Telegram Chat</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 mt-0.5 block">{status.chatId}</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Token Integrasi</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 mt-0.5 block">{status.token}</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => loadStatus(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-1.5 active:scale-95 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850"
                >
                  <RefreshCw className="size-3.5" />
                  Segarkan Status
                </button>
                <button
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-100 border border-rose-100/50 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20"
                >
                  {unlinking ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  Putuskan Koneksi
                </button>
              </div>
            </motion.div>
          ) : (
            /* UNVERIFIED STATE UI */
            <motion.div
              key="unverified"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Token Card */}
              <div className="p-6 rounded-xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col items-center text-center space-y-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
                <div className="p-3 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                  <Smartphone className="size-8" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-blue-650 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Kode Token Hubung Anda
                  </span>
                  <div className="text-2xl md:text-3xl font-mono font-extrabold text-slate-800 dark:text-white tracking-widest mt-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-6 py-2.5 rounded-xl inline-block shadow-inner select-all">
                    {status?.token}
                  </div>
                </div>
                {polling && (
                  <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                    Menunggu Anda mengirim pesan di Telegram...
                  </div>
                )}
              </div>

              {/* Instructions Panel */}
              <div className="p-6 rounded-xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-850 shadow-xs space-y-5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-50 dark:border-slate-850 pb-3 flex items-center gap-1.5">
                  <Info className="size-4 text-blue-500" />
                  Instruksi Langkah Demi Langkah
                </h4>

                <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <span className="size-5 rounded-full bg-blue-550 border border-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      1
                    </span>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 dark:text-white">Aktifkan Bot Telegram SIMATU</p>
                      <p className="text-slate-450 text-[11px] leading-relaxed">
                        Klik link berikut untuk membuka bot resmi:{" "}
                        <a
                          href="https://t.me/SIMATU_NOTIF_bot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          t.me/SIMATU_NOTIF_bot
                          <ExternalLink className="size-3" />
                        </a>{" "}
                        lalu tekan tombol <strong className="text-slate-700 dark:text-white">Start / Mulai</strong> pada aplikasi Telegram Anda.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <span className="size-5 rounded-full bg-blue-550 border border-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      2
                    </span>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 dark:text-white">Kirim Perintah Sambung (Connect)</p>
                      <p className="text-slate-450 text-[11px] leading-relaxed">
                        Salin perintah berikut lalu kirimkan langsung dalam chat room bot Telegram tersebut:
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-2.5 rounded-lg font-mono text-[10px] text-slate-855 dark:text-slate-200 select-all font-bold block mt-1.5 max-w-sm">
                        /connect {status?.token}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3">
                    <span className="size-5 rounded-full bg-blue-550 border border-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      3
                    </span>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 dark:text-white">Dapatkan Chat ID (Alternatif)</p>
                      <p className="text-slate-450 text-[11px] leading-relaxed">
                        Jika Anda ingin memeriksa info profil dan nomor Chat ID Telegram pribadi Anda secara manual, Anda bisa mengunjungi:{" "}
                        <a
                          href="https://t.me/userinfobot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-650 dark:text-purple-400 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          t.me/userinfobot
                          <ExternalLink className="size-3" />
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Detection Notification Pill */}
                <div className="pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RefreshCw className="size-3.5 animate-spin text-blue-500" />
                    Mendeteksi koneksi Telegram secara real-time...
                  </span>
                  <button
                    onClick={() => loadStatus(true)}
                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Periksa Manual
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
