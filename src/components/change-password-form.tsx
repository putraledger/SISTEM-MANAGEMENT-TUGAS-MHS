"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, KeyRound } from "lucide-react"

const schema = z.object({
  oldPassword: z.string().min(1, "Kata sandi lama wajib diisi"),
  newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi kata sandi minimal 6 karakter"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi kata sandi tidak cocok",
  path: ["confirmPassword"],
})

type FormValues = z.infer<typeof schema>

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      const res = await axios.post("/api/auth/change-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      toast.success(res.data.message || "Kata sandi berhasil diperbarui!")
      reset()
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Gagal memperbarui kata sandi."
      toast.error(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="border-slate-100 bg-white shadow-xs max-w-md w-full dark:border-slate-800 dark:bg-slate-900/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="size-5 text-blue-600 dark:text-blue-450" />
            <CardTitle className="text-sm font-semibold text-slate-800 tracking-tight dark:text-white">
              Keamanan Akun
            </CardTitle>
          </div>
          <CardDescription className="text-slate-400 text-xs">
            Ubah kata sandi secara berkala untuk menjaga keamanan akun Anda.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs font-semibold dark:text-slate-300" htmlFor="oldPassword">
                Kata Sandi Lama
              </Label>
              <Input
                id="oldPassword"
                type="password"
                placeholder="Masukkan kata sandi saat ini"
                className="bg-slate-50/30 border-slate-100 text-slate-800 text-xs placeholder-slate-400 focus-visible:ring-blue-500 dark:bg-slate-950/80 dark:border-slate-800 dark:text-white"
                {...register("oldPassword")}
              />
              {errors.oldPassword && (
                <p className="text-xs text-rose-500 font-medium">{errors.oldPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs font-semibold dark:text-slate-300" htmlFor="newPassword">
                Kata Sandi Baru
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimal 6 karakter"
                className="bg-slate-50/30 border-slate-100 text-slate-800 text-xs placeholder-slate-400 focus-visible:ring-blue-500 dark:bg-slate-950/80 dark:border-slate-800 dark:text-white"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-xs text-rose-500 font-medium">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs font-semibold dark:text-slate-300" htmlFor="confirmPassword">
                Konfirmasi Kata Sandi Baru
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi kata sandi baru"
                className="bg-slate-50/30 border-slate-100 text-slate-800 text-xs placeholder-slate-400 focus-visible:ring-blue-500 dark:bg-slate-950/80 dark:border-slate-800 dark:text-white"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white hover:bg-blue-500 active:scale-95 transition-all text-xs font-semibold rounded-lg shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Memproses...
                </>
              ) : (
                "Perbarui Kata Sandi"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
