"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { SemesterFilter } from "@/components/ui/semester-filter"
import { getMahasiswaArchiveData } from "../actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Archive, 
  BookOpen, 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap,
  ClipboardList
} from "lucide-react"

export default function MahasiswaArsip() {
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | string>("active")
  const [archiveData, setArchiveData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null)

  async function loadArchive(semId: number | string) {
    if (semId === "active") {
      setArchiveData([])
      return
    }
    setLoading(true)
    try {
      const res = await getMahasiswaArchiveData(typeof semId === "string" ? parseInt(semId, 10) : semId)
      setArchiveData(res)
      setExpandedClassId(null)
    } catch (err) {
      toast.error("Gagal memuat arsip semester")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArchive(selectedSemesterId)
  }, [selectedSemesterId])

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
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Archive className="size-5 text-blue-600 dark:text-blue-450" />
              Arsip Semester Anda
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Tinjau kelas, beban SKS, tugas, nilai akhir, dan umpan balik dosen dari semester lampau
            </p>
          </div>
          <div>
            <SemesterFilter
              selectedSemesterId={selectedSemesterId}
              onChange={setSelectedSemesterId}
              showActiveOptionOnly={false}
            />
          </div>
        </div>

        {/* Content */}
        {selectedSemesterId === "active" ? (
          <DashboardCard className="p-12 flex flex-col items-center justify-center text-center bg-white border-slate-100" animateScroll={false}>
            <div className="p-4 rounded-full bg-slate-50 text-slate-400 mb-3 dark:bg-slate-900/50">
              <Archive className="size-8" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Pilih Semester Lampau</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              Silakan pilih salah satu semester non-aktif pada dropdown filter di atas untuk meninjau riwayat pembelajaran Anda.
            </p>
          </DashboardCard>
        ) : loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-5 border border-slate-100 rounded-xl bg-white dark:bg-slate-900/50 dark:border-slate-850 h-28 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4.5 w-48 bg-slate-200 dark:bg-slate-750 rounded" />
                  <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-7 w-20 bg-slate-150 dark:bg-slate-800 rounded-lg self-end" />
              </div>
            ))}
          </div>
        ) : archiveData.length === 0 ? (
          <DashboardCard className="p-12 flex flex-col items-center justify-center text-center bg-white border-slate-100" animateScroll={false}>
            <div className="p-4 rounded-full bg-blue-50 text-blue-600 mb-3 dark:bg-blue-950/20 dark:text-blue-400">
              <BookOpen className="size-8" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Tidak Ada Mata Kuliah Terdaftar</p>
            <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
              Anda tidak memiliki riwayat pengambilan mata kuliah aktif terdaftar di semester ini.
            </p>
          </DashboardCard>
        ) : (
          <div className="space-y-4">
            {archiveData.map((cls) => {
              const isClassExpanded = expandedClassId === cls.courseId
              return (
                <DashboardCard 
                  key={cls.courseId} 
                  className={`border overflow-hidden bg-white dark:bg-slate-900/40 transition-all ${
                    isClassExpanded ? "border-blue-150 dark:border-blue-900/30 shadow-md" : "border-slate-100 dark:border-slate-850"
                  }`}
                  animateScroll={false}
                >
                  {/* Class Row Summary */}
                  <div 
                    onClick={() => setExpandedClassId(isClassExpanded ? null : cls.courseId)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center dark:bg-blue-950/20 dark:text-blue-400 shrink-0">
                        <BookOpen className="size-5.5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100/30 px-2 py-0.5 rounded-full dark:bg-blue-950/20 dark:text-blue-400">
                          {cls.kode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-850 dark:text-white mt-1.5 leading-snug">
                          {cls.nama}
                        </h4>
                        <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-450 font-medium">
                          <span>{cls.sks} SKS</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><ClipboardList className="size-3.5" /> {cls.tugas.length} Tugas Kuliah</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => setExpandedClassId(isClassExpanded ? null : cls.courseId)}
                        className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                      >
                        {isClassExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Task list */}
                  <AnimatePresence>
                    {isClassExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="border-t border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10"
                      >
                        <div className="p-5 space-y-4">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Tugas & Lembar Hasil Evaluasi Anda:
                          </h5>
                          {cls.tugas.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">Tidak ada tugas diterbitkan pada mata kuliah ini.</p>
                          ) : (
                            <div className="space-y-4">
                              {cls.tugas.map((t: any) => {
                                const hasSub = !!t.submission
                                const hasNilai = !!t.submission?.nilai
                                return (
                                  <div key={t.id} className="p-4 rounded-xl border border-slate-100 bg-white dark:border-slate-850 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1 min-w-0">
                                      <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {t.judul}
                                      </h6>
                                      <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
                                        {t.deskripsi || "Tidak ada deskripsi panduan."}
                                      </p>
                                      
                                      <div className="flex flex-wrap items-center gap-3 pt-1.5 text-[9px] font-bold uppercase tracking-wide">
                                        {t.lampiranUrl && (
                                          <a 
                                            href={t.lampiranUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded hover:bg-blue-100"
                                          >
                                            <Download className="size-3" /> Lampiran Dosen
                                          </a>
                                        )}
                                        {hasSub && (
                                          <a 
                                            href={t.submission.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-slate-650 bg-slate-50 border border-slate-205 px-2 py-0.5 rounded hover:bg-slate-100 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-350"
                                          >
                                            <FileText className="size-3" /> Berkas Jawaban Anda
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    {/* Grade and Feedback Box */}
                                    <div className="md:w-64 shrink-0 p-3 rounded-lg border border-slate-50 bg-slate-50/40 dark:border-slate-850 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Skor Evaluasi:</span>
                                        {hasNilai ? (
                                          <span className="text-xs font-bold text-slate-800 dark:text-white font-mono bg-white border border-slate-100 px-1.5 py-0.2 rounded dark:bg-slate-950 dark:border-slate-850">
                                            {t.submission.nilai.nilaiAngka} / 100
                                          </span>
                                        ) : hasSub ? (
                                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/20 uppercase tracking-wide">Belum Dinilai</span>
                                        ) : (
                                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/20 uppercase tracking-wide">Missing</span>
                                        )}
                                      </div>
                                      
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                        <span className="font-bold text-[8px] text-slate-400 uppercase tracking-wide block mb-0.5">Umpan Balik Dosen:</span>
                                        {hasNilai ? (t.submission.nilai.feedback || "Tidak ada catatan feedback tertulis.") : "-"}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </DashboardCard>
              )
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
