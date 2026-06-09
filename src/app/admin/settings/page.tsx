"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { getAppSettings, updateAppSettings } from "../actions"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { Sliders, RefreshCw, Save, Image, Laptop, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Form validation schema
const settingsSchema = z.object({
  appName: z.string().min(3, "Nama aplikasi minimal 3 karakter"),
  logoUrl: z.string().url("Format URL logo tidak valid").or(z.literal("")),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function PengaturanSistem() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Berkas harus berupa gambar (.png, .jpg, .jpeg, dll)")
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const filePath = `branding/${fileName}`

      const { error } = await supabase.storage
        .from("tugas")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
          const { error: createError } = await supabase.storage.createBucket("tugas", { public: true })
          if (createError) throw createError

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

      const { data: { publicUrl } } = supabase.storage
        .from("tugas")
        .getPublicUrl(filePath)

      setValue("logoUrl", publicUrl, { shouldValidate: true })
      toast.success("Logo portal berhasil diunggah!")
    } catch (err: any) {
      console.error("Gagal mengunggah logo:", err)
      toast.error(`Gagal mengunggah logo: ${err.message || "Periksa konfigurasi Supabase Anda"}`)
    } finally {
      setUploading(false)
    }
  }

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await getAppSettings()
      setValue("appName", res.appName)
      setValue("logoUrl", res.logoUrl || "")
    } catch (err) {
      toast.error("Gagal memuat pengaturan aplikasi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateAppSettings({
        appName: values.appName,
        logoUrl: values.logoUrl,
      })
      toast.success("Pengaturan aplikasi berhasil disimpan. Muat ulang halaman untuk melihat perubahan branding.")
      window.location.reload()
    } catch (err) {
      toast.error("Gagal menyimpan pengaturan")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Pengaturan Identitas Sistem
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              Kustomisasi Nama Aplikasi, Logo Instansi, dan Branding SIMATU
            </p>
          </div>
          <Button
            onClick={loadSettings}
            variant="outline"
            size="icon"
            className="size-8 cursor-pointer ml-auto"
            title="Refresh Data"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>

        {/* Main Settings Panel */}
        {loading ? (
          <div className="flex h-[30vh] items-center justify-center">
            <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DashboardCard className="p-6 bg-white border-slate-100 space-y-6" animateHover={false}>
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <Sliders className="size-4.5 text-blue-650" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      Parameter Global Aplikasi
                    </h4>
                  </div>

                  {/* App Name Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Nama Portal Aplikasi
                    </label>
                    <input
                      type="text"
                      {...register("appName")}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                      placeholder="Contoh: SIMATU"
                    />
                    {errors.appName && (
                      <span className="text-[10px] text-rose-600 block">{errors.appName.message}</span>
                    )}
                  </div>

                  {/* Logo URL Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Logo Portal URL (Format .png / .jpg)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        {...register("logoUrl")}
                        className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 dark:bg-slate-900/50 dark:border-slate-800"
                        placeholder="Contoh: https://example.com/logo.png"
                      />
                      <label className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm hover:border-slate-300 shrink-0 cursor-pointer dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">
                        <Upload className="size-4 text-slate-400" />
                        {uploading ? "Mengunggah..." : "Pilih Berkas"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {errors.logoUrl && (
                      <span className="text-[10px] text-rose-600 block">{errors.logoUrl.message}</span>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 active:scale-95 transition-transform"
                    >
                      <Save className="size-4 mr-1.5" />
                      {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
                    </Button>
                  </div>
                </DashboardCard>
              </form>
            </div>

            {/* Information / Preview Column */}
            <div className="lg:col-span-1 space-y-6">
              <DashboardCard className="p-5 bg-white border-slate-100 text-center" animateHover={false}>
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4 text-left">
                  Pratinjau Branding
                </h4>
                
                <div className="size-16 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center mx-auto shadow-sm dark:bg-blue-950/20 dark:text-blue-400 overflow-hidden">
                  {watch("logoUrl") ? (
                    <img src={watch("logoUrl")} alt="Logo Preview" className="size-full object-contain" />
                  ) : (
                    <Image className="size-8" />
                  )}
                </div>
                
                <h3 className="text-sm font-bold text-slate-800 mt-4 dark:text-white">
                  Akademik SIMATU
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
                  Sistem Informasi Manajemen Terpadu
                </p>

                <div className="mt-5 p-3 rounded-lg border border-slate-50 bg-slate-50/30 text-[10px] text-slate-400 text-left leading-relaxed dark:bg-slate-900 dark:border-slate-850">
                  Branding logo dan nama portal yang disesuaikan akan ditampilkan pada dashboard sidebar utama, halaman masuk (login), dan kop surat dokumen digital.
                </div>
              </DashboardCard>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
