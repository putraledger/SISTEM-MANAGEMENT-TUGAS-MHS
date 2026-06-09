import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Sesi tidak valid atau telah berakhir." }, { status: 401 })
  }

  try {
    const { oldPassword, newPassword } = await req.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Harap isi kata sandi lama dan baru." }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Kata sandi baru minimal 6 karakter." }, { status: 400 })
    }

    const userId = parseInt(session.user.id, 10)
    const role = session.user.role

    if (role === "admin") {
      const admin = await prisma.admin.findUnique({ where: { id: userId } })
      if (!admin) return NextResponse.json({ error: "Akun admin tidak ditemukan." }, { status: 404 })

      const isMatch = await bcrypt.compare(oldPassword, admin.password)
      if (!isMatch) return NextResponse.json({ error: "Kata sandi lama salah." }, { status: 400 })

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await prisma.admin.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })
    } else if (role === "dosen") {
      const dosen = await prisma.dosen.findUnique({ where: { id: userId } })
      if (!dosen) return NextResponse.json({ error: "Akun dosen tidak ditemukan." }, { status: 404 })

      const isMatch = await bcrypt.compare(oldPassword, dosen.password)
      if (!isMatch) return NextResponse.json({ error: "Kata sandi lama salah." }, { status: 400 })

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await prisma.dosen.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })
    } else if (role === "mahasiswa") {
      const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id: userId } })
      if (!mahasiswa) return NextResponse.json({ error: "Akun mahasiswa tidak ditemukan." }, { status: 404 })

      const isMatch = await bcrypt.compare(oldPassword, mahasiswa.password)
      if (!isMatch) return NextResponse.json({ error: "Kata sandi lama salah." }, { status: 400 })

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await prisma.mahasiswa.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })
    } else {
      return NextResponse.json({ error: "Role tidak dikenali." }, { status: 400 })
    }

    return NextResponse.json({ message: "Kata sandi berhasil diperbarui." })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 })
  }
}
