import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/telegram"

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate if called via Cron (optional, standard token header verification)
    // We can also allow manual trigger via request (helpful for testing)
    const authHeader = req.headers.get("authorization")
    const isCronSecretValid =
      !process.env.CRON_SECRET || authHeader === `Bearer ${process.env.CRON_SECRET}`

    // Let's support manual bypass in local development
    if (process.env.NODE_ENV === "production" && !isCronSecretValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    // H-1 Window: 23 to 25 hours from now
    const h1Start = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const h1End = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    // 2. Fetch published tasks that fall in the deadline window
    const impendingTasks = await prisma.tugas.findMany({
      where: {
        status: "publish",
        deadline: {
          gte: h1Start,
          lte: h1End,
        },
      },
      include: {
        mata_kuliah: true,
      },
    })

    if (impendingTasks.length === 0) {
      return NextResponse.json({
        message: "No tasks found with deadlines closing in 23-25 hours.",
        remindersSent: 0,
      })
    }

    let remindersSent = 0
    const activeSemester = await prisma.semester.findFirst({
      where: { is_active: true },
    })
    const semesterId = activeSemester?.id || 0

    for (const task of impendingTasks) {
      // Get all students enrolled in this course
      const enrollments = await prisma.enrollment.findMany({
        where: {
          mata_kuliah_id: task.mata_kuliah_id,
          semester_id: semesterId,
        },
        include: {
          mahasiswa: true,
        },
      })

      const students = enrollments.map((e) => e.mahasiswa)

      for (const student of students) {
        // Check if student already submitted for this task
        const submission = await prisma.submission.findFirst({
          where: {
            tugas_id: task.id,
            mahasiswa_id: student.id,
          },
        })

        // If not submitted, prepare reminder notification
        if (!submission) {
          // Prevent double notification spam by checking history within last 12 hours
          const alreadyNotified = await prisma.notifikasi.findFirst({
            where: {
              user_id: student.nim,
              user_role: "mahasiswa",
              judul: `⏰ PENGINGAT DEADLINE: H-1 Pengumpulan Tugas`,
              pesan: {
                contains: task.judul,
              },
              created_at: {
                gte: new Date(now.getTime() - 12 * 60 * 60 * 1000), // last 12 hours
              },
            },
          })

          if (!alreadyNotified) {
            const dateStr = new Date(task.deadline).toLocaleString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            const judul = `⏰ PENGINGAT DEADLINE: H-1 Pengumpulan Tugas`
            const pesan = `Halo *${student.nama}*,\n` +
              `Tugas kuliah Anda: *${task.judul}* pada mata kuliah *${task.mata_kuliah.nama}* akan segera ditutup dalam waktu 24 jam.\n\n` +
              `• *Tenggat Waktu*: ${dateStr}\n\n` +
              `Mohon segera selesaikan dan unggah berkas jawaban Anda melalui portal SIMATU sebelum tenggat waktu berakhir agar terhindar dari keterlambatan. Tetap semangat! 💪`

            await createNotification({
              userId: student.nim,
              userRole: "mahasiswa",
              judul,
              pesan,
            })

            remindersSent++
          }
        }
      }
    }

    return NextResponse.json({
      message: "Impending task deadline reminder cron executed successfully.",
      tasksProcessed: impendingTasks.length,
      remindersSent,
    })

  } catch (error: any) {
    console.error("Error running deadline reminder cron job:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
