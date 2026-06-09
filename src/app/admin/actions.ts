"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { getSettings, updateSettings as writeSettings, AppSettings } from "@/lib/settings"

// Helper to get logged-in user
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

// Helper to automatically log action to audit_log table
export async function logAction(action: string, detail?: string) {
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

// ==========================================
// 1. MAHASISWA ACTIONS
// ==========================================
export async function getMahasiswa(search?: string, prodi?: string, semesterAktif?: number) {
  return await prisma.mahasiswa.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { nim: { contains: search, mode: "insensitive" } },
                { nama: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        prodi && prodi !== "all" ? { prodi: { nama: prodi } } : {},
        semesterAktif && semesterAktif !== 0 ? { semester_aktif: semesterAktif } : {},
      ],
    },
    include: {
      prodi: true,
    },
    orderBy: { nim: "asc" },
  })
}

// Fetch all Faculties
export async function getFaculties() {
  return await prisma.fakultas.findMany({
    include: {
      prodis: true,
    },
    orderBy: { nama: "asc" },
  })
}

// Fetch all Study Programs
export async function getProdis() {
  return await prisma.prodi.findMany({
    include: {
      fakultas: true,
    },
    orderBy: { nama: "asc" },
  })
}

export async function upsertMahasiswa(data: {
  id?: number
  nim: string
  nama: string
  prodi_id: number
  semester_aktif: number
  angkatan: number
  status_aktif: boolean
}) {
  const isEdit = !!data.id
  let result

  const payload = {
    nim: data.nim,
    nama: data.nama,
    prodi_id: data.prodi_id,
    semester_aktif: data.semester_aktif,
    angkatan: data.angkatan,
    status_aktif: data.status_aktif,
  }

  if (isEdit) {
    result = await prisma.mahasiswa.update({
      where: { id: data.id },
      data: payload,
    })
    await logAction("UPDATE_MAHASISWA", `Mengubah mahasiswa NIM: ${data.nim}`)
  } else {
    // Generate default password (hashed)
    const hashedPassword = await bcrypt.hash("mhs123", 10)
    result = await prisma.mahasiswa.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
    })
    await logAction("CREATE_MAHASISWA", `Menambah mahasiswa NIM: ${data.nim}`)
  }

  revalidatePath("/admin/mahasiswa")
  return result
}

export async function deleteMahasiswa(id: number) {
  const mhs = await prisma.mahasiswa.findUnique({ where: { id } })
  if (mhs) {
    await prisma.mahasiswa.delete({ where: { id } })
    await logAction("DELETE_MAHASISWA", `Menghapus mahasiswa NIM: ${mhs.nim}`)
  }
  revalidatePath("/admin/mahasiswa")
  return { success: true }
}

export async function resetMahasiswaPassword(id: number) {
  const mhs = await prisma.mahasiswa.findUnique({ where: { id } })
  if (mhs) {
    const hashedPassword = await bcrypt.hash("mhs123", 10)
    await prisma.mahasiswa.update({
      where: { id },
      data: { password: hashedPassword },
    })
    await logAction("RESET_PASSWORD_MAHASISWA", `Reset password mahasiswa NIM: ${mhs.nim} ke mhs123`)
    return { success: true, message: `Password ${mhs.nama} telah berhasil direset ke mhs123` }
  }
  throw new Error("Mahasiswa tidak ditemukan")
}

export async function importMahasiswa(dataArray: Array<{ nim: string; nama: string; prodi: string; semester_aktif: number; angkatan: number }>) {
  const hashedPassword = await bcrypt.hash("mhs123", 10)
  let count = 0

  for (const item of dataArray) {
    const exists = await prisma.mahasiswa.findUnique({ where: { nim: item.nim } })
    if (!exists) {
      let prodiObj = await prisma.prodi.findFirst({
        where: { nama: { equals: item.prodi, mode: "insensitive" } },
      })
      if (!prodiObj) {
        prodiObj = await prisma.prodi.findFirst()
      }
      if (!prodiObj) {
        throw new Error(`Program studi "${item.prodi}" tidak ditemukan dan tidak ada prodi default.`)
      }

      await prisma.mahasiswa.create({
        data: {
          nim: item.nim,
          nama: item.nama,
          prodi_id: prodiObj.id,
          semester_aktif: item.semester_aktif,
          angkatan: item.angkatan,
          status_aktif: true,
          password: hashedPassword,
        },
      })
      count++
    }
  }

  await logAction("IMPORT_MAHASISWA", `Berhasil mengimpor ${count} mahasiswa dari spreadsheet`)
  revalidatePath("/admin/mahasiswa")
  return { success: true, count }
}

