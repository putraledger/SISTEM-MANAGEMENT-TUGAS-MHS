"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getSemesters, setActiveSemester } from "../actions"
import { checkMigrationStats, migrasiOtomatis } from "@/actions/migrasiOtomatis"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { CheckCircle, RefreshCw, Layers, ArrowRight, X, GraduationCap, TrendingUp, BookOpen, AlertTriangle, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function SemesterManagement() {
  const [semesters, setSemesters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Migration states
  const [isMigrateOpen, setIsMigrateOpen] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [migrationStats, setMigrationStats] = useState<{
    activeSemesterNama: string
    nextSemesterNama: string
    promotedCount: number
    graduatedCount: number
  } | null>(null)

  const [warnings, setWarnings] = useState<string[]>([])
  const [migrationSummary, setMigrationSummary] = useState<{
    studentsPromoted: number
    studentsGraduated: number
    enrollmentsCreated: number
  } | null>(null)

  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const result = await getSemesters()
      setSemesters(result)
    } catch (err) {
      toast.error("Gagal memuat data semester")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleActivate = async (id: number) => {
    if (confirm("Aktifkan semester ini secara eksklusif? Semester aktif lainnya akan otomatis dinonaktifkan.")) {
      try {
        await setActiveSemester(id)
        toast.success("Semester aktif berhasil diperbarui")
        loadData()
      } catch (err) {
        toast.error("Gagal mengaktifkan semester")
      }
    }
  }

  const openMigrationModal = async () => {
    setIsMigrateOpen(true)
    setLoadingStats(true)
    setMigrationStats(null)
    setMigrationSummary(null)
    setWarnings([])
    try {
      const stats = await checkMigrationStats()
      setMigrationStats(stats)
    } catch (err) {
      toast.error("Gagal memuat detail data migrasi")
      setIsMigrateOpen(false)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleMigrate = async () => {
    setSaving(true)
    setWarnings([])
    setMigrationSummary(null)
    try {
      const res = await migrasiOtomatis()
      if (res.success) {
        toast.success("Migrasi semester sukses dilaksanakan!")
        setMigrationSummary({
          studentsPromoted: res.studentsPromoted,
          studentsGraduated: res.studentsGraduated,
          enrollmentsCreated: res.enrollmentsCreated
        })
        setWarnings(res.warnings || [])
        loadData()
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memigrasi data semester")
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      header: "ID",
      accessor: (item: any) => <span className="font-mono text-xs text-slate-500">#{item.id}</span>,
    },
    {
      header: "Nama Semester",
      accessor: (item: any) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {item.nama}
        </span>
      ),
    },
    {
      header: "Status Keaktifan",
      accessor: (item: any) => (
        <span
          className={`text-[9px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
            item.is_active
              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20"
              : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800 dark:text-slate-500"
          }`}
        >
          {item.is_active ? "Aktif Saat Ini" : "Tidak Aktif"}
        </span>
      ),
    },
    {
      header: "Tanggal Pembuatan",
      accessor: (item: any) => (
        <span className="text-slate-400 text-xs" suppressHydrationWarning>
          {new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Aksi Keaktifan / Migrasi",
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
          {item.is_active ? (
            <Button
              size="sm"
              onClick={openMigrationModal}
              className="text-[10px] py-1 h-7 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95 transition-transform"
            >
              <Layers className="size-3.5 mr-1" /> Migrasi Semester
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleActivate(item.id)}
              className="text-[10px] py-1 h-7 border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer active:scale-95 transition-transform dark:border-emerald-900 dark:text-emerald-450 dark:hover:bg-emerald-950/20"
            >
              <CheckCircle className="size-3.5 mr-1" /> Aktifkan Semester
            </Button>
          )}
        </div>
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
              Manajemen Semester Akademik
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Otomatisasi transisi semester, promosi mahasiswa, kelulusan, dan enrollment
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={openMigrationModal}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform cursor-pointer"
            >
              <Layers className="size-4 mr-1.5" /> Migrasi ke Semester Berikutnya
            </Button>
          </div>
        </div>

        {/* Info card */}
        <DashboardCard className="p-4 bg-blue-50/20 border-blue-100/50 flex items-center justify-between dark:bg-blue-950/5 dark:border-blue-900/10" animateScroll={false}>
          <div className="text-xs font-semibold text-blue-650 dark:text-blue-400">
            Sistem otomatisasi mendeteksi semester aktif saat ini, menghasilkan nama semester baru secara berkala, melakukan promosi tingkat, dan memproses kelulusan mahasiswa tingkat akhir secara instan.
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            size="icon"
            className="size-8 cursor-pointer shrink-0 ml-4"
            title="Refresh Data"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </DashboardCard>

        {/* Main Data Table */}
        {loading ? (
          <div className="flex h-[30vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <DataTable
            data={semesters}
            columns={columns}
            rowKey={(item) => item.id}
            title="Riwayat Semester Terdata"
          />
        )}

        {/* ==========================================
            MIGRASI SEMESTER MODAL
           ========================================== */}
        <AnimatePresence>
          {isMigrateOpen && (
            <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-xl border border-slate-100 shadow-2xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4.5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      Sistem Migrasi Semester Otomatis
                    </h4>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 cursor-pointer"
                    onClick={() => {
                      if (!saving) {
                        setIsMigrateOpen(false)
                        setMigrationSummary(null)
                        setWarnings([])
                      }
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Content Body */}
                <div className="p-5 space-y-4">
                  {loadingStats ? (
                    <div className="flex flex-col py-10 items-center justify-center gap-3">
                      <div className="size-7 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Menganalisis data semester & mahasiswa...</span>
                    </div>
                  ) : migrationSummary ? (
                    /* Success Step */
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs dark:bg-emerald-950/20 dark:border-emerald-900/20 dark:text-emerald-400">
                        <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Migrasi Sukses Diproses!</span>
                        </div>
                        <p className="mb-2 leading-relaxed">
                          Database telah dimutakhirkan dengan status semester aktif yang baru. Rincian tindakan yang dilakukan:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 font-medium">
                          <li>Mahasiswa naik semester (Promosi): <strong>{migrationSummary.studentsPromoted}</strong> orang</li>
                          <li>Mahasiswa lulus otomatis (Semester &ge; 8): <strong>{migrationSummary.studentsGraduated}</strong> orang</li>
                          <li>Enrollment kelas baru yang disesuaikan: <strong>{migrationSummary.enrollmentsCreated}</strong> pendaftaran</li>
                        </ul>
                      </div>

                      {warnings.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            Catatan Penting Sistem ({warnings.length}):
                          </span>
                          <div className="max-h-40 overflow-y-auto p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-[10.5px] text-amber-700 dark:bg-amber-950/10 dark:border-amber-900/20 dark:text-amber-400 space-y-1">
                            {warnings.map((w, idx) => (
                              <p key={idx} className="flex gap-1.5 items-start">
                                <span className="shrink-0">•</span>
                                <span>{w}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-900">
                        <Button
                          type="button"
                          onClick={() => {
                            setIsMigrateOpen(false)
                            setMigrationSummary(null)
                            setWarnings([])
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 cursor-pointer active:scale-95 transition-transform"
                        >
                          Selesai
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Confirmation step */
                    <div className="space-y-4">
                      <div className="rounded-lg bg-amber-50 border border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/20 dark:text-amber-400 p-3.5 leading-relaxed text-xs">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                          <div>
                            <span className="font-bold block mb-0.5">Konfirmasi Aksi Sistem</span>
                            Tindakan ini akan menaikkan status semester seluruh mahasiswa aktif dan membuat pendaftaran kelas otomatis di semester baru. Proses ini berjalan secara eksklusif.
                          </div>
                        </div>
                      </div>

                      {/* Display flow */}
                      <div className="grid grid-cols-5 items-center gap-2 p-3.5 bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-900/50 dark:border-slate-900 text-center">
                        <div className="col-span-2 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Semester Asal</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                            {migrationStats?.activeSemesterNama}
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <ArrowRight className="size-4.5 text-slate-400" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Semester Baru</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block truncate">
                            {migrationStats?.nextSemesterNama}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Stats */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Proyeksi Dampak Data Akademik:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 bg-blue-50/40 border border-blue-100/40 rounded-lg flex items-center gap-2.5 dark:bg-blue-950/10 dark:border-blue-900/20">
                            <TrendingUp className="size-5 text-blue-600 dark:text-blue-450 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 block leading-tight font-medium">Mahasiswa Naik</span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {migrationStats?.promotedCount} Orang
                              </span>
                            </div>
                          </div>
                          <div className="p-3 bg-indigo-50/40 border border-indigo-100/40 rounded-lg flex items-center gap-2.5 dark:bg-indigo-950/10 dark:border-indigo-900/20">
                            <GraduationCap className="size-5 text-indigo-600 dark:text-indigo-455 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 block leading-tight font-medium">Lulus Otomatis</span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {migrationStats?.graduatedCount} Orang
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          className="text-xs text-slate-500 cursor-pointer"
                          onClick={() => setIsMigrateOpen(false)}
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={saving}
                          onClick={handleMigrate}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform cursor-pointer"
                        >
                          {saving ? "Memproses Migrasi..." : "Mulai Migrasi Data"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
