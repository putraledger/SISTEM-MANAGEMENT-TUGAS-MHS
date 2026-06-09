"use client"

import { useEffect, useState } from "react"
import { getSemesterAktif, getAllSemester } from "@/lib/semester"
import { Calendar } from "lucide-react"

interface SemesterFilterProps {
  selectedSemesterId: number | string
  onChange: (semesterId: number | string) => void
  className?: string
  showActiveOptionOnly?: boolean
}

export function SemesterFilter({ selectedSemesterId, onChange, className = "", showActiveOptionOnly = false }: SemesterFilterProps) {
  const [semesters, setSemesters] = useState<any[]>([])
  const [activeSemester, setActiveSemester] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSemesters() {
      try {
        const [active, all] = await Promise.all([
          getSemesterAktif(),
          getAllSemester()
        ])
        setActiveSemester(active)
        setSemesters(all)
      } catch (err) {
        console.error("Gagal mengambil data semester untuk filter:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSemesters()
  }, [])

  if (loading) {
    return (
      <div className={`h-8.5 w-48 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg ${className}`} />
    )
  }

  return (
    <div className={`flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-300 ${className}`}>
      <Calendar className="size-4 text-blue-600 dark:text-blue-450 shrink-0" />
      <span>Semester:</span>
      <select
        value={selectedSemesterId}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === "active" ? "active" : parseInt(val, 10))
        }}
        className="px-3.5 py-1.5 border border-slate-200 rounded-lg outline-none bg-white text-xs text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-250 cursor-pointer focus:border-blue-500 transition-colors"
      >
        {!showActiveOptionOnly && activeSemester && (
          <option value="active">Aktif ({activeSemester.nama})</option>
        )}
        {semesters.map((sem) => (
          <option key={sem.id} value={sem.id}>
            {sem.nama} {sem.is_active ? "(Aktif)" : ""}
          </option>
        ))}
      </select>
    </div>
  )
}
