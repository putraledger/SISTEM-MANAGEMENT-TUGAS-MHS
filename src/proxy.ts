import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // 1. Jika belum login dan mencoba mengakses rute terproteksi
  const isAuthPage = pathname.startsWith("/login")
  const isProtectedPage =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dosen") ||
    pathname.startsWith("/mahasiswa") ||
    pathname === "/"

  if (!token) {
    if (isProtectedPage && !isAuthPage) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  // 2. Jika sudah login dan mengakses halaman login
  if (isAuthPage) {
    // Redirect ke dashboard masing-masing role
    if (token.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    if (token.role === "dosen") {
      return NextResponse.redirect(new URL("/dosen", request.url))
    }
    if (token.role === "mahasiswa") {
      return NextResponse.redirect(new URL("/mahasiswa", request.url))
    }
  }

  // 3. Jika mengakses root "/"
  if (pathname === "/") {
    if (token.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    if (token.role === "dosen") {
      return NextResponse.redirect(new URL("/dosen", request.url))
    }
    if (token.role === "mahasiswa") {
      return NextResponse.redirect(new URL("/mahasiswa", request.url))
    }
  }

  // 4. Proteksi rute spesifik role
  if (pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (pathname.startsWith("/dosen") && token.role !== "dosen") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (pathname.startsWith("/mahasiswa") && token.role !== "mahasiswa") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dosen/:path*", "/mahasiswa/:path*", "/login", "/"],
}
