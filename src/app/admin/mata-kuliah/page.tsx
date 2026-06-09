"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getMataKuliah, upsertMataKuliah, deleteMataKuliah, getProdis } from "../actions"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Search, Plus, RefreshCw, Edit2, Trash2, X, BookOpen } from "lucide-react"

// Form validation schema
const courseSchema = z.object({
  kode: z.string().min(3, "Kode MK minimal 3 karakter"),
  nama: z.string().min(3, "Nama MK minimal 3 karakter"),
  sks: z.number().min(1, "SKS minimal 1 SKS").max(6, "SKS maksimal 6 SKS"),
  prodi_id: z.number({ message: "Program studi wajib dipilih" }).min(1, "Program studi wajib dipilih"),
  semester: z.number().min(1, "Semester minimal 1").max(8, "Semester maksimal 8"),
  status_aktif: z.boolean(),
})

type CourseFormValues = z.infer<typeof courseSchema>

export default function ManajemenMataKuliah() {
  const [data, setData] = useState<any[]>([])
  const [prodis, setProdis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [prodiFilter, setProdiFilter] = useState("all")

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status_aktif: true,
      sks: 3,
      semester: 1,
    },
  })

  // Load data
  async function loadData() {
    setLoading(true)
    try {
      const result = await getMataKuliah(search, prodiFilter)
      setData(result)
      const prds = await getProdis()
      setProdis(prds)
    } catch (err) {
      toast.error("Gagal memuat data mata kuliah")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search, prodiFilter])

  // Open add/edit modals
  const handleAdd = () => {
    setEditingCourse(null)
    reset({
      kode: "",
      nama: "",
      sks: 3,
      prodi_id: undefined,
      semester: 1,
      status_aktif: true,
    } as any)
    setIsFormOpen(true)
  }

  const handleEdit = (courseItem: any) => {
    setEditingCourse(courseItem)
    reset({
      kode: courseItem.kode,
      nama: courseItem.nama,
      sks: courseItem.sks,
      prodi_id: courseItem.prodi_id || undefined,
      semester: courseItem.semester,
      status_aktif: courseItem.status_aktif,
    } as any)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus mata kuliah ini? Seluruh data dosen pengampu, pendaftaran kelas, dan submissions tugas mahasiswa terkait akan ikut terhapus.")) {
      try {
        await deleteMataKuliah(id)
        toast.success("Mata kuliah berhasil dihapus")
        loadData()
      } catch (err) {
        toast.error("Gagal menghapus mata kuliah")
      }
    }
  }

  // Submit CRUD form
  const onSubmit = async (values: CourseFormValues) => {
    try {
      await upsertMataKuliah({
        id: editingCourse?.id,
        ...values,
      })
      toast.success(editingCourse ? "Data mata kuliah diubah" : "Mata kuliah berhasil ditambahkan")
      setIsFormOpen(false)
      loadData()
    } catch (err) {
      toast.error("Gagal menyimpan data. Kemungkinan kode MK sudah terdaftar.")
    }
  }

  const columns = [
    {
      header: "Kode MK",
      accessor: (item: any) => (
        <span className="font-bold text-blue-600 font-mono text-xs block">
          {item.kode}
        </span>
      ),
    },
    {
      header: "Nama Mata Kuliah",
      accessor: (item: any) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <BookOpen className="size-4 text-blue-650 shrink-0" />
          {item.nama}
        </span>
      ),
    },
    {
      header: "Bobot Kredit",
      accessor: (item: any) => <span className="text-slate-700 font-bold">{item.sks} SKS</span>,
    },
    {
      header: "Prodi / Semester",
      accessor: (item: any) => (
        <span className="text-slate-450 font-medium">
          {item.prodi?.nama} (Semester {item.semester})
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (item: any) => (
        <span
          className={`text-[9px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
            item.status_aktif
              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20"
              : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/20"
          }`}
        >
          {item.status_aktif ? "Aktif" : "Nonaktif"}
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
            onClick={() => handleEdit(item)}
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-rose-600 hover:bg-rose-50 cursor-pointer"
            onClick={() => handleDelete(item.id)}
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
              Manajemen Mata Kuliah
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Kelola Kurikulum Mata Kuliah dan Beban SKS
            </p>
          </div>
          <Button
            onClick={handleAdd}
            size="sm"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform ml-auto"
          >
            <Plus className="size-4 mr-1.5" /> Tambah Mata Kuliah
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <DashboardCard className="p-4 flex flex-col md:flex-row items-center gap-4 bg-white border-slate-100" animateScroll={false}>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama mata kuliah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9.5 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Program Studi:</span>
            <select
              value={prodiFilter}
              onChange={(e) => setProdiFilter(e.target.value)}
              className="text-xs py-1.5 pl-3.5 pr-8 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-900 dark:border-slate-800 cursor-pointer"
            >
              <option value="all">Semua Program Studi</option>
              {prodis.map((p) => (
                <option key={p.id} value={p.nama}>{p.nama}</option>
              ))}
            </select>
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
        </DashboardCard>

        {/* Main Data Table */}
        <DataTable
          data={data}
          columns={columns}
          rowKey={(item) => item.id}
          title="Daftar Kurikulum Mata Kuliah"
        />

        {/* ==========================================
            ADD / EDIT COURSE MODAL
           ========================================== */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {editingCourse ? "Ubah Mata Kuliah" : "Tambah Mata Kuliah Baru"}
                </h4>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={() => setIsFormOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Kode MK Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Kode Mata Kuliah
                  </label>
                  <input
                    type="text"
                    {...register("kode")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: INF-301"
                  />
                  {errors.kode && (
                    <span className="text-[10px] text-rose-600 block">{errors.kode.message}</span>
                  )}
                </div>

                {/* Nama MK Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Nama Mata Kuliah
                  </label>
                  <input
                    type="text"
                    {...register("nama")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: Pemrograman Web Lanjut"
                  />
                  {errors.nama && (
                    <span className="text-[10px] text-rose-650 block">{errors.nama.message}</span>
                  )}
                </div>

                {/* Prodi Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Program Studi Penggunaan
                  </label>
                  <select
                    {...register("prodi_id", { valueAsNumber: true })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
                  >
                    <option value="">Pilih Program Studi</option>
                    {prodis.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                  {errors.prodi_id && (
                    <span className="text-[10px] text-rose-600 block">{errors.prodi_id.message}</span>
                  )}
                </div>

                 <div className="grid grid-cols-2 gap-4">
                  {/* SKS Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Bobot SKS
                    </label>
                    <input
                      type="number"
                      {...register("sks", { valueAsNumber: true })}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                      placeholder="Contoh: 3"
                    />
                    {errors.sks && (
                      <span className="text-[10px] text-rose-600 block">{errors.sks.message}</span>
                    )}
                  </div>

                  {/* Semester Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Target Semester Kurikulum
                    </label>
                    <input
                      type="number"
                      {...register("semester", { valueAsNumber: true })}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                      placeholder="Contoh: 5"
                    />
                    {errors.semester && (
                      <span className="text-[10px] text-rose-600 block">
                        {errors.semester.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="status_aktif"
                    {...register("status_aktif")}
                    className="size-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="status_aktif" className="text-xs font-semibold text-slate-655 cursor-pointer">
                    Mata Kuliah Aktif Akademik
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 cursor-pointer"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan MK"}
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
