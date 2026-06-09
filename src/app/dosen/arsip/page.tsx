"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { SemesterFilter } from "@/components/ui/semester-filter"
import { getDosenArchiveData } from "../actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Archive, 
  BookOpen, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  User, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  GraduationCap,
  ClipboardList
} from "lucide-react"

export default function DosenArsip() {
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | string>("active")
  const [archiveData, setArchiveData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)

  async function loadArchive(semId: number | string) {
    if (semId === "active") {
      setArchiveData([])
      return
    }
    setLoading(true)
    try {
      const res = await getDosenArchiveData(typeof semId === "string" ? parseInt(semId, 10) : semId)
      setArchiveData(res)
      setExpandedClassId(null)
      setExpandedTaskId(null)
    } catch (err) {
      toast.error("Gagal memuat arsip semester")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArchive(selectedSemesterId)
  }, [selectedSemesterId])

  const handleExport = (courseId: number, format: "xlsx" | "pdf") => {
    if (selectedSemesterId === "active") return
    
    const semIdStr = selectedSemesterId.toString()
    window.open(`/api/export/nilai?role=dosen&format=${format}&mata_kuliah_id=${courseId}&semester_id=${semIdStr}`, "_blank")
    toast.success(`Mengunduh file nilai dalam format ${format.toUpperCase()}...`)
  }

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
              Arsip Semester Dosen
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Tinjau kelas, tugas, berkas submisi, dan laporan nilai mahasiswa dari semester lampau
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
              Silakan pilih salah satu semester non-aktif pada dropdown filter di atas untuk meninjau data arsip pembelajaran.
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
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Tidak Ada Kelas Diajarkan</p>
            <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
              Anda tidak memiliki riwayat pengajaran atau kelas aktif terdaftar di semester ini.
            </p>
          </DashboardCard>
        ) : (
          <div className="space-y-4">
            {archiveData.map((cls) => {
              const isClassExpanded = expandedClassId === cls.mata_kuliah_id
              return (
                <DashboardCard 
                  key={cls.mata_kuliah_id} 
                  className={`border overflow-hidden bg-white dark:bg-slate-900/40 transition-all ${
                    isClassExpanded ? "border-blue-150 dark:border-blue-900/30 shadow-md" : "border-slate-100 dark:border-slate-850"
                  }`}
                  animateScroll={false}
                >
                  {/* Class Row Summary */}
                  <div 
                    onClick={() => setExpandedClassId(isClassExpanded ? null : cls.mata_kuliah_id)}
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
                          <span>{cls.prodi}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><GraduationCap className="size-3.5" /> {cls.enrollments.length} Siswa</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><ClipboardList className="size-3.5" /> {cls.tugas.length} Tugas</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(cls.mata_kuliah_id, "xlsx")}
                        className="text-[10px] h-8.5 font-bold border-emerald-100 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition-all cursor-pointer dark:bg-emerald-950/20 dark:border-emerald-900/20 dark:text-emerald-400"
                      >
                        <FileSpreadsheet className="size-3.5 mr-1" /> Excel
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(cls.mata_kuliah_id, "pdf")}
                        className="text-[10px] h-8.5 font-bold border-rose-100 text-rose-600 bg-rose-50/20 hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-all cursor-pointer dark:bg-rose-950/20 dark:border-rose-900/20 dark:text-rose-450"
                      >
                        <FileText className="size-3.5 mr-1" /> PDF
                      </Button>
                      <button
                        onClick={() => setExpandedClassId(isClassExpanded ? null : cls.mata_kuliah_id)}
                        className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors ml-2 cursor-pointer"
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
                            Daftar Tugas Semester Ini:
                          </h5>
                          {cls.tugas.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">Tidak ada tugas diterbitkan pada kelas ini.</p>
                          ) : (
                            <div className="space-y-3">
                              {cls.tugas.map((t: any) => {
                                const isTaskExpanded = expandedTaskId === t.id
                                return (
                                  <div key={t.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white dark:border-slate-850 dark:bg-slate-900/40">
                                    <div 
                                      onClick={() => setExpandedTaskId(isTaskExpanded ? null : t.id)}
                                      className="p-4 flex items-center justify-between cursor-pointer select-none bg-slate-50/30 dark:bg-slate-900/50"
                                    >
                                      <div>
                                        <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                          {t.judul}
                                        </h6>
                                        <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                          Tenggat: {new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-650 border border-blue-100/40 dark:bg-blue-950/20 dark:text-blue-400">
                                          {t.submissions.length} Pengumpulan
                                        </span>
                                        {isTaskExpanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                                      </div>
                                    </div>

                                    {/* Submissions list inside task */}
                                    <AnimatePresence>
                                      {isTaskExpanded && (
                                        <motion.div
                                          initial={{ height: 0 }}
                                          animate={{ height: "auto" }}
                                          exit={{ height: 0 }}
                                          className="border-t border-slate-50 dark:border-slate-850 p-4"
                                        >
                                          {t.submissions.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic py-2 text-center">Belum ada pengumpulan dari mahasiswa.</p>
                                          ) : (
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                                                    <th className="py-2.5 px-3">Mahasiswa</th>
                                                    <th className="py-2.5 px-3">Waktu Submit</th>
                                                    <th className="py-2.5 px-3">Berkas</th>
                                                    <th className="py-2.5 px-3">Skor Nilai</th>
                                                    <th className="py-2.5 px-3">Catatan Umpan Balik</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                                                  {t.submissions.map((sub: any) => (
                                                    <tr key={sub.id} className="text-slate-700 dark:text-slate-350">
                                                      <td className="py-3 px-3">
                                                        <div className="font-bold">{sub.nama}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{sub.nim}</div>
                                                      </td>
                                                      <td className="py-3 px-3">
                                                        <div>{new Date(sub.waktuSubmit).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</div>
                                                        {sub.isLate && (
                                                          <span className="text-[9px] font-bold text-rose-500 block">Terlambat</span>
                                                        )}
                                                      </td>
                                                      <td className="py-3 px-3">
                                                        <a 
                                                          href={sub.fileUrl} 
                                                          target="_blank" 
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center gap-1 font-bold text-blue-650 hover:underline"
                                                        >
                                                          <Download className="size-3.5" /> Berkas
                                                        </a>
                                                      </td>
                                                      <td className="py-3 px-3">
                                                        {sub.nilai ? (
                                                          <span className="font-bold text-slate-800 dark:text-white bg-slate-50 border border-slate-100 px-2 py-0.5 rounded dark:bg-slate-900 dark:border-slate-800">
                                                            {sub.nilai.nilaiAngka} / 100
                                                          </span>
                                                        ) : (
                                                          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold">Belum Dinilai</span>
                                                        )}
                                                      </td>
                                                      <td className="py-3 px-3 text-[11px] text-slate-500 max-w-[200px] truncate" title={sub.nilai?.feedback}>
                                                        {sub.nilai?.feedback || "-"}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
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
