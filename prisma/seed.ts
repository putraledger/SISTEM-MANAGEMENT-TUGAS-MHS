import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Cleaning database tables before seeding...")

  // Delete in reverse order of dependencies to avoid foreign key constraints
  await prisma.nilai.deleteMany({})
  await prisma.submission.deleteMany({})
  await prisma.tugas.deleteMany({})
  await prisma.enrollment.deleteMany({})
  await prisma.semester.deleteMany({})
  await prisma.dosen_pengampu.deleteMany({})
  await prisma.mata_kuliah.deleteMany({})
  await prisma.mahasiswa.deleteMany({})
  await prisma.dosen.deleteMany({})
  await prisma.prodi.deleteMany({})
  await prisma.fakultas.deleteMany({})
  await prisma.admin.deleteMany({ where: { NOT: { username: "admin" } } }) // Preserve original admin
  await prisma.pengumuman.deleteMany({})
  await prisma.audit_log.deleteMany({})
  await prisma.notifikasi.deleteMany({})

  console.log("Database tables cleaned. Seeding database with master testing data...")

  // Hash passwords
  const hashedAdminPassword = await bcrypt.hash("admin123", 10)
  const hashedDosenPassword = await bcrypt.hash("dosen123", 10)
  const hashedMhsPassword = await bcrypt.hash("mahasiswa123", 10)

  // 1. Ensure Main Admin exists
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedAdminPassword,
    },
  })

  // 2. Seed Fakultas
  console.log("Seeding Fakultas...")
  const fik = await prisma.fakultas.create({ data: { id: 1, nama: "Fakultas Ilmu Komputer" } })
  const fe = await prisma.fakultas.create({ data: { id: 2, nama: "Fakultas Ekonomi" } })
  const ft = await prisma.fakultas.create({ data: { id: 3, nama: "Fakultas Teknik" } })

  // 3. Seed Prodi
  console.log("Seeding Program Studi...")
  const inf = await prisma.prodi.create({ data: { id: 1, nama: "Informatika", fakultas_id: fik.id } })
  const si = await prisma.prodi.create({ data: { id: 2, nama: "Sistem Informasi", fakultas_id: fik.id } })
  const akt = await prisma.prodi.create({ data: { id: 3, nama: "Akuntansi", fakultas_id: fe.id } })
  const ts = await prisma.prodi.create({ data: { id: 4, nama: "Teknik Sipil", fakultas_id: ft.id } })

  // 4. Seed Semesters
  console.log("Seeding Semesters...")
  const semestersData = [
    { id: 1, nama: "Ganjil 2023/2024", is_active: false },
    { id: 2, nama: "Genap 2023/2024", is_active: false },
    { id: 3, nama: "Ganjil 2024/2025", is_active: false },
    { id: 4, nama: "Genap 2024/2025", is_active: true }, // AKTIF
  ]

  const semestersMap: Record<number, any> = {}
  for (const sem of semestersData) {
    const semObj = await prisma.semester.create({ data: sem })
    semestersMap[sem.id] = semObj
  }

  const activeSemester = semestersMap[4]

  // 5. Seed Dosen
  console.log("Seeding Dosen accounts...")
  const dosenData = [
    { nidn: "12345678901", nama: "Dr. Budi Santoso, M.Kom.", prodi_id: inf.id },
    { nidn: "22345678901", nama: "Prof. Siti Aminah, M.T.", prodi_id: si.id },
    { nidn: "32345678901", nama: "Dr. Agus Salim, M.E.", prodi_id: akt.id },
    { nidn: "42345678901", nama: "Ir. Rudi Hartono, M.T.", prodi_id: ts.id },
  ]

  const dosensMap: Record<string, any> = {}
  for (const d of dosenData) {
    const dObj = await prisma.dosen.create({
      data: {
        nidn: d.nidn,
        nama: d.nama,
        password: hashedDosenPassword,
        prodi_id: d.prodi_id,
        status_aktif: true,
      },
    })
    dosensMap[d.nidn] = dObj
  }

  // 6. Seed Mahasiswa
  console.log("Seeding Mahasiswa accounts...")
  const mhsData = [
    { nim: "1234567890", nama: "Andi Wijaya", prodi_id: inf.id, semester_aktif: 2, angkatan: 2024 },
    { nim: "1234567891", nama: "Budi Santoso", prodi_id: inf.id, semester_aktif: 4, angkatan: 2023 },
    { nim: "1234567892", nama: "Citra Dewi", prodi_id: inf.id, semester_aktif: 6, angkatan: 2022 },
    { nim: "1234567893", nama: "Dian Pratama", prodi_id: inf.id, semester_aktif: 8, angkatan: 2021 },
    { nim: "2234567890", nama: "Eka Fitriani", prodi_id: si.id, semester_aktif: 2, angkatan: 2024 },
    { nim: "2234567891", nama: "Fajar Nugroho", prodi_id: si.id, semester_aktif: 4, angkatan: 2023 },
    { nim: "3234567890", nama: "Gina Lestari", prodi_id: akt.id, semester_aktif: 6, angkatan: 2022 },
    { nim: "4234567890", nama: "Hendra Kurniawan", prodi_id: ts.id, semester_aktif: 8, angkatan: 2021 },
  ]

  const studentsMap: Record<string, any> = {}
  for (const m of mhsData) {
    const mObj = await prisma.mahasiswa.create({
      data: {
        nim: m.nim,
        nama: m.nama,
        password: hashedMhsPassword,
        prodi_id: m.prodi_id,
        semester_aktif: m.semester_aktif,
        angkatan: m.angkatan,
        status_aktif: true,
        status_kelulusan: "belum",
      },
    })
    studentsMap[m.nim] = mObj
  }

  // 7. Seed Mata Kuliah (minimal 2 MK per semester 2, 4, 6, 8 untuk setiap prodi)
  console.log("Seeding Mata Kuliah...")
  const mkData = [
    // Informatika (Prodi 1)
    { kode: "INF-201", nama: "Pemrograman Web", sks: 3, semester: 2, prodi_id: inf.id, dosen_nidn: "12345678901" },
    { kode: "INF-202", nama: "Basis Data", sks: 3, semester: 2, prodi_id: inf.id, dosen_nidn: "12345678901" },
    { kode: "INF-401", nama: "Rekayasa Perangkat Lunak", sks: 3, semester: 4, prodi_id: inf.id, dosen_nidn: "12345678901" },
    { kode: "INF-402", nama: "Jaringan Komputer", sks: 3, semester: 4, prodi_id: inf.id, dosen_nidn: "12345678901" },
    { kode: "INF-601", nama: "Kecerdasan Buatan", sks: 3, semester: 6, prodi_id: inf.id, dosen_nidn: "12345678901" },
    { kode: "INF-602", nama: "Data Mining", sks: 3, semester: 6, prodi_id: inf.id, dosen_nidn: "12345678901" },
    { kode: "INF-801", nama: "Tugas Akhir", sks: 4, semester: 8, prodi_id: inf.id, dosen_nidn: "12345678901" },
    { kode: "INF-802", nama: "Etika Profesi IT", sks: 2, semester: 8, prodi_id: inf.id, dosen_nidn: "12345678901" },

    // Sistem Informasi (Prodi 2)
    { kode: "SI-201", nama: "Pengantar Sistem Informasi", sks: 3, semester: 2, prodi_id: si.id, dosen_nidn: "22345678901" },
    { kode: "SI-202", nama: "Algoritma Pemrograman", sks: 3, semester: 2, prodi_id: si.id, dosen_nidn: "22345678901" },
    { kode: "SI-401", nama: "Analisis & Perancangan Sistem", sks: 3, semester: 4, prodi_id: si.id, dosen_nidn: "22345678901" },
    { kode: "SI-402", nama: "Manajemen Basis Data", sks: 3, semester: 4, prodi_id: si.id, dosen_nidn: "22345678901" },
    { kode: "SI-601", nama: "E-Business", sks: 3, semester: 6, prodi_id: si.id, dosen_nidn: "22345678901" },
    { kode: "SI-602", nama: "Keamanan Informasi", sks: 3, semester: 6, prodi_id: si.id, dosen_nidn: "22345678901" },
    { kode: "SI-801", nama: "Skripsi SI", sks: 4, semester: 8, prodi_id: si.id, dosen_nidn: "22345678901" },
    { kode: "SI-802", nama: "Manajemen Proyek SI", sks: 2, semester: 8, prodi_id: si.id, dosen_nidn: "22345678901" },

    // Akuntansi (Prodi 3)
    { kode: "AKT-201", nama: "Pengantar Akuntansi II", sks: 3, semester: 2, prodi_id: akt.id, dosen_nidn: "32345678901" },
    { kode: "AKT-202", nama: "Hukum Bisnis", sks: 3, semester: 2, prodi_id: akt.id, dosen_nidn: "32345678901" },
    { kode: "AKT-401", nama: "Akuntansi Keuangan Menengah II", sks: 3, semester: 4, prodi_id: akt.id, dosen_nidn: "32345678901" },
    { kode: "AKT-402", nama: "Akuntansi Biaya", sks: 3, semester: 4, prodi_id: akt.id, dosen_nidn: "32345678901" },
    { kode: "AKT-601", nama: "Auditing II", sks: 3, semester: 6, prodi_id: akt.id, dosen_nidn: "32345678901" },
    { kode: "AKT-602", nama: "Akuntansi Sektor Publik", sks: 3, semester: 6, prodi_id: akt.id, dosen_nidn: "32345678901" },
    { kode: "AKT-801", nama: "Skripsi Akuntansi", sks: 4, semester: 8, prodi_id: akt.id, dosen_nidn: "32345678901" },
    { kode: "AKT-802", nama: "Teori Akuntansi", sks: 3, semester: 8, prodi_id: akt.id, dosen_nidn: "32345678901" },

    // Teknik Sipil (Prodi 4)
    { kode: "TS-201", nama: "Mekanika Bahan", sks: 3, semester: 2, prodi_id: ts.id, dosen_nidn: "42345678901" },
    { kode: "TS-202", nama: "Menggambar Rekayasa", sks: 2, semester: 2, prodi_id: ts.id, dosen_nidn: "42345678901" },
    { kode: "TS-401", nama: "Mekanika Tanah", sks: 3, semester: 4, prodi_id: ts.id, dosen_nidn: "42345678901" },
    { kode: "TS-402", nama: "Rekayasa Hidrologi", sks: 3, semester: 4, prodi_id: ts.id, dosen_nidn: "42345678901" },
    { kode: "TS-601", nama: "Struktur Baja II", sks: 3, semester: 6, prodi_id: ts.id, dosen_nidn: "42345678901" },
    { kode: "TS-602", nama: "Struktur Beton Bertulang II", sks: 3, semester: 6, prodi_id: ts.id, dosen_nidn: "42345678901" },
    { kode: "TS-801", nama: "Tugas Akhir Sipil", sks: 4, semester: 8, prodi_id: ts.id, dosen_nidn: "42345678901" },
    { kode: "TS-802", nama: "Manajemen Konstruksi II", sks: 3, semester: 8, prodi_id: ts.id, dosen_nidn: "42345678901" },
  ]

  const courseMap: Record<string, any> = {}
  for (const mk of mkData) {
    const courseObj = await prisma.mata_kuliah.create({
      data: {
        kode: mk.kode,
        nama: mk.nama,
        sks: mk.sks,
        semester: mk.semester,
        prodi_id: mk.prodi_id,
        status_aktif: true,
      },
    })
    courseMap[mk.kode] = courseObj

    // Assign Dosen Pengampu
    const dosenObj = dosensMap[mk.dosen_nidn]
    if (dosenObj) {
      await prisma.dosen_pengampu.create({
        data: {
          dosen_id: dosenObj.id,
          mata_kuliah_id: courseObj.id,
        },
      })
    }
  }

  // 8. Seed Enrollment (mahasiswa semester_aktif terdaftar di MK yang semester akademiknya sama di semester aktif Genap 2024/2025)
  console.log("Enrolling students into active classes...")
  const enrollments: any[] = []
  for (const student of mhsData) {
    const studentObj = studentsMap[student.nim]
    const matchingMKs = mkData.filter(
      (mk) => mk.prodi_id === student.prodi_id && mk.semester === student.semester_aktif
    )

    for (const mk of matchingMKs) {
      const courseObj = courseMap[mk.kode]
      const enObj = await prisma.enrollment.create({
        data: {
          mahasiswa_id: studentObj.id,
          mata_kuliah_id: courseObj.id,
          semester_id: activeSemester.id,
        },
      })
      enrollments.push({ ...enObj, nim: student.nim, kode: mk.kode })
    }
  }

  // 9. Seed Tugas (2 tugas per mata kuliah di semester aktif)
  console.log("Creating active tasks...")
  const now = new Date()
  const futureDeadline = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
  const pastDeadline = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago

  const tasksMap: Record<string, any[]> = {}
  for (const mk of mkData) {
    const courseObj = courseMap[mk.kode]
    tasksMap[mk.kode] = []

    const t1 = await prisma.tugas.create({
      data: {
        judul: `Tugas Pembelajaran Lanjut - ${courseObj.nama}`,
        deskripsi: `Panduan latihan dan analisis mendalam untuk topik bahasan ${courseObj.nama}.`,
        deadline: futureDeadline,
        status: "publish",
        mata_kuliah_id: courseObj.id,
        semester_id: activeSemester.id,
      },
    })
    tasksMap[mk.kode].push(t1)

    const t2 = await prisma.tugas.create({
      data: {
        judul: `Tugas Pemahaman Awal - ${courseObj.nama}`,
        deskripsi: `Latihan pengerjaan kuis ringkas mengenai materi pengantar ${courseObj.nama}.`,
        deadline: pastDeadline,
        status: "publish",
        mata_kuliah_id: courseObj.id,
        semester_id: activeSemester.id,
      },
    })
    tasksMap[mk.kode].push(t2)
  }

  // 10. Seed Submissions & Grades (Minimal 50% mahasiswa mengumpulkan tugas tertentu, beri nilai random 60-100)
  console.log("Generating submissions and grades...")
  for (const en of enrollments) {
    // 100% of students submit the past task (which satisfies "Minimal 50% mahasiswa")
    const courseTasks = tasksMap[en.kode]
    const pastTask = courseTasks.find((t) => t.deadline.getTime() < now.getTime())

    if (pastTask) {
      const waktuSubmit = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) // submitted 6 days ago (before deadline)
      const subObj = await prisma.submission.create({
        data: {
          tugas_id: pastTask.id,
          mahasiswa_id: en.mahasiswa_id,
          file_url: "https://example.com/attachments/tugas_mhs.pdf",
          catatan: "Jawaban Tugas Pemahaman Awal. Mohon diperiksa.",
          waktu_submit: waktuSubmit,
          is_late: false,
        },
      })

      // Generate random grade between 60 and 100
      const nilaiAngka = Math.floor(Math.random() * 41) + 60
      const isRevisi = Math.random() < 0.3 // 30% chance of revision
      await prisma.nilai.create({
        data: {
          submission_id: subObj.id,
          nilai_angka: nilaiAngka,
          feedback: nilaiAngka >= 80 ? "Kerja bagus, analisis sangat terstruktur." : "Cukup baik, harap perbaiki ulasan teori.",
          status_revisi: isRevisi ? "revisi" : "tidak",
        },
      })
    }
  }

  // 11. Notifications and logs
  await prisma.notifikasi.create({
    data: {
      user_id: "admin",
      user_role: "admin",
      judul: "Inisialisasi Sistem Selesai",
      pesan: "Database SIMATU telah berhasil dimuat dengan data akademik testing lengkap.",
      is_read: false,
    },
  })

  // 12. Reset sequences for Postgres autoincrement tables where IDs were manually set
  console.log("Resetting primary key sequences...")
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('semester', 'id'), coalesce(max(id), 0) + 1, false) FROM "semester"`)
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('fakultas', 'id'), coalesce(max(id), 0) + 1, false) FROM "fakultas"`)
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('prodi', 'id'), coalesce(max(id), 0) + 1, false) FROM "prodi"`)

  console.log("Database successfully seeded with comprehensive master dummy data!");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
