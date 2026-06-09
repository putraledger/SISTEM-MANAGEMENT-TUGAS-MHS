"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Shield, GraduationCap, KeyRound, Loader2, Sun, Moon, Laptop } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const loginSchema = z.object({
  identifier: z.string().min(1, "Username/NIM/NIDN wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

type LoginFormValues = z.infer<typeof loginSchema>

type RoleType = "mahasiswa" | "dosen" | "admin"

export default function LoginPage() {
  const [role, setRole] = useState<RoleType>("mahasiswa")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      const res = await signIn("credentials", {
        identifier: values.identifier,
        password: values.password,
        role,
        redirect: false,
      })

      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Login berhasil! Mengalihkan...")
        router.push("/")
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.")
    } finally {
      setIsLoading(false)
    }
  }

  const roleConfig = {
    mahasiswa: {
      title: "Portal Mahasiswa",
      desc: "Akses modul perkuliahan, tugas, dan nilai akademik Anda.",
      label: "NIM (Nomor Induk Mahasiswa)",
      placeholder: "Masukkan NIM Anda",
      icon: GraduationCap,
      color: "from-blue-600 to-indigo-600",
      accent: "text-indigo-600",
    },
    dosen: {
      title: "Portal Dosen",
      desc: "Kelola dosen pengampu, unggah tugas perkuliahan, dan beri nilai mahasiswa.",
      label: "NIDN (Nomor Induk Dosen Nasional)",
      placeholder: "Masukkan NIDN Anda",
      icon: BookOpen,
      color: "from-emerald-600 to-teal-600",
      accent: "text-teal-600",
    },
    admin: {
      title: "Portal Admin",
      desc: "Manajemen data mahasiswa, dosen, mata kuliah, dan audit log sistem.",
      label: "Username Administrator",
      placeholder: "Masukkan username admin",
      icon: Shield,
      color: "from-purple-600 to-rose-600",
      accent: "text-rose-600",
    },
  }

  const activeConfig = roleConfig[role]
  const IconComponent = activeConfig.icon

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger className="size-9 rounded-lg inline-flex items-center justify-center border border-slate-200 bg-white/80 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer outline-none dark:border-slate-800 dark:bg-slate-900/85 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white backdrop-blur-sm">
            <Sun className="size-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border-slate-100 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
            <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-slate-50 hover:text-slate-800 cursor-pointer text-xs">
              <Sun className="size-3.5 mr-2" /> Light Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-slate-50 hover:text-slate-800 cursor-pointer text-xs">
              <Moon className="size-3.5 mr-2" /> Dark Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-slate-50 hover:text-slate-800 cursor-pointer text-xs">
              <Laptop className="size-3.5 mr-2" /> System Mode
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Background gradients decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 dark:bg-teal-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-4 z-10"
      >
        <Card className="border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden transition-colors duration-300">
          {/* Header Gradient Stripe */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${activeConfig.color} transition-all duration-500`} />
          
          <CardHeader className="space-y-1 pb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-650 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                SIMATU
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                v1.0.0
              </span>
            </div>
            
            {/* Animate title changes */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className={`size-6 ${activeConfig.accent}`} />
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                    {activeConfig.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {activeConfig.desc}
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>

          {/* Role selector tabs */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors duration-300">
              {(["mahasiswa", "dosen", "admin"] as RoleType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`text-xs py-2 rounded-md font-medium capitalize transition-all duration-200 cursor-pointer ${
                    role === r
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  {activeConfig.label}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={activeConfig.placeholder}
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-indigo-500 transition-colors duration-300"
                  {...register("identifier")}
                />
                {errors.identifier && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
                    Kata Sandi
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-indigo-500 pl-10 transition-colors duration-300"
                    {...register("password")}
                  />
                  <KeyRound className="absolute left-3.5 top-2.5 size-4 text-slate-400 dark:text-slate-500" />
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-6 flex flex-col gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r ${activeConfig.color} text-white font-medium hover:brightness-110 active:scale-[0.98] transition-all`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Menyinkronkan...
                  </>
                ) : (
                  "Masuk Sistem"
                )}
              </Button>
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                Peringatan: Akses ilegal dapat dipidanakan sesuai hukum ITE.
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
