"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { CountdownPill } from "@/components/ui/countdown-pill"
import { getMahasiswaTasks, upsertSubmission, deleteSubmission } from "../actions"
import { useEffect, useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Search,
  RefreshCw,
  FileDown,
  UploadCloud,
  X,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Edit2,
  Trash2,
  AlertCircle
} from "lucide-react"
import { uploadFile } from "@/lib/upload"
import { SemesterFilter } from "@/components/ui/semester-filter"

// Form validation schema for submitting task
const submitSchema = z.object({
  fileUrl: z.string().min(1, "Berkas tugas wajib diunggah"),
  catatan: z.string().optional(),
})

type SubmitFormValues = z.infer<typeof submitSchema>

function StudentTasksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusTaskId = searchParams.get("id")
  const { data: session } = useSession()
  const studentNim = session?.user?.identifier || "mhs"

  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | string>("active")

  // Filter and search states
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed" | "overdue">("all")

  // Modal states
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<any | null>(null)
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      fileUrl: "",
      catatan: "",
    },
  })

  const currentFileUrl = watch("fileUrl")

  async function loadData(semId = selectedSemesterId) {
    setLoading(true)
    try {
      const tasksRes = await getMahasiswaTasks(semId)
      setTasks(tasksRes)

      // Auto-open submit modal if taskId is provided in search params
      if (focusTaskId) {
        const foundTask = tasksRes.find((t) => t.id === parseInt(focusTaskId, 10))
        if (foundTask) {
          handleOpenSubmit(foundTask)
        }
      }
    } catch (err) {
      toast.error("Gagal memuat tugas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedSemesterId)
  }, [selectedSemesterId])

  // Open submission form
  const handleOpenSubmit = (task: any) => {
    setActiveTask(task)
    setActiveSubmission(task.submission)
    
    reset({
      fileUrl: task.submission?.fileUrl || "",
      catatan: task.submission?.catatan || "",
    })
    setIsSubmitOpen(true)
  }

  // Handle client-side Supabase file upload with validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Strict Size Limit Check: Capped at 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran berkas tidak boleh melebihi 10MB!")
      return
    }

    // Format validation: PDF, DOCX, PPT, ZIP, JPG, PNG
    const fileExt = file.name.split(".").pop()?.toLowerCase() || ""
    const allowedExtensions = ["pdf", "docx", "ppt", "pptx", "zip", "jpg", "jpeg", "png"]
    if (!allowedExtensions.includes(fileExt)) {
      toast.error("Format berkas harus PDF, DOCX, PPT, ZIP, JPG, atau PNG!")
      return
    }

    setUploading(true)
    try {
      // Call server-side uploadFile helper
      const res = await uploadFile(file, studentNim, activeTask.id)

      setValue("fileUrl", res.url)
      toast.success("Lembar jawaban berhasil diunggah!")
    } catch (err: any) {
      console.error("Gagal mengunggah file:", err)
      toast.error(`Gagal mengunggah berkas: ${err.message || "Periksa koneksi internet Anda"}`)
    } finally {
      setUploading(false)
    }
  }

  // Submit Lembar Jawaban
  const onSubmit = async (values: SubmitFormValues) => {
    if (!activeTask) return
    try {
      await upsertSubmission({
        tugasId: activeTask.id,
        ...values,
      })
      toast.success(activeSubmission ? "Lembar jawaban berhasil diperbarui!" : "Tugas berhasil dikumpulkan!")
      setIsSubmitOpen(false)
      loadData()
    } catch (err) {
      toast.error("Gagal mengirimkan tugas")
    }
  }

  // Delete submission
  const handleDeleteSubmission = async (subId: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengumpulan tugas ini? Lembar jawaban dan nilai yang ada akan dihapus.")) {
      try {
        await deleteSubmission(subId)
        toast.success("Pengumpulan tugas berhasil dihapus")
        setIsSubmitOpen(false)
        loadData()
      } catch (err: any) {
        toast.error(err.message || "Gagal menghapus pengumpulan")
      }
    }
  }

  // Filters logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.judul.toLowerCase().includes(search.toLowerCase()) ||
      (task.deskripsi && task.deskripsi.toLowerCase().includes(search.toLowerCase())) ||
      task.courseNama.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    const hasSubmitted = !!task.submission
    const now = new Date().getTime()
    const deadlinePassed = new Date(task.deadline).getTime() < now

    if (activeTab === "pending") return !hasSubmitted && !deadlinePassed
    if (activeTab === "completed") return hasSubmitted
    if (activeTab === "overdue") return !hasSubmitted && deadlinePassed
    return true
  })

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
              Tugas Perkuliahan Saya
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Pantau tenggat, unduh materi dosen, kumpulkan lembar jawaban, dan kumpul ulang revisi
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
          </div>
        </div>

        {/* Filters and Search panel */}
        <DashboardCard className="p-4 flex flex-col md:flex-row items-center gap-4 bg-white border-slate-100" animateScroll={false}>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-450" />
            <input
              type="text"
              placeholder="Cari tugas berdasarkan judul atau kode MK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9.5 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800"
            />
          </div>

          <SemesterFilter
            selectedSemesterId={selectedSemesterId}
            onChange={setSelectedSemesterId}
          />

          <div className="flex items-center gap-1.5 ml-auto border border-slate-100/50 p-1 rounded-lg bg-slate-50/40 dark:border-slate-850 dark:bg-slate-900/20 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 md:flex-none text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-100/40 dark:bg-slate-950 dark:border-slate-800"
                  : "text-slate-450 hover:text-slate-700"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 md:flex-none text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "pending"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-100/40 dark:bg-slate-950 dark:border-slate-800"
                  : "text-slate-450 hover:text-slate-700"
              }`}
            >
              Belum Kumpul
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 md:flex-none text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "completed"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-100/40 dark:bg-slate-950 dark:border-slate-800"
                  : "text-slate-450 hover:text-slate-700"
              }`}
            >
              Sudah Kumpul
            </button>
            <button
              onClick={() => setActiveTab("overdue")}
              className={`flex-1 md:flex-none text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "overdue"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-100/40 dark:bg-slate-950 dark:border-slate-800"
                  : "text-slate-450 hover:text-slate-700"
              }`}
            >
              Terlewati
            </button>
          </div>
        </DashboardCard>

        {/* Dynamic Assignment List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-5 rounded-xl border border-slate-100 bg-white h-48 dark:border-slate-850 dark:bg-slate-900/30 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4.5 w-48 bg-slate-200 dark:bg-slate-750 rounded" />
                  <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-6 w-32 bg-slate-150 dark:bg-slate-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-xl dark:bg-slate-955 dark:border-slate-900">
            <FileText className="size-10 text-slate-350 mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Tidak Ada Tugas Ditemukan</p>
            <p className="text-[10px] text-slate-450 mt-1 max-w-sm text-center leading-relaxed">
              Tidak ada tugas yang cocok dengan filter yang dipilih. Silakan bersantai sejenak!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const hasSub = !!task.submission
              const deadlineDate = new Date(task.deadline)
              const deadlinePassed = deadlineDate.getTime() < new Date().getTime()
              
              return (
                <div
                  key={task.id}
                  className="p-5 rounded-xl border border-slate-100 bg-white shadow-xs relative overflow-hidden dark:border-slate-850 dark:bg-slate-900/30 flex flex-col justify-between space-y-4"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-xl rounded-full" />
                  
                  <div>
                    {/* Course code & name */}
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 dark:border-slate-850">
                      <span className="text-[9px] font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100/40 px-2 py-0.5 rounded dark:bg-blue-950/20 dark:text-blue-400">
                        {task.courseKode}
                      </span>
                      <CountdownPill deadline={task.deadline} />
                    </div>

                    <h4 className="text-xs font-bold text-slate-850 dark:text-white mt-3 leading-snug">
                      {task.judul}
                    </h4>
                    
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Mata Kuliah: {task.courseNama}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-medium break-words">
                      {task.deskripsi || "Tidak ada deskripsi panduan tugas."}
                    </p>

                    {/* Attachment files from teacher */}
                    {task.lampiranUrl && (
                      <div className="mt-3.5">
                        <a
                          href={task.lampiranUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1 rounded-lg transition-colors dark:bg-blue-950/20 dark:border-blue-900/20 dark:text-blue-450"
                        >
                          <FileDown className="size-3.5" />
                          Unduh Lampiran Dosen
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Submission Status & Action */}
                  <div className="border-t border-slate-100/55 pt-3.5 mt-2 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Status Info */}
                    <div>
                      {hasSub ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold uppercase tracking-wider dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20">
                            <CheckCircle className="size-3" /> Sudah Kumpul
                          </span>
                          <span className="text-[8px] text-slate-400 block font-semibold pt-0.5 font-mono">
                            Upload: {new Date(task.submission.waktuSubmit).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {task.submission.isLate && (
                              <span className="text-rose-650 font-bold ml-1"> (Terlambat)</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-600 font-bold uppercase tracking-wider dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/20">
                            <Clock className="size-3" /> Belum Mengumpulkan
                          </span>
                          <span className="text-[8px] text-slate-400 block font-semibold pt-0.5">
                            Tenggat: {new Date(task.deadline).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {hasSub ? (
                        <Button
                          onClick={() => handleOpenSubmit(task)}
                          size="sm"
                          className="w-full sm:w-auto text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg active:scale-95 transition-transform dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
                        >
                          <Edit2 className="size-3.5 mr-1" />
                          {deadlinePassed ? "Lihat Jawaban" : "Edit Pengumpulan"}
                        </Button>
                      ) : (
                        !deadlinePassed ? (
                          <Button
                            onClick={() => handleOpenSubmit(task)}
                            size="sm"
                            className="w-full sm:w-auto text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform"
                          >
                            <UploadCloud className="size-3.5 mr-1" />
                            Kumpulkan Tugas
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled
                            className="w-full sm:w-auto text-[10px] font-bold bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed dark:bg-slate-900 dark:text-slate-600"
                          >
                            <AlertTriangle className="size-3.5 mr-1" />
                            Terlambat/Ditutup
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ==========================================
            SUBMIT / EDIT DIALOG MODAL
           ========================================== */}
        {isSubmitOpen && activeTask && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-none">
                    {activeSubmission ? "Edit Lembar Jawaban Tugas" : "Kumpulkan Lembar Jawaban"}
                  </h4>
                  <span className="text-[9px] text-slate-400 block mt-1 truncate max-w-[280px]">
                    Tugas: {activeTask.judul}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={() => setIsSubmitOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                
                {/* File Attachment Uploader */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
                    <span>Dokumen Tugas (PDF / DOCX / ZIP)</span>
                    <span className="text-[9px] font-bold text-rose-500">Maks. 10MB</span>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        {...register("fileUrl")}
                        readOnly
                        placeholder="Link file lembar jawaban..."
                        className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-100/60 dark:bg-slate-900/60 dark:border-slate-800 text-slate-500 font-mono"
                      />
                    </div>
                    
                    {/* Block upload trigger if deadline has passed */}
                    {!(new Date(activeTask.deadline).getTime() < new Date().getTime()) && (
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs hover:border-slate-300 shrink-0 cursor-pointer dark:bg-slate-955 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-900">
                        <UploadCloud className="size-4 text-slate-450" />
                        {uploading ? "Mengunggah..." : "Pilih File"}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  {currentFileUrl && (
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <span>✓ Dokumen terlampir:</span>
                      <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-700 font-mono text-[9px] truncate max-w-[280px]">
                        {currentFileUrl}
                      </a>
                    </p>
                  )}
                  {errors.fileUrl && (
                    <span className="text-[10px] text-rose-600 block">{errors.fileUrl.message}</span>
                  )}
                </div>

                {/* Optional student notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Catatan untuk Dosen (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    {...register("catatan")}
                    disabled={new Date(activeTask.deadline).getTime() < new Date().getTime()}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Tulis pesan atau catatan penyerahan tugas untuk dosen pengampu..."
                  />
                </div>

                {/* Lateness Warning alert notice */}
                {new Date(activeTask.deadline).getTime() < new Date().getTime() ? (
                  <div className="rounded-lg bg-rose-50/50 border border-rose-100 p-3 text-[10px] text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/20 dark:text-rose-400 flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Tenggat Waktu Terlewati:</span> Batas waktu pengerjaan tugas ini telah habis. Anda tidak dapat melakukan perubahan, mengunggah ulang, atau menghapus lembar jawaban ini.
                    </div>
                  </div>
                ) : (
                  new Date(activeTask.deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && (
                    <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3 text-[10px] text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/20 dark:text-amber-400 flex items-start gap-2">
                      <Clock className="size-4 shrink-0 mt-0.5 animate-pulse text-amber-500" />
                      <div>
                        <span className="font-bold">Mendekati Tenggat Waktu:</span> Waktu pengumpulan tersisa kurang dari 24 jam. Periksa kembali kelengkapan lembar jawaban Anda sebelum disubmit.
                      </div>
                    </div>
                  )
                )}

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-900">
                  {/* Delete button (only if submission exists AND deadline not passed) */}
                  {activeSubmission && !(new Date(activeTask.deadline).getTime() < new Date().getTime()) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubmission(activeSubmission.id)}
                      className="text-xs text-rose-650 hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Trash2 className="size-4 mr-1.5" />
                      Hapus
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-500 cursor-pointer"
                      onClick={() => setIsSubmitOpen(false)}
                    >
                      Batal
                    </Button>
                    
                    {/* Hide Submit button if deadline passed */}
                    {!(new Date(activeTask.deadline).getTime() < new Date().getTime()) && (
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting || uploading}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                      >
                        {isSubmitting ? "Mengirimkan..." : "Kumpulkan"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}

export default function StudentTasks() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="size-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <StudentTasksContent />
    </Suspense>
  )
}