// ==========================================
// 2. DOSEN ACTIONS
// ==========================================
export async function getDosen(search?: string, prodi?: string) {
  return await prisma.dosen.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { nidn: { contains: search, mode: "insensitive" } },
                { nama: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        prodi && prodi !== "all" ? { prodi: { nama: prodi } } : {},
      ],
    },
    include: {
      prodi: true,
    },
    orderBy: { nidn: "asc" },
  })
}

export async function upsertDosen(data: {
  id?: number
  nidn: string
  nama: string
  prodi_id: number
  status_aktif: boolean
}) {
  const isEdit = !!data.id
  let result

  const payload = {
    nidn: data.nidn,
    nama: data.nama,
    prodi_id: data.prodi_id,
    status_aktif: data.status_aktif,
  }

  if (isEdit) {
    result = await prisma.dosen.update({
      where: { id: data.id },
      data: payload,
    })
    await logAction("UPDATE_DOSEN", `Mengubah dosen NIDN: ${data.nidn}`)
  } else {
    const hashedPassword = await bcrypt.hash("dosen123", 10)
    result = await prisma.dosen.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
    })
    await logAction("CREATE_DOSEN", `Menambah dosen NIDN: ${data.nidn}`)
  }

  revalidatePath("/admin/dosen")
  return result
}

export async function deleteDosen(id: number) {
  const dsn = await prisma.dosen.findUnique({ where: { id } })
  if (dsn) {
    await prisma.dosen.delete({ where: { id } })
    await logAction("DELETE_DOSEN", `Menghapus dosen NIDN: ${dsn.nidn}`)
  }
  revalidatePath("/admin/dosen")
  return { success: true }
}

export async function resetDosenPassword(id: number) {
  const dsn = await prisma.dosen.findUnique({ where: { id } })
  if (dsn) {
    const hashedPassword = await bcrypt.hash("dosen123", 10)
    await prisma.dosen.update({
      where: { id },
      data: { password: hashedPassword },
    })
    await logAction("RESET_PASSWORD_DOSEN", `Reset password dosen NIDN: ${dsn.nidn} ke dosen123`)
    return { success: true, message: `Password ${dsn.nama} telah berhasil direset ke dosen123` }
  }
  throw new Error("Dosen tidak ditemukan")
}

// ==========================================
// 3. ADMIN ACTIONS
// ==========================================
export async function getAdmins(search?: string) {
  return await prisma.admin.findMany({
    where: search
      ? { username: { contains: search, mode: "insensitive" } }
      : {},
    orderBy: { username: "asc" },
  })
}

export async function upsertAdmin(data: {
  id?: number
  username: string
  password?: string
}) {
  const isEdit = !!data.id
  let result

  if (isEdit) {
    const updateData: any = { username: data.username }
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }
    result = await prisma.admin.update({
      where: { id: data.id },
      data: updateData,
    })
    await logAction("UPDATE_ADMIN", `Mengubah admin username: ${data.username}`)
  } else {
    if (!data.password) throw new Error("Password wajib untuk admin baru")
    const hashedPassword = await bcrypt.hash(data.password, 10)
    result = await prisma.admin.create({
      data: {
        username: data.username,
        password: hashedPassword,
      },
    })
    await logAction("CREATE_ADMIN", `Menambah admin username: ${data.username}`)
  }

  revalidatePath("/admin/admins")
  return result
}

