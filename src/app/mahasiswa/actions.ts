"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { revalidatePath } from "next/cache"
import { logAction } from "@/app/admin/actions"

// Helper to get logged-in user session
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

// 1. Resolve student info
export async function getCurrentMahasiswa() {
  const user = await getCurrentUser()
  if (!user || user.role !== "mahasiswa") throw new Error("Unauthorized")

  const mhs = await prisma.mahasiswa.findUnique({
    where: { nim: user.identifier },
  })
  if (!mhs) throw new Error("Mahasiswa tidak ditemukan")

  return mhs
}

// 2. Fetch Dashboard stats, tasks list, and announcements
export async function getMahasiswaDashboardStats() {
  const mhs = await getCurrentMahasiswa()

  const profileMhs = await prisma.mahasiswa.findUnique({
    where: { id: mhs.id },
    include: {
      prodi: {
        include: {
          fakultas: true,
        },
      },
    },
  })

  // Get active semester
  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  const semesterId = activeSemester?.id || 0

  // Enrolled courses
  const enrollments = await prisma.enrollment.findMany({
    where: {
      mahasiswa_id: mhs.id,
      semester_id: semesterId,
    },
    include: {
      mata_kuliah: true,
    },
  })
  const courseIds = enrollments.map((e) => e.mata_kuliah_id)
  const totalSks = enrollments.reduce((acc, curr) => acc + curr.mata_kuliah.sks, 0)

  // Fetch published tasks in enrolled courses for the active semester
  const publishedTasks = await prisma.tugas.findMany({
    where: {
      mata_kuliah_id: { in: courseIds },
      semester_id: semesterId,
      status: "publish",
    },
    include: {
      mata_kuliah: true,
      submissions: {
        where: { mahasiswa_id: mhs.id },
      },
    },
    orderBy: { deadline: "asc" },
  })

  // Pending tasks count (tugas publish and no submission yet)
  const pendingTasksCount = publishedTasks.filter((t) => t.submissions.length === 0).length

  // Compile active tasks list
  const activeTasksList = publishedTasks.map((task) => {
    const hasSubmitted = task.submissions.length > 0
    return {
      id: task.id,
      judul: task.judul,
      deskripsi: task.deskripsi,
      deadline: task.deadline,
      courseKode: task.mata_kuliah.kode,
      courseNama: task.mata_kuliah.nama,
      hasSubmitted,
    }
  })

  // Fetch announcements
  const announcements = await prisma.pengumuman.findMany({
    where: {
      OR: [
        { target: "semua" },
        { target: "mahasiswa" },
      ],
    },
    include: {
      dosen: {
        select: { nama: true },
      },
    },
    orderBy: { created_at: "desc" },
    take: 5,
  })

  const link = await prisma.telegram_link.findFirst({
    where: {
      user_id: mhs.nim,
      user_role: "mahasiswa",
    },
  })

  return {
    stats: {
      totalCourses: enrollments.length,
      totalSks,
      pendingTasks: pendingTasksCount,
      activeSemesterNama: activeSemester?.nama || "Tidak ada semester aktif",
       semesterAktif: mhs.semester_aktif,
      angkatan: mhs.angkatan,
      prodiNama: profileMhs?.prodi?.nama || "",
      fakultasNama: profileMhs?.prodi?.fakultas?.nama || "Fakultas Ilmu Komputer",
      nama: mhs.nama,
      nim: mhs.nim,
    },
    activeTasks: activeTasksList,
    announcements: announcements.map((ann) => ({
      id: ann.id,
      judul: ann.judul,
      isi: ann.isi,
      target: ann.target,
      sender: ann.created_by === "admin" ? "Admin SIMATU" : ann.dosen?.nama || "Dosen Pengajar",
      created_at: ann.created_at,
    })),
    telegramVerified: link ? link.is_verified : false,
  }
}

