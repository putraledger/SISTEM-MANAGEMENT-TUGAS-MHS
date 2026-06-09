"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getMahasiswaTasks } from "../actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { SemesterFilter } from "@/components/ui/semester-filter"
import {
  Award,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  FileText,
  UserCheck
} from "lucide-react"

export default function MahasiswaNilai() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | string>("active")

  async function loadData(semId = selectedSemesterId) {
    setLoading(true)
    try {
      const res = await getMahasiswaTasks(semId)
      // Filter only tasks that have submissions, since those are the ones that get graded
      setTasks(res)
    } catch (err) {
      toast.error("Gagal memuat lembar nilai")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedSemesterId)
  }, [selectedSemesterId])

  const handleExportPDF = () => {
    window.open(`/api/export/nilai?role=mahasiswa&format=pdf`, "_blank")
    toast.success("Mengekspor transkrip nilai pribadi ke PDF...")
  }

  // Redirect to tugas page with auto-open submission modal
  const handleResubmit = (taskId: number) => {
    router.push(`/mahasiswa/tugas?id=${taskId}`)
  }

  const columns = [
    {
      header: "Mata Kuliah",
      accessor: (item: any) => (
        <span className="font-bold text-blue-600 font-mono text-[10px] block">
          {item.courseKode} - {item.courseNama}
        </span>
      ),
    },
    {
      header: "Judul Tugas",
      accessor: (item: any) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]" title={item.judul}>
          {item.judul}
        </span>
      ),
    },
    {
      header: "Jawaban Anda",
      accessor: (item: any) => (
        item.submission ? (
          <a
            href={item.submission.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-blue-600 transition-colors font-mono max-w-[120px] truncate"
            title={item.submission.fileUrl}
          >
            <FileText className="size-3 shrink-0" />
            Berkas Jawaban
          </a>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Belum mengumpulkan</span>
        )
      ),
    },
    {
      header: "Skor Nilai",
      accessor: (item: any) => {
        if (!item.submission) return <span className="text-slate-400 font-medium">-</span>
        const nilai = item.submission.nilai
        return nilai ? (
          <span className="text-xs font-bold text-slate-850 dark:text-white bg-slate-50 border border-slate-100 px-2 py-0.5 rounded dark:bg-slate-900 dark:border-slate-800">
            {nilai.nilaiAngka} / 100
          </span>
        ) : (
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50/50 border border-amber-100/50 px-2 py-0.5 rounded dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/20">
            Belum Dinilai
          </span>
        )
      },
    },
    {
      header: "Status Revisi",
      accessor: (item: any) => {
        if (!item.submission || !item.submission.nilai) return <span className="text-slate-400 font-medium">-</span>
        const isRevisi = item.submission.nilai.statusRevisi === "revisi"
        return isRevisi ? (
          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-600 font-bold uppercase tracking-wider dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20 animate-pulse">
            ⚠️ Perlu Revisi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold uppercase tracking-wider dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20">
            ✓ Selesai
          </span>
        )
      },
    },
    {
      header: "Aksi Perbaikan",
      accessor: (item: any) => {
        if (!item.submission || !item.submission.nilai) return null
        const isRevisi = item.submission.nilai.statusRevisi === "revisi"
        
        // Check if deadline has passed. If passed, cannot resubmit anymore
        const deadlineDate = new Date(item.deadline)
        const deadlinePassed = deadlineDate.getTime() < new Date().getTime()

        if (isRevisi && !deadlinePassed) {
          return (
            <Button
              onClick={() => handleResubmit(item.id)}
              size="sm"
              className="text-[10px] py-1 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded active:scale-95 transition-transform"
            >
              Kumpul Ulang
              <ChevronRight className="size-3.5 ml-0.5" />
            </Button>
          )
        }
        return null
      },
    },
  ]

  // Filter tasks that have submissions to present the gradebook
  const gradedTasks = tasks.filter((t) => t.submission)

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-6"
      >
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Nilai & Evaluasi Akademik
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Pantau perolehan nilai angka, feedback kualitatif dosen, dan kumpul ulang revisi tugas Anda
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SemesterFilter
              selectedSemesterId={selectedSemesterId}
              onChange={setSelectedSemesterId}
            />
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="text-xs h-8.5 font-bold border-rose-100 text-rose-605 bg-rose-50/20 hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-all cursor-pointer dark:bg-rose-950/20 dark:border-rose-900/20 dark:text-rose-400"
            >
              <FileText className="size-4 mr-1.5" /> Cetak PDF Transkrip
            </Button>
            <Button
              onClick={() => loadData(selectedSemesterId)}
              variant="outline"
              size="icon"
              className="size-8.5 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Dynamic Class Grade Table */}
        {loading ? (
          <div className="space-y-4 w-full animate-pulse">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-slate-50 dark:bg-slate-900/50 rounded-lg" />
            ))}
          </div>
        ) : gradedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-xl dark:bg-slate-950 dark:border-slate-900">
            <Award className="size-10 text-slate-355 mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Gradebook Kosong</p>
            <p className="text-[10px] text-slate-450 mt-1 max-w-sm text-center leading-relaxed">
              Anda belum memiliki pengumpulan tugas kuliah aktif yang terdata di sistem. Silakan selesaikan pengumpulan tugas di menu **Daftar Tugas** terlebih dahulu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Grade Table */}
            <div className="lg:col-span-2 space-y-4">
              <DataTable
                data={gradedTasks}
                columns={columns}
                rowKey={(item) => item.id}
                title="Daftar Lembar Nilai Tugas"
              />
            </div>

            {/* Right Column: Detailed Feed for revisions and qualitative feedback */}
            <div className="lg:col-span-1 space-y-4">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Evaluasi & Umpan Balik Dosen
              </span>
              
              <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-1">
                {gradedTasks.map((task) => {
                  const nilai = task.submission?.nilai
                  const isRevisi = nilai?.statusRevisi === "revisi"
                  const deadlinePassed = new Date(task.deadline).getTime() < new Date().getTime()

                  if (!nilai) return null

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border shadow-xs relative overflow-hidden bg-white dark:bg-slate-900/40 ${
                        isRevisi
                          ? "border-rose-100/70 dark:border-rose-950/20"
                          : "border-slate-100 dark:border-slate-850"
                      }`}
                    >
                      {/* Top banner strip if revision needed */}
                      {isRevisi && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
                      )}

                      <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2.5 dark:border-slate-850">
                        <span className="text-[9px] font-bold text-blue-600 uppercase font-mono tracking-tight bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/30 dark:bg-blue-950/20 dark:text-blue-400">
                          {task.courseKode}
                        </span>
                        
                        {isRevisi ? (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-650 dark:bg-rose-950/10 dark:text-rose-450 uppercase animate-pulse">
                            Butuh Revisi
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-650 dark:bg-emerald-950/10 dark:text-emerald-450 uppercase">
                            Selesai
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-850 dark:text-white leading-tight mb-1 truncate" title={task.judul}>
                        {task.judul}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 block mb-3 font-mono">
                        Skor: <span className="text-slate-800 dark:text-slate-200">{nilai.nilaiAngka}</span> / 100
                      </span>

                      {/* Qualitative Feedback */}
                      <div className="bg-slate-50/50 border border-slate-100/50 p-3 rounded-lg text-[11px] text-slate-500 dark:bg-slate-900/60 dark:border-slate-850 dark:text-slate-400 leading-relaxed font-medium">
                        <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block mb-1">
                          Catatan Dosen Pengampu:
                        </span>
                        {nilai.feedback || "Tidak ada umpan balik tulisan dari dosen."}
                      </div>

                      {/* Re-submission Trigger inside the card */}
                      {isRevisi && !deadlinePassed && (
                        <div className="mt-4 pt-3.5 border-t border-slate-100/50 dark:border-slate-850 flex items-center justify-between">
                          <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            Kumpulkan perbaikan sebelum tenggat!
                          </span>
                          
                          <Button
                            onClick={() => handleResubmit(task.id)}
                            size="sm"
                            className="text-[10px] py-1 h-7.5 bg-rose-600 hover:bg-rose-700 text-white rounded active:scale-95 transition-transform"
                          >
                            Kumpul Ulang
                            <ChevronRight className="size-3.5 ml-0.5" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
