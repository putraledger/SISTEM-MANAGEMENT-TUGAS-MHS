"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { getMahasiswaClasses } from "../actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { BookOpen, GraduationCap, RefreshCw, User, Mail, Award } from "lucide-react"

export default function MahasiswaKelas() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const res = await getMahasiswaClasses()
      setClasses(res)
    } catch (err) {
      toast.error("Gagal memuat data mata kuliah")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const columns = [
    {
      header: "Kode MK",
      accessor: (item: any) => (
        <span className="font-bold text-blue-600 dark:text-blue-450 font-mono text-xs block">
          {item.kode}
        </span>
      ),
    },
    {
      header: "Nama Mata Kuliah",
      accessor: (item: any) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {item.nama}
        </span>
      ),
    },
    {
      header: "Kredit SKS",
      accessor: (item: any) => (
        <span className="text-slate-500 font-semibold">
          {item.sks} SKS
        </span>
      ),
    },
    {
      header: "Program Studi",
      accessor: (item: any) => (
        <span className="text-slate-450 text-xs font-semibold">
          {item.prodi}
        </span>
      ),
    },
    {
      header: "Dosen Pengampu",
      accessor: (item: any) => (
        <div className="space-y-1.5 py-1">
          {item.lecturers.length === 0 ? (
            <span className="text-[10px] text-slate-400 italic">Belum ditentukan</span>
          ) : (
            item.lecturers.map((doc: any) => (
              <div key={doc.nidn} className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-blue-50/50 flex items-center justify-center border border-blue-100/40 dark:bg-blue-950/20 dark:border-blue-900/20">
                  <User className="size-3 text-blue-650 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                    {doc.nama}
                  </span>
                  <span className="text-[8px] font-bold font-mono text-slate-400 block mt-0.5">
                    NIDN: {doc.nidn}
                  </span>
                </div>
              </div>
            ))
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
              Mata Kuliah Saya
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Daftar mata kuliah aktif yang diambil semester ini beserta dosen pengampu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadData}
              variant="outline"
              size="icon"
              className="size-8 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Dynamic Class List Table */}
        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-xl dark:bg-slate-950 dark:border-slate-900">
            <BookOpen className="size-10 text-slate-350 mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Belum Mengambil Kelas</p>
            <p className="text-[10px] text-slate-450 mt-1 max-w-sm text-center leading-relaxed">
              Anda belum terdaftar di kelas perkuliahan aktif mana pun semester ini. Silakan hubungi admin akademik SIMATU untuk menyelesaikan KRS Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <DataTable
              data={classes}
              columns={columns}
              rowKey={(item) => item.id}
              title="Daftar Kelas Perkuliahan Semester Ini"
            />
            
            {/* Visual Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs relative overflow-hidden dark:border-slate-850 dark:bg-slate-900/30 flex flex-col justify-between space-y-4"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-xl rounded-full" />
                  
                  <div>
                    <span className="text-[9px] font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100/40 px-2 py-0.5 rounded-full dark:bg-blue-950/20 dark:text-blue-400">
                      {cls.kode}
                    </span>
                    
                    <h4 className="text-xs font-bold text-slate-850 dark:text-white mt-2.5 leading-snug">
                      {cls.nama}
                    </h4>
                    
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-450 font-medium">
                      <GraduationCap className="size-3.5 text-blue-650 shrink-0" />
                      <span>{cls.sks} SKS</span>
                      <span>•</span>
                      <span>{cls.prodi}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100/55 pt-3.5 dark:border-slate-850">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Dosen Pengampu:
                    </span>
                    
                    <div className="space-y-2">
                      {cls.lecturers.map((doc: any) => (
                        <div key={doc.nidn} className="flex items-center gap-2">
                          <div className="size-7.5 rounded-full bg-slate-50 flex items-center justify-center border dark:bg-slate-900 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-blue-600">
                              {doc.nama.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 block leading-none mb-0.5 truncate">
                              {doc.nama}
                            </span>
                            <span className="text-[8px] font-semibold text-slate-400 block font-mono">
                              NIDN: {doc.nidn}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
