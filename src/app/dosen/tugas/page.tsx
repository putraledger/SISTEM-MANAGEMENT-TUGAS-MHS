"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { CountdownPill } from "@/components/ui/countdown-pill"
import { getDosenTasks, getDosenClasses, upsertDosenTask, deleteDosenTask } from "../actions"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Plus, Search, RefreshCw, Edit2, Trash2, X, FileText, Upload, AlertCircle, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { SemesterFilter } from "@/components/ui/semester-filter"

// Form validation schema
const taskSchema = z.object({
  judul: z.string().min(5, "Judul tugas minimal 5 karakter"),
  deskripsi: z.string().optional(),
  deadline: z.string().min(1, "Tenggat waktu wajib diisi"),
  lampiran_url: z.string().optional(),
  status: z.string().min(1, "Status wajib dipilih"),
  mata_kuliah_id: z.number({ message: "Mata kuliah wajib dipilih" }).min(1, "Mata kuliah wajib dipilih"),
})

type TaskFormValues = z.infer<typeof taskSchema>

function TableSkeleton() {
  return (
    <div className="space-y-4 w-full animate-pulse">
      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="h-14 bg-slate-50 dark:bg-slate-900/50 rounded-lg" />
      ))}
    </div>
  )
}

export default function ManajemenTugas() {
  const [tasks, setTasks] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | string>("active")

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: "draft",
      judul: "",
      deskripsi: "",
      deadline: "",
      lampiran_url: "",
    },
  })

  const currentLampiranUrl = watch("lampiran_url")

  // Load data
  async function loadData(semId = selectedSemesterId) {
    setLoading(true)
    try {
      const tasksRes = await getDosenTasks(semId)
      setTasks(tasksRes)
      const classesRes = await getDosenClasses()
      setClasses(classesRes)
    } catch (err) {
      toast.error("Gagal memuat data tugas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedSemesterId)
  }, [selectedSemesterId])

  // CRUD actions
  const handleAdd = () => {
    setEditingTask(null)
    reset({
      judul: "",
      deskripsi: "",
      deadline: "",
      lampiran_url: "",
      status: "draft",
      mata_kuliah_id: classes.length > 0 ? classes[0].mata_kuliah.id : undefined,
    })
    setIsFormOpen(true)
  }

  const handleEdit = (task: any) => {
    setEditingTask(task)
    
    // Format Date to YYYY-MM-DDTHH:MM local format for <input type="datetime-local">
    const date = new Date(task.deadline)
    // Adjust time offset to get ISO representation in local timezone
    const offset = date.getTimezoneOffset() * 60000
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16)

    reset({
      judul: task.judul,
      deskripsi: task.deskripsi || "",
      deadline: localISOTime,
      lampiran_url: task.lampiran_url || "",
      status: task.status,
      mata_kuliah_id: task.mata_kuliah_id,
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus tugas ini? Semua pengumpulan mahasiswa juga akan ikut terhapus.")) {
      try {
        await deleteDosenTask(id)
        toast.success("Tugas berhasil dihapus")
        loadData()
      } catch (err) {
        toast.error("Gagal menghapus tugas")
      }
    }
  }

  // Handle client-side Supabase file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `attachments/${fileName}`

      // Upload file
      const { error } = await supabase.storage
        .from("tugas")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        // If bucket does not exist, let's create it
        if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
          const { error: createError } = await supabase.storage.createBucket("tugas", { public: true })
          if (createError) throw createError

          // Retry
          const { error: retryError } = await supabase.storage
            .from("tugas")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            })
          if (retryError) throw retryError
        } else {
          throw error
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("tugas")
        .getPublicUrl(filePath)

      setValue("lampiran_url", publicUrl)
      toast.success("File lampiran berhasil diunggah!")
    } catch (err: any) {
      console.error("Gagal mengunggah file:", err)
      toast.error(`Gagal mengunggah file: ${err.message || "Periksa konfigurasi Supabase Anda"}`)
    } finally {
      setUploading(false)
    }
  }

  // Submit CRUD form
  const onSubmit = async (values: TaskFormValues) => {
    try {
      await upsertDosenTask({
        id: editingTask?.id,
        ...values,
      })
      toast.success(editingTask ? "Data tugas diubah" : "Tugas berhasil ditambahkan & disiarkan")
      setIsFormOpen(false)
      loadData()
    } catch (err) {
      toast.error("Gagal menyimpan tugas")
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.judul.toLowerCase().includes(search.toLowerCase()) || 
                          (task.deskripsi && task.deskripsi.toLowerCase().includes(search.toLowerCase()))
    const matchesCourse = courseFilter === "all" || task.mata_kuliah_id === parseInt(courseFilter, 10)
    return matchesSearch && matchesCourse
  })

  const columns = [
    {
      header: "Mata Kuliah",
      accessor: (item: any) => (
        <span className="font-bold text-blue-600 font-mono text-[10px] block">
          {item.mata_kuliah.kode} - {item.mata_kuliah.nama} (Semester {item.mata_kuliah.semester} | {item.mata_kuliah.prodi?.nama})
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
      header: "Countdown / Tenggat",
      accessor: (item: any) => (
        <div className="flex flex-col gap-1 items-start">
          <CountdownPill deadline={item.deadline} />
          <span className="text-[9px] text-slate-400 font-semibold block">
            {new Date(item.deadline).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Lampiran",
      accessor: (item: any) => (
        item.lampiran_url ? (
          <a
            href={item.lampiran_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:text-blue-700 px-2 py-0.5 rounded transition-colors dark:bg-blue-950/20 dark:border-blue-900/20 dark:text-blue-400"
          >
            <FileText className="size-3" /> Unduh
          </a>
        ) : (
          <span className="text-[10px] text-slate-400 italic font-medium">Tidak ada</span>
        )
      ),
    },
    {
      header: "Status",
      accessor: (item: any) => (
        <span
          className={`text-[9px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
            item.status === "publish"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20"
              : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/20"
          }`}
        >
          {item.status}
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
              Manajemen Tugas Kuliah
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Tulis, unggah lampiran, terbitkan tugas dan siarkan otomatis ke Telegram mahasiswa
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => loadData(selectedSemesterId)}
              variant="outline"
              size="icon"
              className="size-8 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              onClick={handleAdd}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform"
            >
              <Plus className="size-4 mr-1.5" /> Tambah Tugas Baru
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <DashboardCard className="p-4 flex flex-col md:flex-row items-center gap-4 bg-white border-slate-100" animateScroll={false}>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tugas berdasarkan judul/deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9.5 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800"
            />
          </div>

          <SemesterFilter
            selectedSemesterId={selectedSemesterId}
            onChange={setSelectedSemesterId}
          />

          <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Filter Mata Kuliah:</span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="text-xs py-1.5 pl-3.5 pr-8 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-900 dark:border-slate-800 cursor-pointer"
            >
              <option value="all">Semua Mata Kuliah</option>
              {classes.map((cls) => (
                <option key={cls.mata_kuliah.id} value={cls.mata_kuliah.id}>
                  {cls.mata_kuliah.kode} - {cls.mata_kuliah.nama} (Sem. {cls.mata_kuliah.semester} - {cls.mata_kuliah.prodi?.nama})
                </option>
              ))}
            </select>
          </div>
        </DashboardCard>

        {/* Main Data Table */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <DataTable
            data={filteredTasks}
            columns={columns}
            rowKey={(item) => item.id}
            title="Daftar Tugas Kuliah Aktif"
          />
        )}

        {/* ==========================================
            ADD / EDIT TASK FORM MODAL
           ========================================== */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {editingTask ? "Ubah Tugas Kuliah" : "Tambah Tugas Kuliah Baru"}
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
                {/* Course Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Mata Kuliah Diampu
                  </label>
                  <select
                    {...register("mata_kuliah_id", { valueAsNumber: true })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
                  >
                    {classes.map((cls) => (
                      <option key={cls.mata_kuliah.id} value={cls.mata_kuliah.id}>
                        {cls.mata_kuliah.kode} - {cls.mata_kuliah.nama} (Semester {cls.mata_kuliah.semester} | {cls.mata_kuliah.prodi?.nama})
                      </option>
                    ))}
                  </select>
                  {errors.mata_kuliah_id && (
                    <span className="text-[10px] text-rose-600 block">{errors.mata_kuliah_id.message}</span>
                  )}
                </div>

                {/* Judul Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Judul Tugas
                  </label>
                  <input
                    type="text"
                    {...register("judul")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: Pembuatan Dashboard UI Responsive"
                  />
                  {errors.judul && (
                    <span className="text-[10px] text-rose-600 block">{errors.judul.message}</span>
                  )}
                </div>

                {/* Deskripsi Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Deskripsi / Panduan Pengerjaan
                  </label>
                  <textarea
                    rows={4}
                    {...register("deskripsi")}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Tuliskan petunjuk pengerjaan, format berkas, kriteria, atau bahan bacaan..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Deadline Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <Calendar className="size-3 text-slate-400" />
                      Tenggat Waktu (Deadline)
                    </label>
                    <input
                      type="datetime-local"
                      {...register("deadline")}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
                    />
                    {errors.deadline && (
                      <span className="text-[10px] text-rose-600 block">{errors.deadline.message}</span>
                    )}
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Status Rilis
                    </label>
                    <select
                      {...register("status")}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
                    >
                      <option value="draft">Draft (Simpan sebagai draf)</option>
                      <option value="publish">Publish (Terbitkan & Beritahu Telegram)</option>
                    </select>
                    {errors.status && (
                      <span className="text-[10px] text-rose-600 block">{errors.status.message}</span>
                    )}
                  </div>
                </div>

                {/* File Attachment Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Unggah Lampiran (Dokumen/PDF/Gambar)
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        {...register("lampiran_url")}
                        readOnly
                        placeholder="Link file lampiran..."
                        className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-100/60 dark:bg-slate-900/60 dark:border-slate-800 text-slate-500 font-mono"
                      />
                    </div>
                    
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs hover:border-slate-300 shrink-0 cursor-pointer dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">
                      <Upload className="size-4 text-slate-450" />
                      {uploading ? "Mengunggah..." : "Pilih File"}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {currentLampiranUrl && (
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <span>✓ Berkas berhasil ditautkan:</span>
                      <a href={currentLampiranUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-700 font-mono text-[9px] truncate max-w-[280px]">
                        {currentLampiranUrl}
                      </a>
                    </p>
                  )}
                </div>

                {/* Warning on Publish */}
                {watch("status") === "publish" && (
                  <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3 text-[11px] text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/20 dark:text-amber-400 flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Notifikasi Telegram Aktif:</span> Menandai tugas sebagai *Publish* akan memicu pengiriman notifikasi otomatis langsung ke ponsel mahasiswa terdaftar.
                    </div>
                  </div>
                )}

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
                    disabled={isSubmitting || uploading}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Tugas"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
