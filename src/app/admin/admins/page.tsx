"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getAdmins, upsertAdmin, deleteAdmin } from "../actions"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Search, Plus, RefreshCw, Edit2, Trash2, X, Shield } from "lucide-react"

// Form validation schema
const adminSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
})

type AdminFormValues = z.infer<typeof adminSchema>

export default function ManajemenAdmin() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
  })

  // Load data
  async function loadData() {
    setLoading(true)
    try {
      const result = await getAdmins(search)
      setData(result)
    } catch (err) {
      toast.error("Gagal memuat data administrator")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search])

  // Open add/edit modals
  const handleAdd = () => {
    setEditingAdmin(null)
    reset({
      username: "",
      password: "",
    })
    setIsFormOpen(true)
  }

  const handleEdit = (adminItem: any) => {
    setEditingAdmin(adminItem)
    reset({
      username: adminItem.username,
      password: "", // empty by default
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (data.length <= 1) {
      toast.error("Tidak dapat menghapus admin terakhir. Minimal harus ada 1 akun administrator.")
      return
    }
    if (confirm("Apakah Anda yakin ingin menghapus administrator ini?")) {
      try {
        await deleteAdmin(id)
        toast.success("Administrator berhasil dihapus")
        loadData()
      } catch (err) {
        toast.error("Gagal menghapus administrator")
      }
    }
  }

  // Submit CRUD form
  const onSubmit = async (values: AdminFormValues) => {
    if (!editingAdmin && !values.password) {
      toast.error("Password wajib diisi untuk akun baru.")
      return
    }
    try {
      await upsertAdmin({
        id: editingAdmin?.id,
        username: values.username,
        password: values.password || undefined,
      })
      toast.success(editingAdmin ? "Data admin diubah" : "Administrator berhasil ditambahkan")
      setIsFormOpen(false)
      loadData()
    } catch (err) {
      toast.error("Gagal menyimpan data. Kemungkinan username sudah terdaftar.")
    }
  }

  const columns = [
    {
      header: "ID",
      accessor: (item: any) => <span className="font-bold text-slate-500 font-mono text-xs">#{item.id}</span>,
    },
    {
      header: "Username Administrator",
      accessor: (item: any) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Shield className="size-4 text-blue-650 shrink-0" />
          {item.username}
        </span>
      ),
    },
    {
      header: "Tanggal Pembuatan",
      accessor: (item: any) => (
        <span className="text-slate-450 font-medium">
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
              Manajemen Akun Administrator
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Kelola Hak Akses Pengguna Admin Sistem
            </p>
          </div>
          <Button
            onClick={handleAdd}
            size="sm"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform ml-auto"
          >
            <Plus className="size-4 mr-1.5" /> Tambah Admin
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <DashboardCard className="p-4 flex flex-col md:flex-row items-center gap-4 bg-white border-slate-100" animateScroll={false}>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari username admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9.5 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800"
            />
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
        </DashboardCard>

        {/* Main Data Table */}
        <DataTable
          data={data}
          columns={columns}
          rowKey={(item) => item.id}
          title="Daftar Akun Administrator"
        />

        {/* ==========================================
            ADD / EDIT ADMIN MODAL
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
                  {editingAdmin ? "Ubah Akun Admin" : "Tambah Admin Baru"}
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
                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Username Akun
                  </label>
                  <input
                    type="text"
                    {...register("username")}
                    disabled={!!editingAdmin}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 disabled:opacity-50 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Contoh: admin_pusat"
                  />
                  {errors.username && (
                    <span className="text-[10px] text-rose-600 block">{errors.username.message}</span>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {editingAdmin ? "Password Baru (Kosongkan jika tidak diubah)" : "Password Akun"}
                  </label>
                  <input
                    type="password"
                    {...register("password")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                    placeholder="Minimal 6 karakter"
                  />
                  {errors.password && (
                    <span className="text-[10px] text-rose-600 block">{errors.password.message}</span>
                  )}
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
                    {isSubmitting ? "Menyimpan..." : "Simpan Akun"}
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
