"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import axios from "axios"
import { createNotification } from "@/lib/telegram"
import { logAction } from "@/app/admin/actions"


// Helper to get logged-in user
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

// Helper to send Telegram messages via Bot API
export async function sendTelegram(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.log("Telegram Bot Token is not set. Skipping notification.")
    return
  }
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    })
  } catch (err) {
    console.error(`Failed to send Telegram notification to chat ${chatId}:`, err)
  }
}

// ==========================================
// 1. DASHBOARD & STATS ACTIONS
// ==========================================
export async function getDosenDashboardStats() {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dosen = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dosen) throw new Error("Dosen tidak ditemukan")

  // Get active semester name
  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  const semesterId = activeSemester?.id || 0

  // Courses taught
  const coursesTaught = await prisma.dosen_pengampu.findMany({
    where: { dosen_id: dosen.id },
    select: { mata_kuliah_id: true },
  })
  const courseIds = coursesTaught.map((c) => c.mata_kuliah_id)

  // Only count classes that have enrollments in the active semester
  const enrollments = await prisma.enrollment.findMany({
    where: {
      mata_kuliah_id: { in: courseIds },
      semester_id: semesterId,
    },
    select: { mata_kuliah_id: true }
  })
  const activeCourseIds = Array.from(new Set(enrollments.map((e) => e.mata_kuliah_id)))
  const totalClasses = activeCourseIds.length

  // Total tasks in active semester
  const totalTasks = await prisma.tugas.count({
    where: { 
      mata_kuliah_id: { in: activeCourseIds },
      semester_id: semesterId
    },
  })

  // Total submissions ungraded in active semester
  const ungradedCount = await prisma.submission.count({
    where: {
      tugas: { 
        mata_kuliah_id: { in: activeCourseIds },
        semester_id: semesterId
      },
      nilai: null,
    },
  })

  const link = await prisma.telegram_link.findFirst({
    where: {
      user_id: dosen.nidn,
      user_role: "dosen",
    },
  })

  return {
    totalClasses,
    totalTasks,
    ungradedCount,
    activeSemesterNama: activeSemester?.nama || "Tidak ada semester aktif",
    telegramVerified: link ? link.is_verified : false,
  }
}

export async function getDosenDashboardDetails() {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dosen = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dosen) throw new Error("Dosen tidak ditemukan")

  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  const semesterId = activeSemester?.id || 0

  // Fetch courses diampu
  const classes = await prisma.dosen_pengampu.findMany({
    where: { dosen_id: dosen.id },
    include: {
      mata_kuliah: {
        include: {
          prodi: true,
          enrollments: {
            where: { semester_id: semesterId },
          },
        },
      },
    },
  })

  const activeClasses = classes.filter((c) => c.mata_kuliah.enrollments.length > 0)
  const activeCourseIds = activeClasses.map((c) => c.mata_kuliah_id)

  // Fetch tasks that have submissions with nilai == null
  const tasksWithUngraded = await prisma.tugas.findMany({
    where: {
      mata_kuliah_id: { in: activeCourseIds },
      semester_id: semesterId,
      status: "publish",
    },
    include: {
      mata_kuliah: true,
      submissions: {
        include: {
          nilai: true,
        },
      },
    },
  })

  const ungradedTasks = tasksWithUngraded
    .map((task) => {
      const totalSubmissions = task.submissions.length
      const ungradedCount = task.submissions.filter((sub) => !sub.nilai).length
      return {
        id: task.id,
        judul: task.judul,
        deadline: task.deadline,
        mataKuliahNama: task.mata_kuliah.nama,
        mataKuliahKode: task.mata_kuliah.kode,
        totalSubmissions,
        ungradedCount,
      }
    })
    .filter((task) => task.ungradedCount > 0)

  return {
    courses: activeClasses.map((c) => ({
      id: c.id,
      mata_kuliah_id: c.mata_kuliah_id,
      kode: c.mata_kuliah.kode,
      nama: c.mata_kuliah.nama,
      sks: c.mata_kuliah.sks,
      prodi: c.mata_kuliah.prodi?.nama || "",
      studentCount: c.mata_kuliah.enrollments.length,
    })),
    ungradedTasks,
  }
}

