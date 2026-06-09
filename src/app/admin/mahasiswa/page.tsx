"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import {
  getMahasiswa,
  upsertMahasiswa,
  deleteMahasiswa,
  resetMahasiswaPassword,
  importMahasiswa,
  getProdis,
} from "../actions"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import {
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Lock,
  Upload,
  X,
  FileSpreadsheet,
} from "lucide-react"

// Form validation schema
const studentSchema = z.object({
  nim: z.string().min(3, "NIM minimal 3 karakter"),
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  prodi_id: z.number({ message: "Program studi wajib dipilih" }).min(1, "Program studi wajib dipilih"),
  semester_aktif: z.number().min(1, "Semester aktif minimal 1").max(14, "Semester tidak valid"),
  angkatan: z.number().min(2010, "Angkatan minimal 2010").max(new Date().getFullYear(), "Angkatan tidak valid"),
  status_aktif: z.boolean(),
})

type StudentFormValues = z.infer<typeof studentSchema>

export default function ManajemenMahasiswa() {
  const [data, setData] = useState<any[]>([])
  const [prodis, setProdis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [prodiFilter, setProdiFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importText, setImportText] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      status_aktif: true,
      semester_aktif: 1,
      angkatan: new Date().getFullYear(),
    },
  })

  // Load data
  async function loadData() {
    setLoading(true)
    try {
      const result = await getMahasiswa(
        search,
        prodiFilter,
        semesterFilter === "all" ? undefined : parseInt(semesterFilter, 10)
      )
      setData(result)
      const prds = await getProdis()
      setProdis(prds)
    } catch (err) {
      toast.error("Gagal memuat data mahasiswa")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search, prodiFilter, semesterFilter])

  // Open add/edit modals
  const handleAdd = () => {
    setEditingStudent(null)
    reset({
      nim: "",
      nama: "",
      prodi_id: undefined,
      semester_aktif: 1,
      angkatan: new Date().getFullYear(),
      status_aktif: true,
    } as any)
    setIsFormOpen(true)
  }

  const handleEdit = (student: any) => {
    setEditingStudent(student)
    reset({
      nim: student.nim,
      nama: student.nama,
      prodi_id: student.prodi_id || undefined,
      semester_aktif: student.semester_aktif,
      angkatan: student.angkatan,
      status_aktif: student.status_aktif,
    } as any)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus mahasiswa ini? Seluruh data enrollment & submissions juga akan terhapus.")) {
      try {
        await deleteMahasiswa(id)
        toast.success("Mahasiswa berhasil dihapus")
        loadData()
      } catch (err) {
        toast.error("Gagal menghapus mahasiswa")
      }
    }
  }

  const handleResetPassword = async (id: number) => {
    if (confirm("Reset password mahasiswa ini menjadi default (mhs123)?")) {
      try {
        const res = await resetMahasiswaPassword(id)
        toast.success(res.message)
      } catch (err) {
        toast.error("Gagal mereset password")
      }
    }
  }

  // Submit CRUD form
  const onSubmit = async (values: StudentFormValues) => {
    try {
      await upsertMahasiswa({
        id: editingStudent?.id,
        ...values,
      })
      toast.success(editingStudent ? "Data mahasiswa diubah" : "Mahasiswa berhasil ditambahkan")
      setIsFormOpen(false)
      loadData()
    } catch (err) {
      toast.error("Gagal menyimpan data")
    }
  }

  // Handle bulk spreadsheet copy-paste import
  const handleImport = async () => {
    if (!importText.trim()) {
      toast.error("Mohon tempelkan teks spreadsheet CSV/Tabular.")
      return
    }

    try {
      // Parse tab-separated or comma-separated copy paste data
      const lines = importText.split("\n")
      const parsed: any[] = []

      lines.forEach((line) => {
        const parts = line.split(/[,\t]/)
        if (parts.length >= 5) {
          const nim = parts[0].trim()
          const nama = parts[1].trim()
          const prodi = parts[2].trim()
          const semester_aktif = parseInt(parts[3].trim(), 10)
          const angkatan = parseInt(parts[4].trim(), 10)

          if (nim && nama && prodi && !isNaN(semester_aktif) && !isNaN(angkatan)) {
            parsed.push({ nim, nama, prodi, semester_aktif, angkatan })
          }
        }
      })

      if (parsed.length === 0) {
        throw new Error("Format tidak valid. Gunakan format kolom: NIM, Nama, Prodi, Semester, Angkatan")
      }

      const res = await importMahasiswa(parsed)
      toast.success(`Berhasil mengimpor ${res.count} mahasiswa baru`)
      setIsImportOpen(false)
      setImportText("")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Gagal mengimpor data. Cek format data Anda.")
    }
  }

  const columns = [
    {
      header: "NIM",
      accessor: (item: any) => <span className="font-bold text-blue-600 font-mono text-xs">{item.nim}</span>,
    },
    {
      header: "Nama Mahasiswa",
      accessor: (item: any) => <span className="font-semibold text-slate-800 dark:text-slate-200">{item.nama}</span>,
    },
    {
      header: "Prodi",
      accessor: (item: any) => <span className="text-slate-500 font-semibold">{item.prodi?.nama}</span>,
    },
    {
      header: "Smt / Angkatan",
      accessor: (item: any) => (
        <span className="text-slate-450 font-medium">
          Semester {item.semester_aktif} ({item.angkatan})
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
          <Button
            size="icon"
            variant="ghost"
            title="Reset Password ke default mhs123"
            className="size-7 text-blue-600 hover:bg-blue-50 cursor-pointer"
            onClick={() => handleResetPassword(item.id)}
          >
            <Lock className="size-3.5" />
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
              Manajemen Data Mahasiswa
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Kelola, Tambah, dan Impor Mahasiswa Secara Masal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs bg-white border-slate-200 text-slate-600 active:scale-95 transition-transform"
            >
              <Upload className="size-4 mr-1.5" /> Impor Excel/Tabular
            </Button>
            <Button
              onClick={handleAdd}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform"
            >
              <Plus className="size-4 mr-1.5" /> Tambah Mahasiswa
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <DashboardCard className="p-4 flex flex-col md:flex-row items-center gap-4 bg-white border-slate-100" animateScroll={false}>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIM atau nama mahasiswa..."
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

            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap ml-2">Semester Aktif:</span>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="text-xs py-1.5 pl-3.5 pr-8 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-900 dark:border-slate-800 cursor-pointer"
            >
              <option value="all">Semua Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
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
          title="Daftar Mahasiswa Terdaftar"
        />

        {/* ==========================================
            A. ADD / EDIT STUDENT MODAL
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
                  {editingStudent ? "Ubah Data Mahasiswa" : "Tambah Mahasiswa Baru"}
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
                {/* NIM Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    NIM (Nomor Induk Mahasiswa)
                  </label>
                  <input
                    type="text"
                    {...register("nim")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: 1234567890"
                  />
                  {errors.nim && (
                    <span className="text-[10px] text-rose-600 block">{errors.nim.message}</span>
                  )}
                </div>

                {/* Nama Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    {...register("nama")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: Budi Santoso"
                  />
                  {errors.nama && (
                    <span className="text-[10px] text-rose-600 block">{errors.nama.message}</span>
                  )}
                </div>

                {/* Prodi Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Program Studi
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
                  {/* Semester Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Semester Aktif
                    </label>
                    <input
                      type="number"
                      {...register("semester_aktif", { valueAsNumber: true })}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                      placeholder="Contoh: 4"
                    />
                    {errors.semester_aktif && (
                      <span className="text-[10px] text-rose-600 block">
                        {errors.semester_aktif.message}
                      </span>
                    )}
                  </div>

                  {/* Angkatan Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Angkatan
                    </label>
                    <input
                      type="number"
                      {...register("angkatan", { valueAsNumber: true })}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                      placeholder="Contoh: 2024"
                    />
                    {errors.angkatan && (
                      <span className="text-[10px] text-rose-600 block">
                        {errors.angkatan.message}
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
                  <label htmlFor="status_aktif" className="text-xs font-semibold text-slate-650 cursor-pointer">
                    Mahasiswa Aktif Akademik
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
                    {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ==========================================
            B. BULK IMPORT MODAL (SPREADSHEET COPY-PASTE)
           ========================================== */}
        {isImportOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4.5 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Impor Data Mahasiswa Massal
                  </h4>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={() => setIsImportOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-lg bg-blue-50/40 border border-blue-100/50 p-3 text-[11px] text-blue-600 dark:bg-blue-950/15 dark:border-blue-900/10 dark:text-blue-400 space-y-1">
                  <span className="font-bold">Panduan Impor Data:</span>
                  <p>
                    Salin dari Excel lalu tempelkan di bawah. Pastikan memiliki kolom berikut dipisahkan dengan koma atau tombol tab:
                  </p>
                  <code className="block mt-1 font-mono text-[9px] bg-white/70 p-1.5 rounded dark:bg-slate-900/60 font-semibold">
                    NIM, Nama Lengkap, Program Studi, Semester Aktif, Angkatan
                  </code>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Contoh: <br />
                    <code>1234567890, Doni Ramadhan, Informatika, 2, 2025</code>
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Tempel Data Spreadsheet/CSV
                  </label>
                  <textarea
                    rows={8}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Salin data Excel lalu tempelkan baris di sini..."
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none bg-slate-50/50 font-mono focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 cursor-pointer"
                    onClick={() => setIsImportOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleImport}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                  >
                    Mulai Impor Data
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
