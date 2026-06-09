import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ count: 0 })
    }

    const userId = session.user.identifier
    const userRole = session.user.role

    const count = await prisma.notifikasi.count({
      where: {
        user_id: userId,
        user_role: userRole,
        is_read: false,
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error fetching unread notifications count:", error)
    return NextResponse.json({ count: 0 })
  }
}
