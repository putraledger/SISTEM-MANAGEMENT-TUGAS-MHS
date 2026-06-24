"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import {
  getEnrollmentList,
  enrollMahasiswa,
  unenrollMahasiswa,
  importEnrollment,
  getSemesters,
  getMataKuliah,
  getMahasiswa,
} from "../actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  RefreshCw,
  Plus,
  Trash2,
  Upload,
  X,
  CheckSquare,
  Square,
  BookOpenCheck,
  FileSpreadsheet,
} from "lucide-react"
import { motion } from "framer-motion"

export default function EnrollmentManagement() {
  const [semesters, setSemesters] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])

  // Selection states
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Modals state
  const [isManualOpen, setIsManualOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedMhsIds, setSelectedMhsIds] = useState<number[]>([])
  const [importNimsText, setImportNimsText] = useState("")

  const [saving, setSaving] = useState(false)
  const [modalSemesterFilter, setModalSemesterFilter] = useState<string>("all")
  const [modalProdiFilter, setModalProdiFilter] = useState<string>("all")

  // Initial load
  async function loadInitial() {
    try {
      const semList = await getSemesters()
      const courList = await getMataKuliah(undefined, "all")
      const mhsList = await getMahasiswa(undefined, "all")

      setSemesters(semList)
      setCourses(courList)
      setAllStudents(mhsList.filter((m) => m.status_aktif))

      // Set active semester default
      const activeSem = semList.find((s) => s.is_active)
      if (activeSem) {
        setSelectedSemesterId(activeSem.id.toString())
      } else if (semList.length > 0) {
        setSelectedSemesterId(semList[0].id.toString())
      }

      if (courList.length > 0) {
        setSelectedCourseId(courList[0].id.toString())
      }
    } catch (err) {
      toast.error("Gagal menginisialisasi parameter enrollment")
    }
  }

  // Load current enrollments
  async function loadEnrollments() {
    if (!selectedSemesterId || !selectedCourseId) return
    setLoading(true)
    try {
      const res = await getEnrollmentList(
        parseInt(selectedCourseId, 10),
        parseInt(selectedSemesterId, 10)
      )
      setEnrollments(res)
    } catch (err) {
      toast.error("Gagal memuat daftar enrollment")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitial()
  }, [])

  useEffect(() => {
    loadEnrollments()
  }, [selectedSemesterId, selectedCourseId])

  const handleUnenroll = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin membatalkan pendaftaran mahasiswa ini dari mata kuliah?")) {
      try {
        await unenrollMahasiswa(id)
        toast.success("Pendaftaran berhasil dibatalkan")
        loadEnrollments()
      } catch (err) {
        toast.error("Gagal membatalkan pendaftaran")
      }
    }
  }

  const toggleStudentSelection = (mhsId: number) => {
    if (selectedMhsIds.includes(mhsId)) {
      setSelectedMhsIds(selectedMhsIds.filter((id) => id !== mhsId))
    } else {
      setSelectedMhsIds([...selectedMhsIds, mhsId])
    }
  }

  const handleSaveManualEnroll = async () => {
    if (selectedMhsIds.length === 0) {
      toast.error("Pilih minimal satu mahasiswa.")
      return
    }
    setSaving(true)
    try {
      const res = await enrollMahasiswa(
        parseInt(selectedCourseId, 10),
        parseInt(selectedSemesterId, 10),
        selectedMhsIds
      )
      toast.success(`Berhasil mendaftarkan ${res.count} mahasiswa`)
      setIsManualOpen(false)
      setSelectedMhsIds([])
      loadEnrollments()
    } catch (err) {
      toast.error("Gagal mendaftarkan mahasiswa")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveImportEnroll = async () => {
    if (!importNimsText.trim()) {
      toast.error("Tempelkan daftar NIM mahasiswa.")
      return
    }
    setSaving(true)
    try {
      const nims = importNimsText
        .split(/[\n,]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0)

      if (nims.length === 0) {
        throw new Error("Tidak ada NIM valid yang terbaca.")
      }

      const res = await importEnrollment(
        parseInt(selectedCourseId, 10),
        parseInt(selectedSemesterId, 10),
        nims
      )
      toast.success(`Berhasil mengimpor ${res.count} pendaftaran mahasiswa`)
      setIsImportOpen(false)
      setImportNimsText("")
      loadEnrollments()
    } catch (err: any) {
      toast.error(err.message || "Gagal mengimpor pendaftaran")
    } finally {
      setSaving(false)
    }
  }

  // Filter students who are NOT already enrolled in this class
  const enrolledMhsIds = enrollments.map((e) => e.mahasiswa_id)
  const nonEnrolledStudents = allStudents.filter((s) => !enrolledMhsIds.includes(s.id))
  const filteredNonEnrolledStudents = nonEnrolledStudents.filter((s) => {
    const matchSem = modalSemesterFilter === "all" || s.semester_aktif.toString() === modalSemesterFilter
    const matchProdi = modalProdiFilter === "all" || s.prodi?.nama === modalProdiFilter
    return matchSem && matchProdi
  })

  const columns = [
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
      header: "Aksi",
      accessor: (item: any) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleUnenroll(item.id)}
          className="size-7 text-rose-600 hover:bg-rose-50 cursor-pointer"
          title="Batalkan Pendaftaran"
        >
          <Trash2 className="size-3.5" />
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
              Enrollment Kelas Akademik
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Daftarkan Mahasiswa ke Kelas Mata Kuliah di Semester Terpilih
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs bg-white border-slate-200 text-slate-650 active:scale-95 transition-transform"
            >
              <Upload className="size-4 mr-1.5" /> Impor Daftar NIM
            </Button>
            <Button
              onClick={() => setIsManualOpen(true)}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform"
            >
              <Plus className="size-4 mr-1.5" /> Daftarkan Mahasiswa
            </Button>
          </div>
        </div>

        {/* Selection Card */}
        <DashboardCard className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border-slate-100" animateScroll={false}>
          {/* Semester Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Semester Akademik
            </label>
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="w-full text-xs pl-3.5 pr-10 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
            >
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.nama} {sem.is_active ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Mata Kuliah Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Mata Kuliah Kelas
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full text-xs pl-3.5 pr-10 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
            >
              {courses.map((mk) => (
                <option key={mk.id} value={mk.id}>
                  {mk.kode} - {mk.nama} ({mk.sks} SKS)
                </option>
              ))}
            </select>
          </div>
        </DashboardCard>

        {/* Enrollment List */}
        {loading ? (
          <div className="flex h-[30vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <DataTable
            data={enrollments}
            columns={columns}
            rowKey={(item) => item.id}
            title="Daftar Mahasiswa Terdaftar di Kelas Ini"
          />
        )}

        {/* ==========================================
            A. MANUAL ENROLLMENT MODAL
           ========================================== */}
        {isManualOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Pilih Mahasiswa
                  </h4>
                  <span className="text-[10px] text-blue-600 font-bold block mt-0.5 uppercase">
                    Pendaftaran Anggota Kelas
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={() => setIsManualOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Filters */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 dark:bg-slate-900/30 dark:border-slate-900 flex gap-2">
                <div className="flex-1 space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-450 uppercase tracking-wider block">Prodi</label>
                  <select
                    value={modalProdiFilter}
                    onChange={(e) => setModalProdiFilter(e.target.value)}
                    className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded-md outline-none bg-white focus:border-blue-500 dark:bg-slate-900 dark:border-slate-800 cursor-pointer"
                  >
                    <option value="all">Semua Prodi</option>
                    <option value="Informatika">Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                    <option value="Teknik Sipil">Teknik Sipil</option>
                    <option value="Manajemen">Manajemen</option>
                  </select>
                </div>
                <div className="flex-1 space-y-0.5">
                  <label className="text-[8px] font-bold text-slate-450 uppercase tracking-wider block">Semester</label>
                  <select
                    value={modalSemesterFilter}
                    onChange={(e) => setModalSemesterFilter(e.target.value)}
                    className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded-md outline-none bg-white focus:border-blue-500 dark:bg-slate-900 dark:border-slate-800 cursor-pointer"
                  >
                    <option value="all">Semua Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s.toString()}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist */}
              <div className="p-5 space-y-4 max-h-[250px] overflow-y-auto">
                {filteredNonEnrolledStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Tidak ada mahasiswa yang cocok dengan filter atau semua sudah terdaftar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredNonEnrolledStudents.map((mhs) => {
                      const isSelected = selectedMhsIds.includes(mhs.id)
                      return (
                        <button
                          type="button"
                          key={mhs.id}
                          onClick={() => toggleStudentSelection(mhs.id)}
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
                              {mhs.nama}
                            </p>
                            <p className="text-[9px] text-slate-400 leading-none">
                              NIM: {mhs.nim} | {mhs.prodi?.nama} | Sem {mhs.semester_aktif}
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
                  onClick={() => setIsManualOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={handleSaveManualEnroll}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                >
                  {saving ? "Menyimpan..." : "Daftarkan Mahasiswa"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ==========================================
            B. BULK NIM IMPORT MODAL
           ========================================== */}
        {isImportOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4.5 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Impor Pendaftaran via NIM
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
                  <span className="font-bold">Panduan Impor NIM:</span>
                  <p>
                    Tempelkan daftar NIM mahasiswa yang akan didaftarkan ke kelas ini. Pisahkan NIM dengan baris baru atau koma.
                  </p>
                  <p className="text-[10px] text-slate-450 italic">
                    Contoh: <br />
                    1234567890 <br />
                    1234567891
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Daftar NIM Mahasiswa
                  </label>
                  <textarea
                    rows={6}
                    value={importNimsText}
                    onChange={(e) => setImportNimsText(e.target.value)}
                    placeholder="Tempelkan daftar NIM mahasiswa di sini..."
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 font-mono focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                  />
                </div>

                {/* Footer */}
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
                    disabled={saving}
                    onClick={handleSaveImportEnroll}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                  >
                    {saving ? "Menyimpan..." : "Impor Pendaftaran"}
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