// ==========================================
// 2. MATA KULIAH SAYA ACTIONS
// ==========================================
export async function getDosenClasses() {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dosen = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dosen) throw new Error("Dosen tidak ditemukan")

  // Get active semester id
  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  const semesterId = activeSemester?.id || 0

  const classes = await prisma.dosen_pengampu.findMany({
    where: { dosen_id: dosen.id },
    include: {
      mata_kuliah: {
        include: {
          prodi: {
            include: {
              fakultas: true,
            },
          },
          enrollments: {
            where: { semester_id: semesterId },
            include: {
              mahasiswa: {
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

  // Only return classes that have active student enrollments in the active semester
  return classes.filter((c) => c.mata_kuliah.enrollments.length > 0)
}

// ==========================================
// 3. MANAJEMEN TUGAS ACTIONS
// ==========================================
export async function getDosenTasks(semesterId?: number | string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dosen = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dosen) throw new Error("Dosen tidak ditemukan")

  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  
  let targetSemesterId = activeSemester?.id || 0
  if (semesterId && semesterId !== "active") {
    targetSemesterId = typeof semesterId === "string" ? parseInt(semesterId, 10) : semesterId
  }

  const coursesTaught = await prisma.dosen_pengampu.findMany({
    where: { dosen_id: dosen.id },
    select: { mata_kuliah_id: true },
  })
  const courseIds = coursesTaught.map((c) => c.mata_kuliah_id)

  return await prisma.tugas.findMany({
    where: { 
      mata_kuliah_id: { in: courseIds },
      semester_id: targetSemesterId,
    },
    include: {
      mata_kuliah: {
        include: {
          prodi: {
            include: {
              fakultas: true,
            },
          },
        },
      },
    },
    orderBy: { deadline: "asc" },
  })
}

export async function upsertDosenTask(data: {
  id?: number
  judul: string
  deskripsi?: string
  deadline: string
  lampiran_url?: string
  status: string
  mata_kuliah_id: number
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  if (!activeSemester) {
    throw new Error("Tidak ada semester aktif terkonfigurasi. Silakan hubungi admin.")
  }

  const isEdit = !!data.id
  let result

  // For smart notification broadcasts, check previous task state
  let shouldBroadcastNew = false
  let shouldBroadcastUpdate = false

  if (isEdit) {
    const prevTask = await prisma.tugas.findUnique({ where: { id: data.id } })
    if (prevTask) {
      if (prevTask.status === "draft" && data.status === "publish") {
        shouldBroadcastNew = true
      } else if (prevTask.status === "publish" && data.status === "publish") {
        // Broadcast update only if deadline, title, or description changed significantly
        if (
          prevTask.judul !== data.judul ||
          prevTask.deadline.getTime() !== new Date(data.deadline).getTime() ||
          prevTask.deskripsi !== (data.deskripsi || null)
        ) {
          shouldBroadcastUpdate = true
        }
      }
    }

    result = await prisma.tugas.update({
      where: { id: data.id },
      data: {
        judul: data.judul,
        deskripsi: data.deskripsi || null,
        deadline: new Date(data.deadline),
        lampiran_url: data.lampiran_url || null,
        status: data.status,
        mata_kuliah_id: data.mata_kuliah_id,
        semester_id: activeSemester.id,
      },
    })
    await logAction("UPDATE_TASK", `Mengubah tugas: "${data.judul}" (ID: ${data.id})`)
  } else {
    if (data.status === "publish") {
      shouldBroadcastNew = true
    }

    result = await prisma.tugas.create({
      data: {
        judul: data.judul,
        deskripsi: data.deskripsi || null,
        deadline: new Date(data.deadline),
        lampiran_url: data.lampiran_url || null,
        status: data.status,
        mata_kuliah_id: data.mata_kuliah_id,
        semester_id: activeSemester.id,
      },
    })
    await logAction("CREATE_TASK", `Menambah tugas: "${data.judul}" untuk MK ID: ${data.mata_kuliah_id}`)
  }

  // Telegram & DB Notification Broadcast Trigger
  if (shouldBroadcastNew || shouldBroadcastUpdate) {
    try {
      const mk = await prisma.mata_kuliah.findUnique({
        where: { id: data.mata_kuliah_id },
      })

      // Get enrolled student details
      const activeSemester = await prisma.semester.findFirst({
        where: { is_active: true },
      })
      const enrolls = await prisma.enrollment.findMany({
        where: {
          mata_kuliah_id: data.mata_kuliah_id,
          semester_id: activeSemester?.id || 0,
        },
        include: {
          mahasiswa: true,
        },
      })

      if (enrolls.length > 0 && mk) {
        const dateStr = new Date(data.deadline).toLocaleString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        
        const judul = shouldBroadcastNew 
          ? `📢 TUGAS BARU: ${data.judul}`
          : `📢 PERUBAHAN TUGAS: ${data.judul}`
        const pesan = shouldBroadcastNew
          ? `Dosen pengampu Anda telah menerbitkan tugas baru pada mata kuliah *${mk.nama}*.\n\n` +
            `• *Judul Tugas*: ${data.judul}\n` +
            `• *Tenggat Waktu*: ${dateStr}\n` +
            `• *Deskripsi*: ${data.deskripsi || "-"}\n\n` +
            `Silakan buka portal SIMATU Anda untuk mengerjakan & mengunggah jawaban tugas ini. Semangat! 💪`
          : `Dosen pengampu Anda telah memperbarui detail tugas pada mata kuliah *${mk.nama}*.\n\n` +
            `• *Judul Tugas*: ${data.judul}\n` +
            `• *Tenggat Waktu Baru*: ${dateStr}\n` +
            `• *Deskripsi*: ${data.deskripsi || "-"}\n\n` +
            `Harap periksa kembali detail tugas terbaru ini di portal SIMATU Anda. Terima kasih! ✨`

        // Send notifications asynchronously to all enrolled students
        for (const enroll of enrolls) {
          await createNotification({
            userId: enroll.mahasiswa.nim,
            userRole: "mahasiswa",
            judul,
            pesan,
          }).catch((err) => {
            console.error(`Error notifying student ${enroll.mahasiswa.nim}:`, err)
          })
        }
      }
    } catch (teleErr) {
      console.error("Failed to broadcast notifications for task:", teleErr)
    }
  }

  revalidatePath("/dosen/tugas")
  return result
}

export async function deleteDosenTask(id: number) {
  const task = await prisma.tugas.findUnique({
    where: { id },
    include: { mata_kuliah: true },
  })
  await prisma.tugas.delete({
    where: { id },
  })
  if (task) {
    await logAction("DELETE_TASK", `Menghapus tugas: "${task.judul}" dari MK: ${task.mata_kuliah.kode}`)
  }
  revalidatePath("/dosen/tugas")
  return { success: true }
}

// ==========================================
// 4. SUBMISSIONS & PENILAIAN ACTIONS
// ==========================================
export async function getDosenSubmissions(tugasId: number) {
  return await prisma.submission.findMany({
    where: { tugas_id: tugasId },
    include: {
      mahasiswa: true,
      nilai: true,
    },
    orderBy: { waktu_submit: "desc" },
  })
}

export async function submitGrade(data: {
  submissionId: number
  nilaiAngka: number
  feedback?: string
  statusRevisi: string
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  // Upsert grade
  const result = await prisma.nilai.upsert({
    where: { submission_id: data.submissionId },
    update: {
      nilai_angka: data.nilaiAngka,
      feedback: data.feedback || null,
      status_revisi: data.statusRevisi,
    },
    create: {
      submission_id: data.submissionId,
      nilai_angka: data.nilaiAngka,
      feedback: data.feedback || null,
      status_revisi: data.statusRevisi,
    },
  })

  // Log action
  try {
    const subForLog = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: { mahasiswa: true, tugas: true },
    })
    if (subForLog) {
      await logAction("SUBMIT_GRADE", `Menilai tugas: "${subForLog.tugas.judul}" untuk mahasiswa NIM: ${subForLog.mahasiswa.nim} dengan nilai: ${data.nilaiAngka} (Revisi: ${data.statusRevisi})`)
    }
  } catch (logErr) {
    console.error("Failed to write submit grade audit log:", logErr)
  }

  // Telegram & DB Notification Trigger
  try {
    const sub = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: {
        mahasiswa: true,
        tugas: {
          include: {
            mata_kuliah: true,
          },
        },
      },
    })

    if (sub) {
      const statusRevisiStr = data.statusRevisi === "revisi" ? "⚠️ YA, PERLU REVISI" : "✅ TIDAK (SELESAI)"
      const judul = `📝 PENILAIAN TUGAS: ${sub.tugas.judul}`
      const pesan = `Tugas Anda telah dinilai oleh Dosen pengampu.\n\n` +
        `• *Mata Kuliah*: ${sub.tugas.mata_kuliah.nama}\n` +
        `• *Tugas*: ${sub.tugas.judul}\n` +
        `• *Nilai Angka*: *${data.nilaiAngka}*\n` +
        `• *Status Revisi*: ${statusRevisiStr}\n` +
        `• *Catatan Dosen*: ${data.feedback || "-"}\n\n` +
        `Silakan buka portal SIMATU Anda untuk melihat detail evaluasi lengkap.`

      await createNotification({
        userId: sub.mahasiswa.nim,
        userRole: "mahasiswa",
        judul,
        pesan,
      })
    }
  } catch (teleErr) {
    console.error("Failed to send personal grading notification:", teleErr)
  }

  revalidatePath("/dosen/submissions")
  return result
}

// ==========================================
// 5. PENGUMUMAN MK ACTIONS
// ==========================================
export async function getDosenAnnouncements() {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dosen = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dosen) throw new Error("Dosen tidak ditemukan")

  return await prisma.pengumuman.findMany({
    where: { dosen_id: dosen.id },
    orderBy: { created_at: "desc" },
  })
}

export async function createCourseAnnouncement(data: {
  judul: string
  isi: string
  target: string // mahasiswa
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dosen = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dosen) throw new Error("Dosen tidak ditemukan")

  const result = await prisma.pengumuman.create({
    data: {
      judul: data.judul,
      isi: data.isi,
      target: data.target,
      created_by: dosen.nidn,
      dosen_id: dosen.id,
    },
  })

  await logAction("CREATE_ANNOUNCEMENT", `Membuat pengumuman kelas: "${data.judul}"`)

  // Broadcast announcement to all enrolled students
  try {
    const activeSemester = await prisma.semester.findFirst({
      where: { is_active: true },
    })
    const semesterId = activeSemester?.id || 0

    // Get all courses taught by this lecturer
    const taughtClasses = await prisma.dosen_pengampu.findMany({
      where: { dosen_id: dosen.id },
      select: { mata_kuliah_id: true },
    })
    const courseIds = taughtClasses.map((tc) => tc.mata_kuliah_id)

    // Find all enrolled students for these courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        mata_kuliah_id: { in: courseIds },
        semester_id: semesterId,
      },
      include: {
        mahasiswa: true,
      },
    })

    // Get unique students
    const uniqueStudentNims = Array.from(new Set(enrollments.map((e) => e.mahasiswa.nim)))

    const judul = `📢 PENGUMUMAN BARU DARI DOSEN`
    const pesan = `Dosen *${dosen.nama}* telah mempublikasikan pengumuman baru kelas:\n\n` +
      `*${data.judul}*\n\n` +
      `"${data.isi}"\n\n` +
      `Harap perhatikan informasi di atas untuk kelancaran kegiatan belajar mengajar Anda.`

    for (const nim of uniqueStudentNims) {
      await createNotification({
        userId: nim,
        userRole: "mahasiswa",
        judul,
        pesan,
      }).catch((e) => console.error(`Failed to notify student ${nim} for announcement:`, e))
    }
  } catch (broadcastErr) {
    console.error("Failed to broadcast course announcement:", broadcastErr)
  }

  revalidatePath("/dosen/pengumuman")
  return result
}

