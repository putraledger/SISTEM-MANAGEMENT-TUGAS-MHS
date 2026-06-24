"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import {
  getFaculties,
  upsertFakultas,
  deleteFakultas,
  upsertProdi,
  deleteProdi
} from "../actions"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Edit2, Trash2, X, RefreshCw, Layers, Award, ChevronRight } from "lucide-react"

// Schemas for forms
const facultySchema = z.object({
  nama: z.string().min(3, "Nama fakultas minimal 3 karakter"),
})
type FacultyFormValues = z.infer<typeof facultySchema>

const prodiSchema = z.object({
  nama: z.string().min(3, "Nama prodi minimal 3 karakter"),
  fakultas_id: z.number().min(1, "Fakultas wajib dipilih"),
})
type ProdiFormValues = z.infer<typeof prodiSchema>

export default function ManajemenFakultasProdi() {
  const [faculties, setFaculties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFaculty, setSearchFaculty] = useState("")
  const [activeFaculty, setActiveFaculty] = useState<any | null>(null)

  // Modals state
  const [isFacultyOpen, setIsFacultyOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null)
  
  const [isProdiOpen, setIsProdiOpen] = useState(false)
  const [editingProdi, setEditingProdi] = useState<any | null>(null)

  // React Hook Forms
  const facultyForm = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: { nama: "" }
  })

  const prodiForm = useForm<ProdiFormValues>({
    resolver: zodResolver(prodiSchema),
    defaultValues: { nama: "", fakultas_id: 0 }
  })

  // Load data
  async function loadData() {
    setLoading(true)
    try {
      const res = await getFaculties()
      setFaculties(res)
      
      // Keep or update active faculty selection
      if (res.length > 0) {
        if (activeFaculty) {
          const found = res.find((f: any) => f.id === activeFaculty.id)
          setActiveFaculty(found || res[0])
        } else {
          setActiveFaculty(res[0])
        }
      } else {
        setActiveFaculty(null)
      }
    } catch (err) {
      toast.error("Gagal memuat data akademik")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Faculty actions
  const handleAddFaculty = () => {
    setEditingFaculty(null)
    facultyForm.reset({ nama: "" })
    setIsFacultyOpen(true)
  }

  const handleEditFaculty = (fac: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingFaculty(fac)
    facultyForm.reset({ nama: fac.nama })
    setIsFacultyOpen(true)
  }

  const handleDeleteFaculty = async (fac: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Apakah Anda yakin ingin menghapus Fakultas "${fac.nama}"? Seluruh program studi dan relasi mahasiswa/dosen di dalamnya akan terhapus.`)) {
      try {
        await deleteFakultas(fac.id)
        toast.success("Fakultas berhasil dihapus")
        if (activeFaculty?.id === fac.id) {
          setActiveFaculty(null)
        }
        loadData()
      } catch (err) {
        toast.error("Gagal menghapus fakultas")
      }
    }
  }

  const onFacultySubmit = async (values: FacultyFormValues) => {
    try {
      await upsertFakultas({
        id: editingFaculty?.id,
        nama: values.nama,
      })
      toast.success(editingFaculty ? "Fakultas berhasil diubah" : "Fakultas berhasil ditambahkan")
      setIsFacultyOpen(false)
      loadData()
    } catch (err) {
      toast.error("Gagal menyimpan fakultas. Kemungkinan nama sudah terdaftar.")
    }
  }

  // Prodi actions
  const handleAddProdi = () => {
    if (!activeFaculty) {
      toast.error("Silakan pilih fakultas terlebih dahulu")
      return
    }
    setEditingProdi(null)
    prodiForm.reset({
      nama: "",
      fakultas_id: activeFaculty.id
    })
    setIsProdiOpen(true)
  }

  const handleEditProdi = (prd: any) => {
    setEditingProdi(prd)
    prodiForm.reset({
      nama: prd.nama,
      fakultas_id: prd.fakultas_id
    })
    setIsProdiOpen(true)
  }

  const handleDeleteProdi = async (prd: any) => {
    if (confirm(`Apakah Anda yakin ingin menghapus program studi "${prd.nama}"?`)) {
      try {
        await deleteProdi(prd.id)
        toast.success("Program studi berhasil dihapus")
        loadData()
      } catch (err) {
        toast.error("Gagal menghapus program studi")
      }
    }
  }

  const onProdiSubmit = async (values: ProdiFormValues) => {
    try {
      await upsertProdi({
        id: editingProdi?.id,
        nama: values.nama,
        fakultas_id: values.fakultas_id,
      })
      toast.success(editingProdi ? "Program studi berhasil diubah" : "Program studi berhasil ditambahkan")
      setIsProdiOpen(false)
      loadData()
    } catch (err) {
      toast.error("Gagal menyimpan program studi. Kemungkinan nama sudah digunakan.")
    }
  }

  // Filters
  const filteredFaculties = faculties.filter((f: any) =>
    f.nama.toLowerCase().includes(searchFaculty.toLowerCase())
  )

  const prodiColumns = [
    {
      header: "Nama Program Studi",
      accessor: (item: any) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {item.nama}
        </span>
      ),
    },
    {
      header: "Tanggal Pembuatan",
      accessor: (item: any) => (
        <span className="text-slate-450 text-xs">
          {new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Aksi",
      accessor: (item: any) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-amber-600 hover:bg-amber-50 cursor-pointer"
            onClick={() => handleEditProdi(item)}
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-rose-600 hover:bg-rose-50 cursor-pointer"
            onClick={() => handleDeleteProdi(item)}
          >
            <Trash2 className="size-3.5" />
          </Button>
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
              Manajemen Fakultas & Program Studi
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Kelola Struktur Relasional Fakultas dan Kurikulum Departemen
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={loadData}
              variant="outline"
              size="icon"
              className="size-8 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              onClick={handleAddFaculty}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="size-4 mr-1.5" /> Tambah Fakultas
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left side: Faculties card */}
            <div className="lg:col-span-1 space-y-4">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Struktur Fakultas ({filteredFaculties.length})
              </span>

              {/* Search Faculty */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari fakultas..."
                  value={searchFaculty}
                  onChange={(e) => setSearchFaculty(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-4 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-slate-900/20 dark:border-slate-800"
                />
              </div>

              {filteredFaculties.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada fakultas terdaftar.</p>
              ) : (
                <div className="space-y-2">
                  {filteredFaculties.map((fac) => {
                    const isSelected = activeFaculty?.id === fac.id
                    return (
                      <div
                        key={fac.id}
                        onClick={() => setActiveFaculty(fac)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-white border-blue-500 shadow-md shadow-blue-500/5 dark:bg-slate-900/50"
                            : "bg-white border-slate-100 hover:bg-slate-50 dark:bg-slate-900/10 dark:border-slate-850"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 pr-3">
                          <h4 className="text-xs font-bold text-slate-855 dark:text-white truncate leading-tight">
                            {fac.nama}
                          </h4>
                          <p className="text-[10px] text-slate-450 font-bold tracking-tight uppercase">
                            {fac.prodis.length} Program Studi
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-amber-500 hover:bg-amber-50 cursor-pointer"
                            onClick={(e) => handleEditFaculty(fac, e)}
                          >
                            <Edit2 className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-rose-500 hover:bg-rose-50 cursor-pointer"
                            onClick={(e) => handleDeleteFaculty(fac, e)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                          <ChevronRight className={`size-4 text-slate-400 transition-transform ${isSelected ? "translate-x-0.5" : ""}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right side: Study Programs of active faculty */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="wait">
                {activeFaculty ? (
                  <motion.div
                    key={activeFaculty.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Layers className="size-4.5 text-blue-650 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-none">
                            Program Studi Terdaftar
                          </h4>
                          <span className="text-[10px] text-blue-600 font-bold block mt-1">
                            {activeFaculty.nama}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={handleAddProdi}
                        size="sm"
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm active:scale-95 transition-transform"
                      >
                        <Plus className="size-3.5 mr-1" /> Tambah Prodi
                      </Button>
                    </div>

                    <DataTable
                      data={activeFaculty.prodis || []}
                      columns={prodiColumns}
                      rowKey={(item) => item.id}
                    />
                  </motion.div>
                ) : (
                  <div className="p-8 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl text-center">
                    <p className="text-xs text-slate-400 italic">Silakan pilih atau tambahkan fakultas di kolom kiri.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ==========================================
            FAKULTAS FORM MODAL
           ========================================== */}
        {isFacultyOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {editingFaculty ? "Ubah Data Fakultas" : "Tambah Fakultas Baru"}
                </h4>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={() => setIsFacultyOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <form onSubmit={facultyForm.handleSubmit(onFacultySubmit)} className="p-5 space-y-4">
                {/* Nama Fakultas Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Nama Fakultas
                  </label>
                  <input
                    type="text"
                    {...facultyForm.register("nama")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: Fakultas Ilmu Komputer"
                  />
                  {facultyForm.formState.errors.nama && (
                    <span className="text-[10px] text-rose-600 block">
                      {facultyForm.formState.errors.nama.message}
                    </span>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 cursor-pointer"
                    onClick={() => setIsFacultyOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={facultyForm.formState.isSubmitting}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                  >
                    {facultyForm.formState.isSubmitting ? "Menyimpan..." : "Simpan Fakultas"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ==========================================
            PRODI FORM MODAL
           ========================================== */}
        {isProdiOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {editingProdi ? "Ubah Program Studi" : "Tambah Program Studi Baru"}
                </h4>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={() => setIsProdiOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <form onSubmit={prodiForm.handleSubmit(onProdiSubmit)} className="p-5 space-y-4">
                {/* Parent Faculty Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Fakultas Induk
                  </label>
                  <select
                    {...prodiForm.register("fakultas_id", { valueAsNumber: true })}
                    className="w-full text-xs pl-3.5 pr-10 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
                  >
                    {faculties.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.nama}
                      </option>
                    ))}
                  </select>
                  {prodiForm.formState.errors.fakultas_id && (
                    <span className="text-[10px] text-rose-600 block">
                      {prodiForm.formState.errors.fakultas_id.message}
                    </span>
                  )}
                </div>

                {/* Nama Prodi Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Nama Program Studi
                  </label>
                  <input
                    type="text"
                    {...prodiForm.register("nama")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: Teknik Informatika"
                  />
                  {prodiForm.formState.errors.nama && (
                    <span className="text-[10px] text-rose-600 block">
                      {prodiForm.formState.errors.nama.message}
                    </span>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 cursor-pointer"
                    onClick={() => setIsProdiOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={prodiForm.formState.isSubmitting}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                  >
                    {prodiForm.formState.isSubmitting ? "Menyimpan..." : "Simpan Prodi"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
