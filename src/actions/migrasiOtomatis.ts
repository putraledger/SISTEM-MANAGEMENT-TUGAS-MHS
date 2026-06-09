"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Helper to get logged-in user for audit log
async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

// Helper to log action to audit_log table
async function logAction(action: string, detail?: string) {
  try {
    const user = await getCurrentUser()
    await prisma.audit_log.create({
      data: {
        user_id: user?.identifier || "system",
        user_role: user?.role || "system",
        action,
        detail: detail || null,
        ip_address: "127.0.0.1",
      },
    })
  } catch (err) {
    console.error("Failed to write audit log:", err)
  }
}

function getNamaSemesterBerikutnya(namaSemesterLama: string): string {
  const normalized = namaSemesterLama.trim()
  const match = normalized.match(/^(Genap|Ganjil)\s+(\d{4})\/(\d{4})$/i)
  if (!match) {
    return `${normalized} - Berikutnya`
  }

  const tipe = match[1].toLowerCase()
  const tahunMulai = parseInt(match[2], 10)
  const tahunSelesai = parseInt(match[3], 10)

  if (tipe === "genap") {
    // Genap 2024/2025 -> Ganjil 2025/2026
    const nextTahunMulai = tahunMulai + 1
    const nextTahunSelesai = tahunSelesai + 1
    return `Ganjil ${nextTahunMulai}/${nextTahunSelesai}`
  } else {
    // Ganjil 2024/2025 -> Genap 2024/2025
    return `Genap ${tahunMulai}/${tahunSelesai}`
  }
}

export async function checkMigrationStats() {
  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true }
  })

  if (!activeSemester) {
    return {
      activeSemesterNama: "Tidak ada semester aktif",
      nextSemesterNama: "Tidak diketahui",
      promotedCount: 0,
      graduatedCount: 0
    }
  }

  const nextSemesterNama = getNamaSemesterBerikutnya(activeSemester.nama)

  // Get active students
  const activeStudents = await prisma.mahasiswa.findMany({
    where: { status_aktif: true }
  })

  const promotedCount = activeStudents.filter(s => s.semester_aktif < 8).length
  const graduatedCount = activeStudents.filter(s => s.semester_aktif >= 8).length

  return {
    activeSemesterNama: activeSemester.nama,
    nextSemesterNama,
    promotedCount,
    graduatedCount
  }
}

export async function migrasiOtomatis() {
  // Find current active semester
  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true }
  })

  if (!activeSemester) {
    throw new Error("Tidak ada semester aktif saat ini.")
  }

  // Generate next semester name
  const nextSemesterNama = getNamaSemesterBerikutnya(activeSemester.nama)

  // Get active students
  const activeStudents = await prisma.mahasiswa.findMany({
    where: { status_aktif: true },
    include: { prodi: true }
  })

  // Get all active courses
  const activeCourses = await prisma.mata_kuliah.findMany({
    where: { status_aktif: true }
  })

  let studentsPromoted = 0
  let studentsGraduated = 0
  let enrollmentsCreated = 0
  const warnings: string[] = []

  // Perform transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Deactivate old semester
    await tx.semester.update({
      where: { id: activeSemester.id },
      data: { is_active: false }
    })

    // 2. Create and activate next semester
    const newSem = await tx.semester.create({
      data: {
        nama: nextSemesterNama,
        is_active: true
      }
    })

    // 3. Process students
    for (const student of activeStudents) {
      if (student.semester_aktif >= 8) {
        // Graduate student
        await tx.mahasiswa.update({
          where: { id: student.id },
          data: {
            status_kelulusan: "lulus",
            tanggal_lulus: new Date(),
            status_aktif: false,
          }
        })
        studentsGraduated++
      } else {
        // Promote student
        const newSemester = student.semester_aktif + 1
        await tx.mahasiswa.update({
          where: { id: student.id },
          data: {
            semester_aktif: newSemester
          }
        })
        studentsPromoted++

        // Create new enrollment in the new semester if matching courses are available
        const targetCourses = activeCourses.filter(
          (mk) => mk.prodi_id === student.prodi_id && mk.semester === newSemester
        )

        if (targetCourses.length === 0) {
          const warnMsg = `Prodi "${student.prodi.nama}" semester ${newSemester} belum memiliki mata kuliah aktif di sistem.`
          if (!warnings.includes(warnMsg)) {
            warnings.push(warnMsg)
          }
          continue
        }

        for (const course of targetCourses) {
          await tx.enrollment.create({
            data: {
              mahasiswa_id: student.id,
              mata_kuliah_id: course.id,
              semester_id: newSem.id
            }
          })
          enrollmentsCreated++
        }
      }
    }

    return {
      newSemId: newSem.id,
      studentsPromoted,
      studentsGraduated,
      enrollmentsCreated
    }
  }, {
    maxWait: 15000,
    timeout: 30000
  })

  // Log action
  const detailMsg = `Migrasi otomatis dari ${activeSemester.nama} ke ${nextSemesterNama}. Mahasiswa naik: ${result.studentsPromoted}, Mahasiswa lulus: ${result.studentsGraduated}, Enrollment baru: ${result.enrollmentsCreated}. Warning: ${warnings.length}`
  await logAction("MIGRATE_SEMESTER_AUTOMATIC", detailMsg)

  revalidatePath("/admin/semester")
  revalidatePath("/admin/mahasiswa")
  revalidatePath("/admin/enrollment")

  return {
    success: true,
    activeSemesterNama: activeSemester.nama,
    nextSemesterNama,
    studentsPromoted: result.studentsPromoted,
    studentsGraduated: result.studentsGraduated,
    enrollmentsCreated: result.enrollmentsCreated,
    warnings
  }
}