export async function deleteAdmin(id: number) {
  const adm = await prisma.admin.findUnique({ where: { id } })
  if (adm) {
    await prisma.admin.delete({ where: { id } })
    await logAction("DELETE_ADMIN", `Menghapus admin username: ${adm.username}`)
  }
  revalidatePath("/admin/admins")
  return { success: true }
}

// ==========================================
// 4. MATA KULIAH ACTIONS
// ==========================================
export async function getMataKuliah(search?: string, prodi?: string) {
  return await prisma.mata_kuliah.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { kode: { contains: search, mode: "insensitive" } },
                { nama: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        prodi && prodi !== "all" ? { prodi: { nama: prodi } } : {},
      ],
    },
    include: {
      prodi: true,
    },
    orderBy: { kode: "asc" },
  })
}

export async function upsertMataKuliah(data: {
  id?: number
  kode: string
  nama: string
  sks: number
  prodi_id: number
  semester: number
  status_aktif: boolean
}) {
  const isEdit = !!data.id
  let result

  const payload = {
    kode: data.kode,
    nama: data.nama,
    sks: data.sks,
    prodi_id: data.prodi_id,
    semester: data.semester,
    status_aktif: data.status_aktif,
  }

  if (isEdit) {
    result = await prisma.mata_kuliah.update({
      where: { id: data.id },
      data: payload,
    })
    await logAction("UPDATE_MATAKULIAH", `Mengubah mata kuliah: ${data.kode} - ${data.nama}`)
  } else {
    result = await prisma.mata_kuliah.create({
      data: payload,
    })
    await logAction("CREATE_MATAKULIAH", `Menambah mata kuliah: ${data.kode} - ${data.nama}`)
  }

  revalidatePath("/admin/mata-kuliah")
  return result
}

export async function deleteMataKuliah(id: number) {
  const mk = await prisma.mata_kuliah.findUnique({ where: { id } })
  if (mk) {
    await prisma.mata_kuliah.delete({ where: { id } })
    await logAction("DELETE_MATAKULIAH", `Menghapus mata kuliah: ${mk.kode}`)
  }
  revalidatePath("/admin/mata-kuliah")
  return { success: true }
}

// ==========================================
// 5. DOSEN PENGAMPU ACTIONS
// ==========================================
export async function getDosenPengampuList() {
  return await prisma.mata_kuliah.findMany({
    include: {
      prodi: true,
      dosen_pengampu: {
        include: {
          dosen: true,
        },
      },
    },
    orderBy: { kode: "asc" },
  })
}

export async function assignDosenPengampu(mataKuliahId: number, dosenIds: number[]) {
  // Delete existing relation
  await prisma.dosen_pengampu.deleteMany({
    where: { mata_kuliah_id: mataKuliahId },
  })

  // Insert new relation
  if (dosenIds.length > 0) {
    const data = dosenIds.map((dId) => ({
      mata_kuliah_id: mataKuliahId,
      dosen_id: dId,
    }))
    await prisma.dosen_pengampu.createMany({ data })
  }

  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  await logAction("ASSIGN_DOSEN_PENGAMPU", `Memetakan ${dosenIds.length} dosen pengampu ke MK: ${mk?.kode}`)
  revalidatePath("/admin/dosen-pengampu")
  return { success: true }
}

// ==========================================
// 6. ENROLLMENT ACTIONS
// ==========================================
export async function getEnrollmentList(mataKuliahId: number, semesterId: number) {
  return await prisma.enrollment.findMany({
    where: {
      mata_kuliah_id: mataKuliahId,
      semester_id: semesterId,
    },
    include: {
      mahasiswa: {
        include: {
          prodi: true,
        },
      },
    },
    orderBy: {
      mahasiswa: { nim: "asc" },
    },
  })
}

