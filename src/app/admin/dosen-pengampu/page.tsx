"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getDosenPengampuList, assignDosenPengampu, getDosen } from "../actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { RefreshCw, BookOpen, UserPlus, X, CheckSquare, Square } from "lucide-react"
import { motion } from "framer-motion"

export default function DosenPengampuMapping() {
  const [courses, setCourses] = useState<any[]>([])
  const [availableDosen, setAvailableDosen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null)
  const [selectedDosenIds, setSelectedDosenIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const courList = await getDosenPengampuList()
      const dsnList = await getDosen(undefined, "all")
      setCourses(courList)
      setAvailableDosen(dsnList.filter((d) => d.status_aktif))
    } catch (err) {
      toast.error("Gagal memuat data dosen pengampu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAssignModal = (courseItem: any) => {
    setSelectedCourse(courseItem)
    // Extract already mapped dosen ids
    const activeDosenIds = courseItem.dosen_pengampu.map((dp: any) => dp.dosen_id)
    setSelectedDosenIds(activeDosenIds)
    setIsModalOpen(true)
  }

  const toggleDosenSelection = (dosenId: number) => {
    if (selectedDosenIds.includes(dosenId)) {
      setSelectedDosenIds(selectedDosenIds.filter((id) => id !== dosenId))
    } else {
      setSelectedDosenIds([...selectedDosenIds, dosenId])
    }
  }

  const handleSave = async () => {
    if (!selectedCourse) return
    setSaving(true)
    try {
      await assignDosenPengampu(selectedCourse.id, selectedDosenIds)
      toast.success("Pemetaan dosen pengampu berhasil diperbarui")
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      toast.error("Gagal menyimpan pemetaan")
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      header: "Mata Kuliah",
      accessor: (item: any) => (
        <div>
          <span className="font-bold text-blue-600 font-mono text-xs block">
            {item.kode}
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {item.nama}
          </span>
        </div>
      ),
    },
    {
      header: "SKS / Prodi",
      accessor: (item: any) => (
        <span className="text-slate-500 font-semibold">
          {item.sks} SKS ({item.prodi?.nama})
        </span>
      ),
    },
    {
      header: "Dosen Pengampu Aktif",
      accessor: (item: any) => (
        <div className="flex flex-wrap gap-1.5 max-w-[350px]">
          {item.dosen_pengampu.length === 0 ? (
            <span className="text-xs text-rose-500 italic font-semibold">
              Belum memiliki dosen pengampu kelas.
            </span>
          ) : (
            item.dosen_pengampu.map((dp: any) => (
              <span
                key={dp.id}
                className="text-[9px] px-2 py-0.5 rounded border border-blue-100 bg-blue-50/50 text-blue-600 font-bold dark:border-blue-900/20 dark:bg-blue-950/20 dark:text-blue-400"
              >
                {dp.dosen.nama}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      header: "Aksi Pemetaan",
      accessor: (item: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenAssignModal(item)}
          className="text-[10px] py-1 h-7 border-blue-200 text-blue-650 hover:bg-blue-50/55 cursor-pointer active:scale-95 transition-transform"
        >
          <UserPlus className="size-3.5 mr-1" /> Atur Dosen Pengampu
        </Button>
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
              Pemetaan Dosen Pengampu
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Tentukan dan Tambahkan Beberapa Dosen Pengampu untuk Tiap Mata Kuliah
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

        {/* Main Content */}
        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <DataTable
            data={courses}
            columns={columns}
            rowKey={(item) => item.id}
            title="Daftar Pengajaran Kurikulum"
          />
        )}

        {/* ==========================================
            ASSIGN DOSEN MODAL
           ========================================== */}
        {isModalOpen && selectedCourse && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Petakan Dosen Pengampu
                  </h4>
                  <span className="text-[10px] text-blue-600 font-bold block mt-0.5 font-mono">
                    {selectedCourse.kode} - {selectedCourse.nama}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Body: Checkboxes of Lecturers */}
              <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pilih Dosen Pengampu (Bisa lebih dari satu)
                </span>
                
                {availableDosen.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Tidak ada dosen aktif yang terdaftar.</p>
                ) : (
                  <div className="space-y-2">
                    {availableDosen.map((dsn) => {
                      const isSelected = selectedDosenIds.includes(dsn.id)
                      return (
                        <button
                          type="button"
                          key={dsn.id}
                          onClick={() => toggleDosenSelection(dsn.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? "bg-blue-50/50 border-blue-200 text-blue-600 dark:bg-blue-950/10 dark:border-blue-900/30"
                              : "border-slate-100 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-900"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4.5 text-blue-650 shrink-0" />
                          ) : (
                            <Square className="size-4.5 text-slate-300 shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none mb-1">
                              {dsn.nama}
                            </p>
                            <p className="text-[9px] text-slate-400 leading-none">
                              NIDN: {dsn.nidn} | {dsn.prodi?.nama}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-900">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 cursor-pointer"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={handleSave}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                >
                  {saving ? "Menyimpan..." : "Simpan Pemetaan"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
