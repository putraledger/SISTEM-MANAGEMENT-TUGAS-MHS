"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getDosenClasses } from "../actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { RefreshCw, BookOpen, Users, GraduationCap, X, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function MataKuliahSaya() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeClass, setActiveClass] = useState<any | null>(null)
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (activeClass) {
      const grouped = activeClass.mata_kuliah.enrollments.reduce((acc: any, enrollment: any) => {
        const sem = enrollment.mahasiswa.semester_aktif || "Lainnya"
        if (!acc[sem]) acc[sem] = []
        acc[sem].push(enrollment)
        return acc
      }, {} as Record<string, any[]>)
      
      const initialExpanded: Record<string, boolean> = {}
      Object.keys(grouped).forEach(sem => {
        initialExpanded[sem] = true
      })
      setExpandedSemesters(initialExpanded)
    }
  }, [activeClass])

  async function loadData() {
    setLoading(true)
    try {
      const res = await getDosenClasses()
      setClasses(res)
      if (res.length > 0) {
        setActiveClass(res[0]) // default active class
      }
    } catch (err) {
      toast.error("Gagal memuat data kelas diampu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const studentColumns = [
    {
      header: "NIM",
      accessor: (item: any) => (
        <span className="font-bold text-blue-600 font-mono text-xs block">
          {item.mahasiswa.nim}
        </span>
      ),
    },
    {
      header: "Nama Mahasiswa",
      accessor: (item: any) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {item.mahasiswa.nama}
        </span>
      ),
    },
    {
      header: "Program Studi",
      accessor: (item: any) => <span className="text-slate-500 font-semibold">{item.mahasiswa.prodi?.nama}</span>,
    },
    {
      header: "Angkatan",
      accessor: (item: any) => <span className="text-slate-450 font-medium">{item.mahasiswa.angkatan}</span>,
    },
    {
      header: "Status",
      accessor: (item: any) => (
        <span
          className={`text-[9px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
            item.mahasiswa.status_aktif
              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20"
              : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20"
          }`}
        >
          {item.mahasiswa.status_aktif ? "Aktif" : "Nonaktif"}
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
              Daftar Kelas Mata Kuliah Saya
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Pantau Mata Kuliah dan Seluruh Mahasiswa Terdaftar
            </p>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            size="icon"
            className="size-8 cursor-pointer ml-auto"
            title="Refresh Data"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left side: Course cards */}
            <div className="lg:col-span-1 space-y-3">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Mata Kuliah Diampu
              </span>
              
              {classes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Belum ada kelas yang diampu semester ini.
                </p>
              ) : (
                classes.map((cls) => {
                  const isSelected = activeClass?.id === cls.id
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setActiveClass(cls)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-white border-blue-500 shadow-md shadow-blue-500/5 dark:bg-slate-900/50"
                          : "bg-white border-slate-100 hover:bg-slate-50 dark:bg-slate-900/10 dark:border-slate-850"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <span className="font-bold text-blue-600 font-mono text-[10px] block">
                          {cls.mata_kuliah.kode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate leading-tight">
                          {cls.mata_kuliah.nama}
                        </h4>
                        <p className="text-[10px] text-slate-450 font-medium">
                          {cls.mata_kuliah.sks} SKS | {cls.mata_kuliah.prodi?.nama}
                        </p>
                      </div>
                      <div className="size-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center shrink-0 dark:bg-blue-950/20 dark:text-blue-400">
                        <Users className="size-4" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Right side: Enrolled students */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence mode="wait">
                {activeClass && (
                  <motion.div
                    key={activeClass.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-4.5 text-blue-650 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-none">
                          Peserta Kelas Terdaftar
                        </h4>
                        <span className="text-[9px] text-blue-600 font-bold block mt-0.5 font-mono">
                          {activeClass.mata_kuliah.kode} - {activeClass.mata_kuliah.nama}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100/35 px-2.5 py-0.5 rounded-full ml-auto dark:bg-blue-950/20 dark:text-blue-400">
                        {activeClass.mata_kuliah.enrollments.length} Mahasiswa
                      </span>
                    </div>

                    {activeClass.mata_kuliah.enrollments.length === 0 ? (
                      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl text-center">
                        <p className="text-xs text-slate-400 italic">Belum ada mahasiswa yang terdaftar di kelas ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.keys(
                          activeClass.mata_kuliah.enrollments.reduce((acc: any, enrollment: any) => {
                            const sem = enrollment.mahasiswa.semester_aktif || "Lainnya"
                            if (!acc[sem]) acc[sem] = []
                            acc[sem].push(enrollment)
                            return acc
                          }, {} as Record<string, any[]>)
                        )
                          .sort((a, b) => {
                            if (a === "Lainnya") return 1
                            if (b === "Lainnya") return -1
                            return Number(a) - Number(b)
                          })
                          .map((semesterKey) => {
                            const enrollmentsForSem = activeClass.mata_kuliah.enrollments.filter(
                              (e: any) => (e.mahasiswa.semester_aktif || "Lainnya").toString() === semesterKey.toString()
                            )
                            const isExpanded = expandedSemesters[semesterKey] !== false

                            return (
                              <div
                                key={semesterKey}
                                className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden shadow-sm"
                              >
                                <button
                                  onClick={() =>
                                    setExpandedSemesters((prev) => ({
                                      ...prev,
                                      [semesterKey]: !isExpanded,
                                    }))
                                  }
                                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/55 dark:bg-slate-900/60 hover:bg-slate-100/50 dark:hover:bg-slate-900/80 transition-colors text-left cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                      Semester {semesterKey}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                      Angkatan Mahasiswa Semester {semesterKey}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      ({enrollmentsForSem.length} Mahasiswa)
                                    </span>
                                  </div>
                                  <div>
                                    {isExpanded ? (
                                      <ChevronUp className="size-4 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="size-4 text-slate-400" />
                                    )}
                                  </div>
                                </button>
                                
                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                    >
                                      <div className="border-t border-slate-100 dark:border-slate-850 p-2">
                                        <DataTable
                                          data={enrollmentsForSem}
                                          columns={studentColumns}
                                          rowKey={(item) => item.id}
                                        />
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
