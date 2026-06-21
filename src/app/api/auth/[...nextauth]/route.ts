import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

// NextAuth handler configured with authOptions from @/lib/auth
// containing session callback mappings for session.user.id, role, and username.
const handler = NextAuth(authOptions)

export async function GET(req: Request, { params }: { params: Promise<{ nextauth: string[] }> }) {
  console.log("[NextAuth GET] wrapper called!")
  const resolvedParams = await params
  console.log("[NextAuth GET] resolvedParams:", resolvedParams)
  try {
    const res = await handler(req, { params: resolvedParams })
    console.log("[NextAuth GET] response status:", res.status)
    return res
  } catch (err) {
    console.error("[NextAuth GET] error:", err)
    throw err
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ nextauth: string[] }> }) {
  console.log("[NextAuth POST] wrapper called!")
  const resolvedParams = await params
  console.log("[NextAuth POST] resolvedParams:", resolvedParams)
  try {
    const res = await handler(req, { params: resolvedParams })
    console.log("[NextAuth POST] response status:", res.status)
    return res
  } catch (err) {
    console.error("[NextAuth POST] error:", err)
    throw err
  }
}
export { authOptions }
