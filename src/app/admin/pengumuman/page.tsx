"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getPengumuman, createPengumuman, deletePengumuman } from "../actions"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { Plus, RefreshCw, Trash2, X, Bell } from "lucide-react"
import { motion } from "framer-motion"

// Form validation schema
const announceSchema = z.object({
  judul: z.string().min(5, "Judul minimal 5 karakter"),
  isi: z.string().min(10, "Isi pengumuman minimal 10 karakter"),
  target: z.string().min(1, "Target audiens wajib dipilih"),
})

type AnnounceFormValues = z.infer<typeof announceSchema>

export default function PengumumanBroadcasting() {
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
      target: "semua",
    },
  })

  // Load data
  async function loadData() {
    setLoading(true)
    try {
      const result = await getPengumuman()
      setData(result)
    } catch (err) {
      toast.error("Gagal memuat pengumuman")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
      try {
        await deletePengumuman(id)
        toast.success("Pengumuman berhasil dihapus")
        loadData()
      } catch (err) {
        toast.error("Gagal menghapus pengumuman")
      }
    }
  }

  const onSubmit = async (values: AnnounceFormValues) => {
    try {
      await createPengumuman(values.judul, values.isi, values.target)
      toast.success("Pengumuman berhasil disiarkan")
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
        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Bell className="size-4 text-blue-650 shrink-0" />
          {item.judul}
        </span>
      ),
    },
    {
      header: "Isi Ringkas",
      accessor: (item: any) => (
        <span className="text-slate-500 text-xs truncate block max-w-[350px]">
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
              ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/20 dark:text-blue-450"
              : item.target === "dosen"
              ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/20 dark:text-amber-450"
              : "bg-purple-50 border-purple-100 text-purple-650 dark:bg-purple-950/20 dark:border-purple-900/20 dark:text-purple-400"
          }`}
        >
          {item.target}
        </span>
      ),
    },
    {
      header: "Tanggal Siar",
      accessor: (item: any) => (
        <span className="text-slate-400 text-xs">
          {new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
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
              Siaran & Pengumuman Akademik
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Kirim Pesan Siaran Langsung ke Mahasiswa, Dosen, atau Semua Pengguna
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadData}
              variant="outline"
              size="icon"
              className="size-8 cursor-pointer ml-auto"
              title="Refresh Data"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform"
            >
              <Plus className="size-4 mr-1.5" /> Siarkan Pengumuman
            </Button>
          </div>
        </div>

        {/* Main Data Table */}
        {loading ? (
          <div className="flex h-[30vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            rowKey={(item) => item.id}
            title="Daftar Pengumuman Aktif"
          />
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
                    placeholder="Contoh: Pemeliharaan Server Akademik SIMATU"
                  />
                  {errors.judul && (
                    <span className="text-[10px] text-rose-600 block">{errors.judul.message}</span>
                  )}
                </div>

                {/* Target Audience */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Target Penerima (Broadcast)
                  </label>
                  <select
                    {...register("target")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800 cursor-pointer"
                  >
                    <option value="semua">Semua Pengguna (Umum)</option>
                    <option value="dosen">Hanya Dosen Pengajar</option>
                    <option value="mahasiswa">Hanya Mahasiswa Aktif</option>
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
                    placeholder="Tuliskan berita, instruksi, atau pengumuman lengkap di sini..."
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