export async function enrollMahasiswa(mataKuliahId: number, semesterId: number, mahasiswaIds: number[]) {
  let count = 0
  for (const mId of mahasiswaIds) {
    const exists = await prisma.enrollment.findUnique({
      where: {
        mahasiswa_id_mata_kuliah_id_semester_id: {
          mahasiswa_id: mId,
          mata_kuliah_id: mataKuliahId,
          semester_id: semesterId,
        },
      },
    })
    if (!exists) {
      await prisma.enrollment.create({
        data: {
          mahasiswa_id: mId,
          mata_kuliah_id: mataKuliahId,
          semester_id: semesterId,
        },
      })
      count++
    }
  }

  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  await logAction("ENROLL_MAHASISWA", `Mendaftarkan ${count} mahasiswa ke MK: ${mk?.kode}`)
  revalidatePath("/admin/enrollment")
  return { success: true, count }
}

export async function unenrollMahasiswa(enrollmentId: number) {
  const en = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { mahasiswa: true, mata_kuliah: true },
  })
  if (en) {
    await prisma.enrollment.delete({ where: { id: enrollmentId } })
    await logAction("UNENROLL_MAHASISWA", `Membatalkan pendaftaran ${en.mahasiswa.nama} dari MK: ${en.mata_kuliah.kode}`)
  }
  revalidatePath("/admin/enrollment")
  return { success: true }
}

export async function importEnrollment(mataKuliahId: number, semesterId: number, nims: string[]) {
  let count = 0
  for (const nim of nims) {
    const mhs = await prisma.mahasiswa.findUnique({ where: { nim } })
    if (mhs) {
      const exists = await prisma.enrollment.findUnique({
        where: {
          mahasiswa_id_mata_kuliah_id_semester_id: {
            mahasiswa_id: mhs.id,
            mata_kuliah_id: mataKuliahId,
            semester_id: semesterId,
          },
        },
      })
      if (!exists) {
        await prisma.enrollment.create({
          data: {
            mahasiswa_id: mhs.id,
            mata_kuliah_id: mataKuliahId,
            semester_id: semesterId,
          },
        })
        count++
      }
    }
  }

  const mk = await prisma.mata_kuliah.findUnique({ where: { id: mataKuliahId } })
  await logAction("IMPORT_ENROLLMENT", `Mengimpor pendaftaran ${count} mahasiswa ke MK: ${mk?.kode}`)
  revalidatePath("/admin/enrollment")
  return { success: true, count }
}

// ==========================================
// 7. SEMESTER ACTIONS
// ==========================================
export async function getSemesters() {
  return await prisma.semester.findMany({
    orderBy: { created_at: "desc" },
  })
}

export async function createSemester(nama: string) {
  const sem = await prisma.semester.create({
    data: { nama, is_active: false },
  })
  await logAction("CREATE_SEMESTER", `Membuat semester baru: ${nama}`)
  revalidatePath("/admin/semester")
  return sem
}

export async function setActiveSemester(id: number) {
  // Turn off all other active semesters
  await prisma.semester.updateMany({
    where: { is_active: true },
    data: { is_active: false },
  })

  // Turn on selected semester
  const sem = await prisma.semester.update({
    where: { id },
    data: { is_active: true },
  })

  await logAction("SET_ACTIVE_SEMESTER", `Mengaktifkan semester: ${sem.nama}`)
  revalidatePath("/admin/semester")
  revalidatePath("/admin/enrollment")
  return sem
}