export async function deleteCourseAnnouncement(id: number) {
  const ann = await prisma.pengumuman.findUnique({ where: { id } })
  await prisma.pengumuman.delete({
    where: { id },
  })
  if (ann) {
    await logAction("DELETE_ANNOUNCEMENT", `Menghapus pengumuman kelas: "${ann.judul}"`)
  }
  revalidatePath("/dosen/pengumuman")
  return { success: true }
}

// Get or Generate Telegram Link status for Dosen
export async function getTelegramLinkStatus() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "dosen") throw new Error("Unauthorized")

    const dsn = await prisma.dosen.findUnique({
      where: { nidn: user.identifier },
    })
    if (!dsn) throw new Error("Dosen tidak ditemukan")

    let link = await prisma.telegram_link.findFirst({
      where: {
        user_id: dsn.nidn,
        user_role: "dosen",
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
          user_id: dsn.nidn,
          user_role: "dosen",
          chat_id: `PENDING-dosen-${dsn.nidn}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
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
    console.error("Error in getTelegramLinkStatus for Dosen:", err)
    return {
      success: false,
      error: err.message || "Gagal memuat status Telegram",
      isVerified: false,
      token: null,
      chatId: null,
    }
  }
}

// Unlink Telegram account for Dosen
export async function unlinkTelegram() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "dosen") throw new Error("Unauthorized")

    const dsn = await prisma.dosen.findUnique({
      where: { nidn: user.identifier },
    })
    if (!dsn) throw new Error("Dosen tidak ditemukan")

    await prisma.telegram_link.deleteMany({
      where: {
        user_id: dsn.nidn,
        user_role: "dosen",
      },
    })

    await logAction("UNLINK_TELEGRAM", `Memutuskan koneksi bot Telegram Dosen NIDN: ${dsn.nidn}`)

    revalidatePath("/dosen")
    return { success: true }
  } catch (err: any) {
    console.error("Error in unlinkTelegram for Dosen:", err)
    return { success: false, error: err.message || "Gagal memutuskan koneksi Telegram" }
  }
}

// Fetch all notifications for Dosen
export async function getDosenNotifications() {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dsn = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dsn) throw new Error("Dosen tidak ditemukan")

  return await prisma.notifikasi.findMany({
    where: {
      user_id: dsn.nidn,
      user_role: "dosen",
    },
    orderBy: {
      created_at: "desc",
    },
  })
}

// Mark all notifications as read for Dosen
export async function markAllDosenNotificationsAsRead() {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dsn = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dsn) throw new Error("Dosen tidak ditemukan")

  await prisma.notifikasi.updateMany({
    where: {
      user_id: dsn.nidn,
      user_role: "dosen",
      is_read: false,
    },
    data: {
      is_read: true,
    },
  })

  revalidatePath("/dosen")
  return { success: true }
}

export async function getDosenArchiveData(semesterId: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== "dosen") throw new Error("Unauthorized")

  const dosen = await prisma.dosen.findUnique({
    where: { nidn: user.identifier },
  })
  if (!dosen) throw new Error("Dosen tidak ditemukan")

  // Fetch classes taught by this lecturer that had student enrollments in the target semester
  const classes = await prisma.dosen_pengampu.findMany({
    where: { dosen_id: dosen.id },
    include: {
      mata_kuliah: {
        include: {
          prodi: true,
          enrollments: {
            where: { semester_id: semesterId },
            include: {
              mahasiswa: true,
            },
          },
          tugas: {
            where: { semester_id: semesterId },
            include: {
              submissions: {
                include: {
                  nilai: true,
                  mahasiswa: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Filter to only classes that have enrollments in that semester
  const archivedClasses = classes.filter((c) => c.mata_kuliah.enrollments.length > 0)
  
  return archivedClasses.map((c) => ({
    id: c.id,
    mata_kuliah_id: c.mata_kuliah_id,
    kode: c.mata_kuliah.kode,
    nama: c.mata_kuliah.nama,
    sks: c.mata_kuliah.sks,
    prodi: c.mata_kuliah.prodi?.nama || "",
    enrollments: c.mata_kuliah.enrollments.map((e) => ({
      mahasiswaId: e.mahasiswa.id,
      nim: e.mahasiswa.nim,
      nama: e.mahasiswa.nama,
    })),
    tugas: c.mata_kuliah.tugas.map((t) => ({
      id: t.id,
      judul: t.judul,
      deadline: t.deadline,
      status: t.status,
      submissions: t.submissions.map((sub) => ({
        id: sub.id,
        mahasiswaId: sub.mahasiswa_id,
        nim: sub.mahasiswa.nim,
        nama: sub.mahasiswa.nama,
        fileUrl: sub.file_url,
        catatan: sub.catatan,
        waktuSubmit: sub.waktu_submit,
        isLate: sub.is_late,
        nilai: sub.nilai ? {
          nilaiAngka: sub.nilai.nilai_angka,
          feedback: sub.nilai.feedback,
          statusRevisi: sub.nilai.status_revisi,
        } : null,
      })),
    })),
  }))
}


