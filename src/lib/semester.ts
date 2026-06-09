"use server"

import { prisma } from "@/lib/prisma"

export async function getSemesterAktif() {
  try {
    const active = await prisma.semester.findFirst({
      where: { is_active: true }
    })
    return active
  } catch (err) {
    console.error("Gagal mendapatkan semester aktif:", err)
    return null
  }
}

export async function getAllSemester() {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { created_at: "desc" }
    })
    return semesters
  } catch (err) {
    console.error("Gagal mendapatkan daftar semester:", err)
    return []
  }
}

export async function generateNamaSemesterBerikutnya() {
  try {
    const active = await getSemesterAktif()
    if (!active) return "Semester Baru"
    
    const normalized = active.nama.trim()
    const match = normalized.match(/^(Genap|Ganjil)\s+(\d{4})\/(\d{4})$/i)
    if (!match) {
      return `${normalized} - Berikutnya`
    }

    const tipe = match[1].toLowerCase()
    const tahunMulai = parseInt(match[2], 10)
    const tahunSelesai = parseInt(match[3], 10)

    if (tipe === "genap") {
      const nextTahunMulai = tahunMulai + 1
      const nextTahunSelesai = tahunSelesai + 1
      return `Ganjil ${nextTahunMulai}/${nextTahunSelesai}`
    } else {
      return `Genap ${tahunMulai}/${tahunSelesai}`
    }
  } catch (err) {
    console.error("Gagal men-generate nama semester berikutnya:", err)
    return "Semester Baru"
  }
}

export async function generateNamaSemesterBerkutnya() {
  return generateNamaSemesterBerikutnya()
}