export async function migrateSemester(fromSemesterId: number, toSemesterId: number, migrateEnrollment: boolean) {
  // Find standard semester and target semester
  const fromSem = await prisma.semester.findUnique({ where: { id: fromSemesterId } })
  const toSem = await prisma.semester.findUnique({ where: { id: toSemesterId } })

  if (!fromSem || !toSem) {
    throw new Error("Semester asal atau semester tujuan tidak ditemukan.")
  }

  // Get active students
  const activeStudents = await prisma.mahasiswa.findMany({
    where: { status_aktif: true },
    include: { prodi: true },
  })

  // Get all active courses
  const activeCourses = await prisma.mata_kuliah.findMany({
    where: { status_aktif: true },
  })

  // Fetch all existing enrollments in target semester to do in-memory check
  const existingEnrollments = await prisma.enrollment.findMany({
    where: { semester_id: toSemesterId },
  })

  const warnings: string[] = []
  let studentsUpdated = 0
  let enrollmentsCreated = 0

  // Run everything inside a database transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    for (const student of activeStudents) {
      if (student.semester_aktif >= 14) {
        warnings.push(`Mahasiswa ${student.nama} (${student.nim}) sudah berada di semester akhir (14) dan tidak dinaikkan.`)
        continue
      }

      const newSemester = student.semester_aktif + 1

      // 1. Advance the student's active semester
      await tx.mahasiswa.update({
        where: { id: student.id },
        data: { semester_aktif: newSemester },
      })
      studentsUpdated++

      // 2. Perform enrollment migration if selected
      if (migrateEnrollment) {
        // Query active courses for this study program (prodi) and their new target semester
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
          // In-memory duplicate check
          const exists = existingEnrollments.some(
            (en) =>
              en.mahasiswa_id === student.id &&
              en.mata_kuliah_id === course.id
          )

          if (!exists) {
            await tx.enrollment.create({
              data: {
                mahasiswa_id: student.id,
                mata_kuliah_id: course.id,
                semester_id: toSemesterId,
              },
            })
            enrollmentsCreated++
          }
        }
      }
    }

    return { studentsUpdated, enrollmentsCreated }
  }, {
    maxWait: 15000,
    timeout: 30000
  })

  // Log action
  const detailMsg = `Migrasi dari ${fromSem.nama} ke ${toSem.nama}. Mahasiswa dinaikkan: ${result.studentsUpdated}, Enrollment baru: ${result.enrollmentsCreated}. Warning: ${warnings.length}`
  await logAction("MIGRATE_SEMESTER", detailMsg)

  revalidatePath("/admin/semester")
  revalidatePath("/admin/mahasiswa")
  revalidatePath("/admin/enrollment")

  return {
    success: true,
    studentsUpdated: result.studentsUpdated,
    enrollmentsCreated: result.enrollmentsCreated,
    warnings,
  }
}

// ==========================================
// 8. PENGUMUMAN ACTIONS
// ==========================================
export async function getPengumuman() {
  return await prisma.pengumuman.findMany({
    orderBy: { created_at: "desc" },
  })
}

export async function createPengumuman(judul: string, isi: string, target: string) {
  const result = await prisma.pengumuman.create({
    data: {
      judul,
      isi,
      target,
      created_by: "admin",
    },
  })

  await logAction("CREATE_PENGUMUMAN", `Membuat pengumuman: "${judul}" untuk target: ${target}`)
  revalidatePath("/admin/pengumuman")
  return result
}

export async function deletePengumuman(id: number) {
  const ann = await prisma.pengumuman.findUnique({ where: { id } })
  if (ann) {
    await prisma.pengumuman.delete({ where: { id } })
    await logAction("DELETE_PENGUMUMAN", `Menghapus pengumuman: "${ann.judul}"`)
  }
  revalidatePath("/admin/pengumuman")
  return { success: true }
}

// ==========================================
// 9. AUDIT LOGS
// ==========================================
export async function getAuditLogs() {
  return await prisma.audit_log.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
  })
}

// ==========================================
// 10. APP SETTINGS ACTIONS
// ==========================================
export async function getAppSettings(): Promise<AppSettings> {
  return getSettings()
}

export async function updateAppSettings(data: { appName: string; logoUrl: string }) {
  const updated = writeSettings(data)
  await logAction("UPDATE_SETTINGS", `Mengubah pengaturan aplikasi menjadi Nama: ${data.appName}`)
  return updated
}

