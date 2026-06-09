import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { generateGradesExcel, generateGradesPDF, generateTranscriptPDF } from "@/lib/export"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")
    const format = searchParams.get("format")

    if (role === "dosen") {
      if (session.user.role !== "dosen") {
        return new NextResponse("Forbidden", { status: 403 })
      }

      const mataKuliahIdStr = searchParams.get("mata_kuliah_id")
      const semesterIdStr = searchParams.get("semester_id")

      if (!mataKuliahIdStr || !semesterIdStr) {
        return new NextResponse("Bad Request: mata_kuliah_id and semester_id are required", { status: 400 })
      }

      const mataKuliahId = parseInt(mataKuliahIdStr, 10)
      const semesterId = parseInt(semesterIdStr, 10)

      // Get Lecturer profile
      const dosen = await prisma.dosen.findUnique({
        where: { nidn: session.user.identifier },
      })
      if (!dosen) {
        return new NextResponse("Dosen tidak ditemukan", { status: 404 })
      }

      // Check if lecturer teaches this course
      const pengampu = await prisma.dosen_pengampu.findFirst({
        where: { dosen_id: dosen.id, mata_kuliah_id: mataKuliahId },
      })
      if (!pengampu) {
        return new NextResponse("Forbidden: Anda bukan pengampu mata kuliah ini", { status: 403 })
      }

      const mk = await prisma.mata_kuliah.findUnique({
        where: { id: mataKuliahId },
      })
      if (!mk) {
        return new NextResponse("Mata kuliah tidak ditemukan", { status: 404 })
      }

      // Fetch tasks in this semester
      const tasks = await prisma.tugas.findMany({
        where: { mata_kuliah_id: mataKuliahId, semester_id: semesterId },
        orderBy: { deadline: "asc" },
      })

      // Fetch enrolled students
      const enrolls = await prisma.enrollment.findMany({
        where: { mata_kuliah_id: mataKuliahId, semester_id: semesterId },
        include: {
          mahasiswa: {
            include: {
              submissions: {
                where: {
                  tugas: {
                    mata_kuliah_id: mataKuliahId,
                    semester_id: semesterId,
                  },
                },
                include: { nilai: true },
              },
            },
          },
        },
      })

      const students = enrolls.map((e) => {
        const grades: Record<number, number | null> = {}
        const feedbacks: Record<number, string | null> = {}

        tasks.forEach((t) => {
          const sub = e.mahasiswa.submissions.find((s) => s.tugas_id === t.id)
          grades[t.id] = sub?.nilai?.nilai_angka ?? null
          feedbacks[t.id] = sub?.nilai?.feedback ?? null
        })

        return {
          nim: e.mahasiswa.nim,
          nama: e.mahasiswa.nama,
          grades,
          feedbacks,
        }
      })

      if (format === "xlsx") {
        const buffer = generateGradesExcel(mk.nama, tasks, students)
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="Nilai_${mk.kode}_${mk.nama.replace(/\s+/g, "_")}.xlsx"`,
          },
        })
      } else if (format === "pdf") {
        const buffer = await generateGradesPDF(mk.nama, tasks, students)
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Nilai_${mk.kode}_${mk.nama.replace(/\s+/g, "_")}.pdf"`,
          },
        })
      } else {
        return new NextResponse("Unsupported format", { status: 400 })
      }
    } else if (role === "mahasiswa") {
      if (session.user.role !== "mahasiswa") {
        return new NextResponse("Forbidden", { status: 403 })
      }

      const mhs = await prisma.mahasiswa.findUnique({
        where: { nim: session.user.identifier },
        include: { prodi: true },
      })
      if (!mhs) {
        return new NextResponse("Mahasiswa tidak ditemukan", { status: 404 })
      }

      // Fetch all enrollments across all semesters
      const enrollments = await prisma.enrollment.findMany({
        where: { mahasiswa_id: mhs.id },
        include: {
          semester: true,
          mata_kuliah: {
            include: {
              tugas: {
                include: {
                  submissions: {
                    where: { mahasiswa_id: mhs.id },
                    include: { nilai: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { semester: { created_at: "asc" } },
      })

      const semestersMap: Record<string, { semesterNama: string; courses: any[] }> = {}
      for (const en of enrollments) {
        const semName = en.semester.nama
        if (!semestersMap[semName]) {
          semestersMap[semName] = {
            semesterNama: semName,
            courses: [],
          }
        }

        const tasksInSemester = en.mata_kuliah.tugas.filter((t) => t.semester_id === en.semester_id)
        const tasksCount = tasksInSemester.length

        let completedTasksCount = 0
        let totalGradeSum = 0
        let gradedTasksCount = 0

        tasksInSemester.forEach((t) => {
          const sub = t.submissions[0]
          if (sub) {
            completedTasksCount++
            if (sub.nilai?.nilai_angka !== null && sub.nilai?.nilai_angka !== undefined) {
              totalGradeSum += sub.nilai.nilai_angka
              gradedTasksCount++
            }
          }
        })

        const averageGrade = gradedTasksCount > 0 ? Math.round((totalGradeSum / gradedTasksCount) * 100) / 100 : null

        semestersMap[semName].courses.push({
          kode: en.mata_kuliah.kode,
          nama: en.mata_kuliah.nama,
          sks: en.mata_kuliah.sks,
          completedTasksCount,
          tasksCount,
          averageGrade,
        })
      }

      const semestersData = Object.values(semestersMap)
      const prodiName = mhs.prodi?.nama || "Ilmu Komputer"

      if (format === "pdf") {
        const buffer = await generateTranscriptPDF(mhs.nama, mhs.nim, prodiName, semestersData)
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Transkrip_${mhs.nim}.pdf"`,
          },
        })
      } else {
        return new NextResponse("Unsupported format for Mahasiswa (PDF only)", { status: 400 })
      }
    } else {
      return new NextResponse("Invalid role specified", { status: 400 })
    }
  } catch (err: any) {
    console.error("Gagal melakukan ekspor data nilai:", err)
    return new NextResponse(`Internal Server Error: ${err.message || ""}`, { status: 500 })
  }
}
