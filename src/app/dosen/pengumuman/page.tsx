"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getDosenAnnouncements, createCourseAnnouncement, deleteCourseAnnouncement } from "../actions"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, RefreshCw, Trash2, X, Bell, User, Calendar, Megaphone } from "lucide-react"

// Form validation schema
const announceSchema = z.object({
  judul: z.string().min(5, "Judul pengumuman minimal 5 karakter"),
  isi: z.string().min(10, "Isi pengumuman minimal 10 karakter"),
  target: z.string().min(1, "Target audiens wajib dipilih"),
})

type AnnounceFormValues = z.infer<typeof announceSchema>

export default function DosenPengumuman() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnounceFormValues>({
    resolver: zodResolver(announceSchema),
    defaultValues: {
      target: "mahasiswa",
      judul: "",
      isi: "",
    },
  })

  // Load announcements
  async function loadData() {
    setLoading(true)
    try {
      const result = await getDosenAnnouncements()
      setData(result)
    } catch (err) {
      toast.error("Gagal memuat daftar pengumuman")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Delete handler
  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengumuman perkuliahan ini?")) {
      try {
        await deleteCourseAnnouncement(id)
        toast.success("Pengumuman berhasil dihapus")
        loadData()
      } catch (err) {
        toast.error("Gagal menghapus pengumuman")
      }
    }
  }

  // Create handler
  const onSubmit = async (values: AnnounceFormValues) => {
    try {
      await createCourseAnnouncement(values)
      toast.success("Pengumuman kelas berhasil disiarkan!")
      setIsFormOpen(false)
      reset()
      loadData()
    } catch (err) {
      toast.error("Gagal menyiarkan pengumuman")
    }
  }

  const columns = [
    {
      header: "Judul Pengumuman",
      accessor: (item: any) => (
        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs">
          <Bell className="size-4 text-blue-600 shrink-0" />
          {item.judul}
        </span>
      ),
    },
    {
      header: "Konten Pengumuman",
      accessor: (item: any) => (
        <span className="text-slate-500 text-xs block max-w-[320px] truncate" title={item.isi}>
          {item.isi}
        </span>
      ),
    },
    {
      header: "Target Penerima",
      accessor: (item: any) => (
        <span
          className={`text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
            item.target === "semua"
              ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/20"
              : "bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-950/20 dark:border-purple-900/20"
          }`}
        >
          {item.target === "semua" ? "Semua Mahasiswa" : "Kelas Diampu"}
        </span>
      ),
    },
    {
      header: "Tanggal Siar",
      accessor: (item: any) => (
        <span className="text-slate-400 text-[10px] font-semibold">
          {new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "Aksi",
      accessor: (item: any) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleDelete(item.id)}
          className="size-7 text-rose-600 hover:bg-rose-50 cursor-pointer"
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
              Pengumuman & Siaran Kelas Saya
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Kirim berita penting, pembatalan kelas, atau instruksi umum ke mahasiswa diampu
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
            <Button
              onClick={() => setIsFormOpen(true)}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform"
            >
              <Plus className="size-4 mr-1.5" /> Buat Pengumuman Baru
            </Button>
          </div>
        </div>

        {/* Main Content Board */}
        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-xl dark:bg-slate-950 dark:border-slate-900">
            <Megaphone className="size-10 text-slate-355 mb-3" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Belum Ada Pengumuman</p>
            <p className="text-[10px] text-slate-455 mt-1 max-w-sm text-center leading-relaxed">
              Anda belum menyiarkan pengumuman perkuliahan apa pun semester ini. Gunakan tombol **Buat Pengumuman Baru** di atas untuk menyebarkan info penting pertama Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Data Table summary */}
            <div className="lg:col-span-2 space-y-4">
              <DataTable
                data={data}
                columns={columns}
                rowKey={(item) => item.id}
                title="Daftar Pengumuman Aktif"
              />
            </div>

            {/* Right Column: Interactive feed view */}
            <div className="lg:col-span-1 space-y-3.5">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Visual Feed Pengumuman
              </span>
              
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                {data.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs relative overflow-hidden dark:border-slate-850 dark:bg-slate-900/40"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-xl rounded-full" />
                    
                    <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2.5 dark:border-slate-850">
                      <span className="text-[9px] font-bold text-blue-600 uppercase font-mono tracking-tight bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/30 dark:bg-blue-950/20 dark:text-blue-400">
                        {item.target === "semua" ? "Umum" : "Kelas"}
                      </span>
                      
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-350 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                        title="Hapus Siaran"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight mb-2">
                      {item.judul}
                    </h4>
                    
                    <p className="text-[11px] text-slate-500 dark:text-slate-350 leading-relaxed break-words whitespace-pre-wrap">
                      {item.isi}
                    </p>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100/55 dark:border-slate-850 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="size-3" />
                        NIDN: {item.created_by}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            BROADCAST FORM MODAL
           ========================================== */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-950 dark:border-slate-900"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-900 bg-slate-50/50 dark:bg-slate-955/50">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  Siarkan Pengumuman Baru
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
                {/* Judul Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Judul Pengumuman
                  </label>
                  <input
                    type="text"
                    {...register("judul")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: Pengunduran Jadwal Kuis 1 Kelas A"
                  />
                  {errors.judul && (
                    <span className="text-[10px] text-rose-600 block">{errors.judul.message}</span>
                  )}
                </div>

                {/* Target Audience */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Target Broadcast
                  </label>
                  <select
                    {...register("target")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
                  >
                    <option value="mahasiswa">Seluruh Mahasiswa Terdaftar (Kelas Saya)</option>
                    <option value="semua">Semua Pengguna Universitas (Umum)</option>
                  </select>
                  {errors.target && (
                    <span className="text-[10px] text-rose-600 block">{errors.target.message}</span>
                  )}
                </div>

                {/* Content Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Isi Pengumuman Lengkap
                  </label>
                  <textarea
                    rows={6}
                    {...register("isi")}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Tuliskan materi pemberitahuan penting perkuliahan Anda secara jelas di sini..."
                  />
                  {errors.isi && (
                    <span className="text-[10px] text-rose-600 block">{errors.isi.message}</span>
                  )}
                </div>

                {/* Footer */}
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
                    {isSubmitting ? "Menyiarkan..." : "Siarkan Sekarang"}
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
