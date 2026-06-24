"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getDosenClasses, getDosenTasks, getDosenSubmissions, submitGrade } from "../actions"
import { useEffect, useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import {
  RefreshCw,
  Search,
  BookOpen,
  ClipboardList,
  FileDown,
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  FileCheck,
  User,
  Inbox
} from "lucide-react"

// Form validation schema for grading
const gradeSchema = z.object({
  nilaiAngka: z.number({ message: "Nilai harus berupa angka" })
    .min(0, "Nilai minimal 0")
    .max(100, "Nilai maksimal 100"),
  feedback: z.string().optional(),
  statusRevisi: z.string().min(1, "Status revisi wajib dipilih"),
})

type GradeFormValues = z.infer<typeof gradeSchema>

function SubmissionsPageContent() {
  const searchParams = useSearchParams()
  const queryTugasId = searchParams.get("tugasId")

  const [classes, setClasses] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(false)

  // Selector states
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [activeTask, setActiveTask] = useState<any | null>(null)

  // Filtering states
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all, graded, ungraded, missing

  // Grading modal states
  const [isGradingOpen, setIsGradingOpen] = useState(false)
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null)
  const [activeMahasiswa, setActiveMahasiswa] = useState<any | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      nilaiAngka: 80,
      feedback: "",
      statusRevisi: "tidak",
    },
  })

  // Load classes and tasks
  async function loadInitialData() {
    setLoading(true)
    try {
      const classesRes = await getDosenClasses()
      setClasses(classesRes)

      const tasksRes = await getDosenTasks()
      // Filter out tasks that are published so we only grade published tasks
      const publishedTasks = tasksRes.filter((t) => t.status === "publish")
      setTasks(publishedTasks)

      // Handle direct query param redirect from dashboard
      if (queryTugasId) {
        const foundTask = publishedTasks.find((t) => t.id === parseInt(queryTugasId, 10))
        if (foundTask) {
          setSelectedTaskId(queryTugasId)
          setActiveTask(foundTask)
          loadSubmissions(parseInt(queryTugasId, 10))
          return
        }
      }

      // Default select first task if available
      if (publishedTasks.length > 0) {
        setSelectedTaskId(publishedTasks[0].id.toString())
        setActiveTask(publishedTasks[0])
        loadSubmissions(publishedTasks[0].id)
      } else {
        setLoading(false)
      }
    } catch (err) {
      toast.error("Gagal memuat daftar tugas")
      setLoading(false)
    }
  }

  // Load submissions for a specific task
  async function loadSubmissions(taskId: number) {
    setSubLoading(true)
    try {
      const subs = await getDosenSubmissions(taskId)
      setSubmissions(subs)
    } catch (err) {
      toast.error("Gagal memuat daftar submission")
    } finally {
      setSubLoading(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Handle task selection change
  const handleTaskChange = (taskIdStr: string) => {
    setSelectedTaskId(taskIdStr)
    const task = tasks.find((t) => t.id === parseInt(taskIdStr, 10))
    setActiveTask(task || null)
    if (task) {
      loadSubmissions(task.id)
    } else {
      setSubmissions([])
    }
  }

  // Handle opening grading modal
  const openGradingModal = (item: any) => {
    setActiveSubmission(item.submission)
    setActiveMahasiswa(item.mahasiswa)

    reset({
      nilaiAngka: item.submission?.nilai?.nilai_angka ?? 80,
      feedback: item.submission?.nilai?.feedback ?? "",
      statusRevisi: item.submission?.nilai?.status_revisi ?? "tidak",
    })
    setIsGradingOpen(true)
  }

  // Submit Grade
  const onSubmitGrade = async (values: GradeFormValues) => {
    if (!activeSubmission) return
    try {
      await submitGrade({
        submissionId: activeSubmission.id,
        ...values,
      })
      toast.success(`Berhasil memberi nilai untuk ${activeMahasiswa.nama}! Telegram dikirim.`)
      setIsGradingOpen(false)
      if (activeTask) {
        loadSubmissions(activeTask.id)
      }
    } catch (err) {
      toast.error("Gagal menyimpan nilai")
    }
  }

  // Lateness text compiler
  const getLatenessInfo = (waktuSubmit: string, deadline: string) => {
    const submitDate = new Date(waktuSubmit)
    const deadlineDate = new Date(deadline)
    const diff = submitDate.getTime() - deadlineDate.getTime()

    if (diff <= 0) {
      return { text: "Tepat Waktu", isLate: false }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    let delayStr = "Terlambat "
    if (days > 0) delayStr += `${days}h `
    if (hours > 0) delayStr += `${hours}j `
    delayStr += `${minutes}m`

    return { text: delayStr, isLate: true }
  }

  // Combine enrolled students and actual submissions
  const getCompiledData = (): any[] => {
    if (!activeTask) return []

    // Find the course's enrollments to get all students
    const activeCourse = classes.find((c) => c.mata_kuliah.id === activeTask.mata_kuliah_id)
    if (!activeCourse) return []

    const enrolls = activeCourse.mata_kuliah.enrollments

    // Map through enrollments
    return enrolls.map((en: any) => {
      const sub = submissions.find((s) => s.mahasiswa_id === en.mahasiswa.id)
      return {
        id: en.mahasiswa.id,
        mahasiswa: en.mahasiswa,
        submission: sub || null,
        hasSubmitted: !!sub,
      }
    })
  }

  const compiledData: any[] = getCompiledData()

  // Filter student data
  const filteredData = compiledData.filter((item) => {
    const matchesSearch =
      item.mahasiswa.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.mahasiswa.nim.includes(search)

    if (!matchesSearch) return false

    if (statusFilter === "all") return true
    if (statusFilter === "graded") return item.submission && item.submission.nilai
    if (statusFilter === "ungraded") return item.submission && !item.submission.nilai
    if (statusFilter === "missing") return !item.submission
    return true
  })

  // Compute Stats Overview
  const totalStudents = compiledData.length
  const submittedCount = compiledData.filter((item) => item.hasSubmitted).length
  const gradedCount = compiledData.filter((item) => item.submission?.nilai).length
  const ungradedCount = submittedCount - gradedCount
  const averageGrade =
    gradedCount > 0
      ? (
          compiledData
            .filter((item) => item.submission?.nilai?.nilai_angka)
            .reduce((acc, curr) => acc + curr.submission.nilai.nilai_angka, 0) / gradedCount
        ).toFixed(1)
      : "0"

  const columns = [
    {
      header: "Identitas Mahasiswa",
      accessor: (item: any) => (
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
            <User className="size-4 text-slate-500" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block leading-tight">
              {item.mahasiswa.nama}
            </span>
            <span className="font-bold text-blue-600 font-mono text-[9px] block">
              NIM: {item.mahasiswa.nim}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Status Kumpul",
      accessor: (item: any) => (
        item.hasSubmitted ? (
          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-650 font-bold uppercase tracking-wider dark:bg-emerald-950/20 dark:border-emerald-900/20 dark:text-emerald-400">
            <CheckCircle className="size-3" /> Sudah Kumpul
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border border-slate-100 bg-slate-50 text-slate-450 font-bold uppercase tracking-wider dark:bg-slate-900/10 dark:border-slate-850 dark:text-slate-500">
            <Inbox className="size-3" /> Belum Kumpul
          </span>
        )
      ),
    },
    {
      header: "Tanggal Submit / Keterlambatan",
      accessor: (item: any) => {
        if (!item.hasSubmitted) return <span className="text-[10px] text-slate-400 italic font-medium">Belum mengunggah berkas</span>
        
        const lateness = getLatenessInfo(item.submission.waktu_submit, activeTask.deadline)
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-slate-650 dark:text-slate-350">
              {new Date(item.submission.waktu_submit).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span
              className={`text-[9px] font-bold ${
                lateness.isLate
                  ? "text-rose-600 dark:text-rose-450"
                  : "text-emerald-600 dark:text-emerald-450"
              }`}
            >
              {lateness.text}
            </span>
          </div>
        )
      },
    },
    {
      header: "Berkas Tugas",
      accessor: (item: any) => (
        item.hasSubmitted && item.submission.file_url ? (
          <a
            href={item.submission.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:text-blue-700 px-2.5 py-1 rounded transition-colors dark:bg-blue-950/20 dark:border-blue-900/20 dark:text-blue-400"
          >
            <FileDown className="size-3" /> Berkas
          </a>
        ) : (
          <span className="text-[10px] text-slate-400 italic font-medium">Tidak ada berkas</span>
        )
      ),
    },
    {
      header: "Lembar Nilai",
      accessor: (item: any) => {
        if (!item.hasSubmitted) return <span className="text-[10px] text-slate-400 font-medium">-</span>
        const nilai = item.submission.nilai
        return nilai ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-50 border px-1.5 py-0.5 rounded dark:bg-slate-900 dark:border-slate-800">
                {nilai.nilai_angka}
              </span>
              {nilai.status_revisi === "revisi" && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/20 uppercase">
                  Revisi
                </span>
              )}
            </div>
            {nilai.feedback && (
              <span className="text-[9px] text-slate-450 truncate block max-w-[120px] font-medium" title={nilai.feedback}>
                {nilai.feedback}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50/50 border border-amber-100/50 px-2 py-0.5 rounded dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/20">
            Belum Dinilai
          </span>
        )
      },
    },
    {
      header: "Aksi",
      accessor: (item: any) => (
        item.hasSubmitted ? (
          <Button
            onClick={() => openGradingModal(item)}
            size="sm"
            className="text-[10px] py-1 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded active:scale-95 transition-transform"
          >
            <Award className="size-3.5 mr-1" />
            {item.submission.nilai ? "Ubah Nilai" : "Beri Nilai"}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled
            className="text-[10px] py-1 h-7 bg-slate-100 text-slate-400 rounded cursor-not-allowed dark:bg-slate-900 dark:text-slate-600"
          >
            N/A
          </Button>
        )
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
              Koreksi & Penilaian Tugas Mahasiswa
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Periksa lampiran lembar jawaban, hitung keterlambatan, dan kirim nilai sinkron bot Telegram
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => activeTask && loadSubmissions(activeTask.id)}
              variant="outline"
              size="icon"
              className="size-8 cursor-pointer ml-auto"
              title="Refresh Data"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Task Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dropdown Selector */}
          <DashboardCard className="p-4 md:col-span-1 bg-white border border-slate-100 flex flex-col justify-center space-y-2" animateScroll={false}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pilih Tugas Kuliah Aktif:
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => handleTaskChange(e.target.value)}
              className="w-full text-xs font-semibold py-2 pl-3.5 pr-10 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-900 dark:border-slate-800 cursor-pointer"
            >
              {tasks.length === 0 ? (
                <option value="">Tidak ada tugas publish</option>
              ) : (
                tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    [{task.mata_kuliah.kode}] {task.judul}
                  </option>
                ))
              )}
            </select>
          </DashboardCard>

          {/* Quick Info Statistics Card */}
          {activeTask && (
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900/40 flex flex-col justify-between">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Total Mahasiswa</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white mt-2">{totalStudents}</span>
              </div>
              <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900/40 flex flex-col justify-between">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Sudah Kumpul</span>
                <span className="text-xl font-bold text-emerald-600 mt-2">{submittedCount}</span>
              </div>
              <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900/40 flex flex-col justify-between">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Belum Dinilai</span>
                <span className={`text-xl font-bold mt-2 ${ungradedCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                  {ungradedCount}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900/40 flex flex-col justify-between">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Rata-Rata Nilai</span>
                <span className="text-xl font-bold text-blue-600 mt-2">{averageGrade}</span>
              </div>
            </div>
          )}
        </div>

        {activeTask ? (
          <>
            {/* Filter and Search Panel */}
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

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:ml-auto">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap hidden sm:inline">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto text-xs py-1.5 pl-3.5 pr-10 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-900 dark:border-slate-800 cursor-pointer"
                >
                  <option value="all">Semua Mahasiswa Kelas</option>
                  <option value="graded">Sudah Dinilai</option>
                  <option value="ungraded">Belum Dinilai</option>
                  <option value="missing">Belum Mengumpulkan</option>
                </select>
              </div>
            </DashboardCard>

            {/* Submissions Data Table */}
            {subLoading ? (
              <div className="flex h-[30vh] items-center justify-center">
                <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
              </div>
            ) : (
              <DataTable
                data={filteredData}
                columns={columns}
                rowKey={(item) => item.id}
                title="Roster Pengumpulan & Lembar Penilaian"
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-xl dark:bg-slate-950 dark:border-slate-900">
            <ClipboardList className="size-10 text-slate-350 mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Belum Ada Tugas Perkuliahan Aktif</p>
            <p className="text-[10px] text-slate-450 mt-1 max-w-sm text-center leading-relaxed">
              Anda belum menerbitkan tugas perkuliahan (*publish*) ke mahasiswa semester ini. Silakan buka menu **Kelola Tugas** terlebih dahulu untuk menerbitkan tugas baru.
            </p>
          </div>
        )}

        {/* ==========================================
            SLIDER / GRADING FORM MODAL
           ========================================== */}
        {isGradingOpen && activeMahasiswa && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Award className="size-4.5 text-blue-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-none">
                      Beri Lembar Penilaian Akademik
                    </h4>
                    <span className="text-[9px] text-slate-400 block mt-1 font-semibold truncate max-w-[280px]">
                      Mahasiswa: {activeMahasiswa.nama} ({activeMahasiswa.nim})
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={() => setIsGradingOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit(onSubmitGrade)} className="p-5 space-y-4">
                {/* Numeric Grade Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Nilai Angka (Skala 0 - 100)
                    </label>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border dark:bg-blue-950/20 dark:text-blue-400">
                      Skor
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    {...register("nilaiAngka", { valueAsNumber: true })}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: 85.5"
                  />
                  {errors.nilaiAngka && (
                    <span className="text-[10px] text-rose-600 block">{errors.nilaiAngka.message}</span>
                  )}
                </div>

                {/* Revision Toggle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Status Revisi / Perbaikan
                  </label>
                  <select
                    {...register("statusRevisi")}
                    className="w-full text-xs pl-3.5 pr-10 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
                  >
                    <option value="tidak">Tidak Perlu Revisi (Selesai)</option>
                    <option value="revisi">Ya, Perlu Revisi / Perbaiki</option>
                  </select>
                  {errors.statusRevisi && (
                    <span className="text-[10px] text-rose-600 block">{errors.statusRevisi.message}</span>
                  )}
                </div>

                {/* Qualitative Feedback */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Feedback / Catatan Dosen
                  </label>
                  <textarea
                    rows={4}
                    {...register("feedback")}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Tuliskan apresiasi, koreksi pengerjaan, atau materi perbaikan jika perlu revisi..."
                  />
                </div>

                {/* Telegram Sync Alert notice */}
                <div className="rounded-lg bg-blue-50/50 border border-blue-100/50 p-3 text-[10px] text-blue-650 dark:bg-blue-950/20 dark:border-blue-900/20 dark:text-blue-400 flex items-start gap-2">
                  <FileCheck className="size-4 shrink-0 mt-0.5 text-blue-600" />
                  <div>
                    <span className="font-bold">Notifikasi Telegram Otomatis:</span> Setelah menekan tombol simpan, nilai beserta catatan Anda akan dikirimkan secara pribadi ke ponsel mahasiswa lewat bot Telegram SIMATU.
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 cursor-pointer"
                    onClick={() => setIsGradingOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                  >
                    {isSubmitting ? "Mengirim Nilai..." : "Kirim & Siarkan Nilai"}
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

export default function SubmissionsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="size-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <SubmissionsPageContent />
    </Suspense>
  )
}
