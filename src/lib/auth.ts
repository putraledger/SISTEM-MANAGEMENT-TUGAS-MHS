import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Identifier", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password || !credentials?.role) {
          throw new Error("Mohon lengkapi semua bidang login.")
        }

        const { identifier, password, role } = credentials

        if (role === "admin") {
          const admin = await prisma.admin.findUnique({
            where: { username: identifier },
          })
          if (!admin) throw new Error("Akun Admin tidak ditemukan.")
          
          const isPasswordValid = await bcrypt.compare(password, admin.password)
          if (!isPasswordValid) throw new Error("Password salah.")

          return {
            id: admin.id.toString(),
            name: admin.username,
            email: null,
            role: "admin" as const,
            identifier: admin.username,
          }
        }

        if (role === "dosen") {
          const dosen = await prisma.dosen.findUnique({
            where: { nidn: identifier },
            include: { prodi: true },
          })
          if (!dosen) throw new Error("NIDN Dosen tidak terdaftar.")
          if (!dosen.status_aktif) throw new Error("Akun Dosen dinonaktifkan.")

          const isPasswordValid = await bcrypt.compare(password, dosen.password)
          if (!isPasswordValid) throw new Error("Password salah.")

          return {
            id: dosen.id.toString(),
            name: dosen.nama,
            email: null,
            role: "dosen" as const,
            identifier: dosen.nidn,
            prodi: dosen.prodi?.nama,
          }
        }

        if (role === "mahasiswa") {
          const mahasiswa = await prisma.mahasiswa.findUnique({
            where: { nim: identifier },
            include: { prodi: true },
          })
          if (!mahasiswa) throw new Error("NIM Mahasiswa tidak terdaftar.")
          if (!mahasiswa.status_aktif) throw new Error("Akun Mahasiswa dinonaktifkan.")

          const isPasswordValid = await bcrypt.compare(password, mahasiswa.password)
          if (!isPasswordValid) throw new Error("Password salah.")

          return {
            id: mahasiswa.id.toString(),
            name: mahasiswa.nama,
            email: null,
            role: "mahasiswa" as const,
            identifier: mahasiswa.nim,
            prodi: mahasiswa.prodi?.nama,
          }
        }

        throw new Error("Role tidak valid.")
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.identifier = user.identifier
        token.prodi = user.prodi
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.identifier = token.identifier
        session.user.prodi = token.prodi
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  secret: process.env.NEXTAUTH_SECRET,
}