// ==========================================
// 11. DASHBOARD ANALYTICS ACTIONS
// ==========================================
export async function getDashboardStats() {
  // Get active semester
  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })

  if (!activeSemester) {
    return {
      totalMahasiswa: 0,
      totalDosen: 0,
      totalMataKuliah: 0,
      totalTugasAktif: 0,
      activeSemesterNama: "Tidak ada semester aktif",
      chartData: [
        { tanggal: "24 Mei", TepatWaktu: 0, Terlambat: 0 },
      ],
    }
  }

  // Total unique students enrolled in the active semester
  const uniqueStudents = await prisma.enrollment.groupBy({
    by: ["mahasiswa_id"],
    where: { semester_id: activeSemester.id },
  })
  const totalMahasiswa = uniqueStudents.length

  // Total mata kuliah that have enrollments in this semester
  const uniqueCourses = await prisma.enrollment.groupBy({
    by: ["mata_kuliah_id"],
    where: { semester_id: activeSemester.id },
  })
  const activeCourseIds = uniqueCourses.map((c) => c.mata_kuliah_id)
  const totalMataKuliah = activeCourseIds.length

  // Total unique lecturers teaching these active courses
  let totalDosen = 0
  if (activeCourseIds.length > 0) {
    const uniqueLecturers = await prisma.dosen_pengampu.groupBy({
      by: ["dosen_id"],
      where: { mata_kuliah_id: { in: activeCourseIds } },
    })
    totalDosen = uniqueLecturers.length
  }

  // Total published tasks in the active semester
  const totalTugasAktif = await prisma.tugas.count({
    where: {
      semester_id: activeSemester.id,
      status: "publish",
    },
  })

  // Get submission stats only for the active semester tasks
  const submissions = await prisma.submission.findMany({
    where: {
      tugas: {
        semester_id: activeSemester.id,
      },
    },
    select: {
      waktu_submit: true,
      is_late: true,
    },
  })

  // Group submissions by day/month for chart
  const collectedMap: Record<string, { tanggal: string; TepatWaktu: number; Terlambat: number }> = {}
  
  submissions.forEach((sub) => {
    const dateStr = sub.waktu_submit.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    })
    if (!collectedMap[dateStr]) {
      collectedMap[dateStr] = { tanggal: dateStr, TepatWaktu: 0, Terlambat: 0 }
    }
    if (sub.is_late) {
      collectedMap[dateStr].Terlambat += 1
    } else {
      collectedMap[dateStr].TepatWaktu += 1
    }
  })

  const chartData = Object.values(collectedMap).slice(-7) // last 7 submission dates

  return {
    totalMahasiswa,
    totalDosen,
    totalMataKuliah,
    totalTugasAktif,
    activeSemesterNama: activeSemester.nama,
    chartData: chartData.length > 0 ? chartData : [
      { tanggal: "24 Mei", TepatWaktu: 12, Terlambat: 2 },
      { tanggal: "25 Mei", TepatWaktu: 18, Terlambat: 4 },
      { tanggal: "26 Mei", TepatWaktu: 15, Terlambat: 1 },
      { tanggal: "27 Mei", TepatWaktu: 24, Terlambat: 5 },
      { tanggal: "28 Mei", TepatWaktu: 30, Terlambat: 3 },
      { tanggal: "29 Mei", TepatWaktu: 20, Terlambat: 8 },
      { tanggal: "30 Mei", TepatWaktu: 22, Terlambat: 2 },
    ],
  }
}

// ==========================================
// 12. FAKULTAS & PRODI CRUD ACTIONS
// ==========================================
export async function upsertFakultas(data: { id?: number; nama: string }) {
  const isEdit = !!data.id
  let result
  if (isEdit) {
    result = await prisma.fakultas.update({
      where: { id: data.id },
      data: { nama: data.nama },
    })
    await logAction("UPDATE_FAKULTAS", `Mengubah fakultas: ${data.nama}`)
  } else {
    result = await prisma.fakultas.create({
      data: { nama: data.nama },
    })
    await logAction("CREATE_FAKULTAS", `Menambah fakultas: ${data.nama}`)
  }
  revalidatePath("/admin/fakultas")
  return result
}

export async function deleteFakultas(id: number) {
  const fkl = await prisma.fakultas.findUnique({ where: { id } })
  if (fkl) {
    await prisma.fakultas.delete({ where: { id } })
    await logAction("DELETE_FAKULTAS", `Menghapus fakultas: ${fkl.nama}`)
  }
  revalidatePath("/admin/fakultas")
  return { success: true }
}