// 3. Fetch enrolled courses and their lecturers
export async function getMahasiswaClasses() {
  const mhs = await getCurrentMahasiswa()

  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  const semesterId = activeSemester?.id || 0

  const enrollments = await prisma.enrollment.findMany({
    where: {
      mahasiswa_id: mhs.id,
      semester_id: semesterId,
    },
    include: {
      mata_kuliah: {
        include: {
          prodi: true,
          dosen_pengampu: {
            include: {
              dosen: {
                include: {
                  prodi: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return enrollments.map((en) => {
    const lecturers = en.mata_kuliah.dosen_pengampu.map((dp) => ({
      nidn: dp.dosen.nidn,
      nama: dp.dosen.nama,
      prodi: dp.dosen.prodi?.nama || "",
    }))

    return {
      id: en.id,
      courseId: en.mata_kuliah.id,
      kode: en.mata_kuliah.kode,
      nama: en.mata_kuliah.nama,
      sks: en.mata_kuliah.sks,
      prodi: en.mata_kuliah.prodi?.nama || "",
      lecturers,
    }
  })
}

// 4. Fetch assignments, submissions, and grades
export async function getMahasiswaTasks(semesterId?: number | string) {
  const mhs = await getCurrentMahasiswa()

  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  
  let targetSemesterId = activeSemester?.id || 0
  if (semesterId && semesterId !== "active") {
    targetSemesterId = typeof semesterId === "string" ? parseInt(semesterId, 10) : semesterId
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      mahasiswa_id: mhs.id,
      semester_id: targetSemesterId,
    },
  })
  const courseIds = enrollments.map((e) => e.mata_kuliah_id)

  const tasks = await prisma.tugas.findMany({
    where: {
      mata_kuliah_id: { in: courseIds },
      semester_id: targetSemesterId,
      status: "publish",
    },
    include: {
      mata_kuliah: true,
      submissions: {
        where: { mahasiswa_id: mhs.id },
        include: {
          nilai: true,
        },
      },
    },
    orderBy: { deadline: "asc" },
  })

  return tasks.map((task) => {
    const submission = task.submissions[0] || null
    return {
      id: task.id,
      judul: task.judul,
      deskripsi: task.deskripsi,
      deadline: task.deadline,
      lampiranUrl: task.lampiran_url,
      courseKode: task.mata_kuliah.kode,
      courseNama: task.mata_kuliah.nama,
      submission: submission
        ? {
            id: submission.id,
            fileUrl: submission.file_url,
            catatan: submission.catatan,
            waktuSubmit: submission.waktu_submit,
            isLate: submission.is_late,
            nilai: submission.nilai
              ? {
                  id: submission.nilai.id,
                  nilaiAngka: submission.nilai.nilai_angka,
                  feedback: submission.nilai.feedback,
                  statusRevisi: submission.nilai.status_revisi,
                }
              : null,
          }
        : null,
    }
  })
}

// 5. Create / Edit submission
export async function upsertSubmission(data: {
  tugasId: number
  fileUrl: string
  catatan?: string
}) {
  const mhs = await getCurrentMahasiswa()

  const task = await prisma.tugas.findUnique({
    where: { id: data.tugasId },
  })
  if (!task) throw new Error("Tugas tidak ditemukan")

  // Evaluate lateness
  const deadlineDate = new Date(task.deadline)
  const isLate = new Date().getTime() > deadlineDate.getTime()

  // Find existing submission
  const existingSub = await prisma.submission.findFirst({
    where: { tugas_id: data.tugasId, mahasiswa_id: mhs.id },
  })

  let result
  if (existingSub) {
    result = await prisma.submission.update({
      where: { id: existingSub.id },
      data: {
        file_url: data.fileUrl,
        catatan: data.catatan || null,
        waktu_submit: new Date(),
        is_late: isLate,
      },
    })
    await logAction("SUBMIT_ASSIGNMENT", `Mengedit pengumpulan tugas: "${task.judul}" (Terlambat: ${isLate ? "Ya" : "Tidak"})`)
  } else {
    result = await prisma.submission.create({
      data: {
        tugas_id: data.tugasId,
        mahasiswa_id: mhs.id,
        file_url: data.fileUrl,
        catatan: data.catatan || null,
        waktu_submit: new Date(),
        is_late: isLate,
      },
    })
    await logAction("SUBMIT_ASSIGNMENT", `Mengumpulkan tugas baru: "${task.judul}" (Terlambat: ${isLate ? "Ya" : "Tidak"})`)
  }

  revalidatePath("/mahasiswa/tugas")
  revalidatePath("/mahasiswa/nilai")
  revalidatePath("/mahasiswa")
  return result
}

// 6. Delete submission before deadline
export async function deleteSubmission(submissionId: number) {
  const mhs = await getCurrentMahasiswa()

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { tugas: true },
  })

  if (!sub) throw new Error("Submission tidak ditemukan")
  if (sub.mahasiswa_id !== mhs.id) throw new Error("Unauthorized")

  // Ensure deadline has not passed to delete
  const deadlineDate = new Date(sub.tugas.deadline)
  if (new Date().getTime() > deadlineDate.getTime()) {
    throw new Error("Batas tenggat tugas telah terlewati. Tidak dapat menghapus submission.")
  }

  const result = await prisma.submission.delete({
    where: { id: submissionId },
  })

  await logAction("DELETE_SUBMISSION", `Membatalkan/menghapus pengumpulan tugas: "${sub.tugas.judul}"`)

  revalidatePath("/mahasiswa/tugas")
  revalidatePath("/mahasiswa/nilai")
  revalidatePath("/mahasiswa")
  return { success: true }
}

// 7. Get or Generate Telegram Link status for Mahasiswa
export async function getTelegramLinkStatus() {
  try {
    const mhs = await getCurrentMahasiswa()

    let link = await prisma.telegram_link.findFirst({
      where: {
        user_id: mhs.nim,
        user_role: "mahasiswa",
      },
    })

    if (!link) {
      // Generate a unique token
      let token = ""
      let isUnique = false
      while (!isUnique) {
        token = "TG-" + Math.random().toString(36).substring(2, 8).toUpperCase()
        const existingToken = await prisma.telegram_link.findUnique({
          where: { token },
        })
        if (!existingToken) isUnique = true
      }

      link = await prisma.telegram_link.create({
        data: {
          user_id: mhs.nim,
          user_role: "mahasiswa",
          chat_id: `PENDING-mahasiswa-${mhs.nim}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          token,
          is_verified: false,
        },
      })
    }

    return {
      success: true,
      isVerified: link.is_verified,
      token: link.token,
      chatId: link.is_verified ? link.chat_id : null,
    }
  } catch (err: any) {
    console.error("Error in getTelegramLinkStatus:", err)
    return {
      success: false,
      error: err.message || "Gagal memuat status Telegram",
      isVerified: false,
      token: null,
      chatId: null,
    }
  }
}

// 8. Unlink Telegram account for Mahasiswa
export async function unlinkTelegram() {
  try {
    const mhs = await getCurrentMahasiswa()

    await prisma.telegram_link.deleteMany({
      where: {
        user_id: mhs.nim,
        user_role: "mahasiswa",
      },
    })

    await logAction("UNLINK_TELEGRAM", `Memutuskan koneksi bot Telegram Mahasiswa NIM: ${mhs.nim}`)

    revalidatePath("/mahasiswa")
    return { success: true }
  } catch (err: any) {
    console.error("Error in unlinkTelegram:", err)
    return { success: false, error: err.message || "Gagal memutuskan koneksi Telegram" }
  }
}

// 9. Fetch all notifications for Mahasiswa
export async function getMahasiswaNotifications() {
  const mhs = await getCurrentMahasiswa()

  return await prisma.notifikasi.findMany({
    where: {
      user_id: mhs.nim,
      user_role: "mahasiswa",
    },
    orderBy: {
      created_at: "desc",
    },
  })
}

// 10. Mark all notifications as read for Mahasiswa
export async function markAllMahasiswaNotificationsAsRead() {
  const mhs = await getCurrentMahasiswa()

  await prisma.notifikasi.updateMany({
    where: {
      user_id: mhs.nim,
      user_role: "mahasiswa",
      is_read: false,
    },
    data: {
      is_read: true,
    },
  })

  revalidatePath("/mahasiswa")
  return { success: true }
}

export async function getMahasiswaArchiveData(semesterId: number) {
  const mhs = await getCurrentMahasiswa()

  const enrollments = await prisma.enrollment.findMany({
    where: {
      mahasiswa_id: mhs.id,
      semester_id: semesterId,
    },
    include: {
      mata_kuliah: {
        include: {
          tugas: {
            where: { semester_id: semesterId },
            include: {
              submissions: {
                where: { mahasiswa_id: mhs.id },
                include: {
                  nilai: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return enrollments.map((en) => {
    return {
      id: en.id,
      courseId: en.mata_kuliah.id,
      kode: en.mata_kuliah.kode,
      nama: en.mata_kuliah.nama,
      sks: en.mata_kuliah.sks,
      tugas: en.mata_kuliah.tugas.map((t) => {
        const submission = t.submissions[0] || null
        return {
          id: t.id,
          judul: t.judul,
          deskripsi: t.deskripsi,
          deadline: t.deadline,
          lampiranUrl: t.lampiran_url,
          submission: submission
            ? {
                id: submission.id,
                fileUrl: submission.file_url,
                catatan: submission.catatan,
                waktuSubmit: submission.waktu_submit,
                isLate: submission.is_late,
                nilai: submission.nilai
                  ? {
                      id: submission.nilai.id,
                      nilaiAngka: submission.nilai.nilai_angka,
                      feedback: submission.nilai.feedback,
                      statusRevisi: submission.nilai.status_revisi,
                    }
                  : null,
              }
            : null,
        }
      }),
    }
  })
}