export async function upsertProdi(data: { id?: number; nama: string; fakultas_id: number }) {
  const isEdit = !!data.id
  let result
  if (isEdit) {
    result = await prisma.prodi.update({
      where: { id: data.id },
      data: {
        nama: data.nama,
        fakultas_id: data.fakultas_id,
      },
    })
    await logAction("UPDATE_PRODI", `Mengubah prodi: ${data.nama}`)
  } else {
    result = await prisma.prodi.create({
      data: {
        nama: data.nama,
        fakultas_id: data.fakultas_id,
      },
    })
    await logAction("CREATE_PRODI", `Menambah prodi: ${data.nama}`)
  }
  revalidatePath("/admin/fakultas")
  return result
}

export async function deleteProdi(id: number) {
  const prd = await prisma.prodi.findUnique({ where: { id } })
  if (prd) {
    await prisma.prodi.delete({ where: { id } })
    await logAction("DELETE_PRODI", `Menghapus prodi: ${prd.nama}`)
  }
  revalidatePath("/admin/fakultas")
  return { success: true }
}

export async function getReportingData() {
  const activeSemester = await prisma.semester.findFirst({
    where: { is_active: true },
  })
  
  if (!activeSemester) {
    return {
      activeSemesterNama: "Tidak ada semester aktif",
      rekapMatakuliah: [],
      submissionsStats: { total: 0, tepatWaktu: 0, terlambat: 0, enrollmentCount: 0 },
    }
  }

  // Rekap matakuliah in active semester
  const courses = await prisma.mata_kuliah.findMany({
    include: {
      prodi: true,
      enrollments: {
        where: { semester_id: activeSemester.id },
      },
      tugas: {
        where: { semester_id: activeSemester.id },
        include: {
          submissions: {
            include: {
              nilai: true,
            },
          },
        },
      },
    },
    orderBy: { kode: "asc" },
  })

  const rekapMatakuliah = courses.map((mk) => {
    // Total submissions
    let totalGrades = 0
    let gradesCount = 0
    let totalSubmissions = 0
    let lateSubmissions = 0
    let onTimeSubmissions = 0

    mk.tugas.forEach((t) => {
      totalSubmissions += t.submissions.length
      t.submissions.forEach((sub) => {
        if (sub.is_late) {
          lateSubmissions++
        } else {
          onTimeSubmissions++
        }
        if (sub.nilai && sub.nilai.nilai_angka !== null) {
          totalGrades += sub.nilai.nilai_angka
          gradesCount++
        }
      })
    })

    const avgGrade = gradesCount > 0 ? parseFloat((totalGrades / gradesCount).toFixed(2)) : null

    return {
      id: mk.id,
      kode: mk.kode,
      nama: mk.nama,
      sks: mk.sks,
      prodi: mk.prodi?.nama || "",
      studentCount: mk.enrollments.length,
      tugasCount: mk.tugas.length,
      totalSubmissions,
      lateSubmissions,
      onTimeSubmissions,
      avgGrade,
    }
  })

  // Global submission stats for active semester
  const totalSubmissions = await prisma.submission.count({
    where: {
      tugas: { semester_id: activeSemester.id },
    },
  })

  const lateSubmissions = await prisma.submission.count({
    where: {
      tugas: { semester_id: activeSemester.id },
      is_late: true,
    },
  })

  const onTimeSubmissions = totalSubmissions - lateSubmissions

  const totalEnrollments = await prisma.enrollment.count({
    where: { semester_id: activeSemester.id },
  })

  return {
    activeSemesterNama: activeSemester.nama,
    rekapMatakuliah,
    submissionsStats: {
      total: totalSubmissions,
      tepatWaktu: onTimeSubmissions,
      terlambat: lateSubmissions,
      enrollmentCount: totalEnrollments,
    },
  }
}

export async function getActiveMahasiswaCount() {
  return await prisma.mahasiswa.count({
    where: { status_aktif: true },
  })
}
