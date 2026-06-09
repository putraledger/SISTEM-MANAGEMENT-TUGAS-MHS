import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import axios from "axios"
import { logAction } from "@/app/admin/actions"

export async function GET(req: NextRequest) {
  try {
    // 1. Get current logged-in user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.identifier
    const userRole = session.user.role

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ error: "Telegram Bot Token is not set" }, { status: 500 })
    }

    // 2. Poll Telegram for updates (getUpdates)
    // We try to get pending updates, process them, and acknowledge them
    const telegramUrl = `https://api.telegram.org/bot${botToken}/getUpdates`
    const response = await axios.get(telegramUrl, { timeout: 5000 }).catch((e) => {
      console.error("Error fetching updates from Telegram API:", e.message)
      return null
    })

    let processedCount = 0
    let highestUpdateId = -1

    if (response && response.data && response.data.ok) {
      const updates = response.data.result || []

      for (const update of updates) {
        if (update.update_id > highestUpdateId) {
          highestUpdateId = update.update_id
        }

        const message = update.message
        if (!message || !message.text) continue

        const text = message.text.trim()
        const chatId = String(message.chat.id)

        // Match /connect <TOKEN>
        const connectMatch = text.match(/\/connect\s+(\S+)/i)
        if (connectMatch) {
          const rawToken = connectMatch[1].trim().toUpperCase()

          // Check if this token exists in our DB
          const linkRequest = await prisma.telegram_link.findFirst({
            where: {
              token: rawToken,
              is_verified: false,
            },
          })

          if (linkRequest) {
            // Retrieve user name based on role
            let fullName = "User SIMATU"
            if (linkRequest.user_role === "mahasiswa") {
              const mhs = await prisma.mahasiswa.findUnique({
                where: { nim: linkRequest.user_id },
              })
              if (mhs) fullName = mhs.nama
            } else if (linkRequest.user_role === "dosen") {
              const dsn = await prisma.dosen.findUnique({
                where: { nidn: linkRequest.user_id },
              })
              if (dsn) fullName = dsn.nama
            }

            // Update the telegram_link in DB
            await prisma.telegram_link.update({
              where: { id: linkRequest.id },
              data: {
                chat_id: chatId,
                is_verified: true,
              },
            })

            // Log action to Audit Logs
            await logAction("LINK_TELEGRAM", `Menghubungkan akun ke bot Telegram Chat ID: ${chatId} Peran: ${linkRequest.user_role}`)

            // Send confirmation message to the user on Telegram
            const roleLabel = linkRequest.user_role === "mahasiswa" ? "Mahasiswa" : "Dosen"
            const successText = `🎉 *AKUN BERHASIL DIHUBUNGKAN!*\n\n` +
              `Halo *${fullName}*,\n` +
              `Akun SIMATU Anda telah sukses diverifikasi dan ditautkan dengan bot ini!\n\n` +
              `• *Nomor Induk*: ${linkRequest.user_id}\n` +
              `• *Peran*: ${roleLabel}\n` +
              `• *Chat ID*: \`${chatId}\`\n\n` +
              `Sekarang Anda akan menerima notifikasi instan untuk tugas kuliah baru, pembaruan nilai, catatan revisi, dan pengumuman penting langsung di Telegram ini. Terima kasih! ✨`

            await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              chat_id: chatId,
              text: successText,
              parse_mode: "Markdown",
            }).catch((sendErr) => {
              console.error("Error sending verification success to Telegram:", sendErr.message)
            })

            processedCount++
          }
        }
      }

      // 3. Acknowledge and clear updates by calling getUpdates with offset = highestUpdateId + 1
      if (highestUpdateId !== -1) {
        await axios.get(`${telegramUrl}?offset=${highestUpdateId + 1}`).catch((e) => {
          console.error("Error acknowledging updates from Telegram API:", e.message)
        })
      }
    }

    // 4. Fetch the verification status of the current user
    const userLink = await prisma.telegram_link.findFirst({
      where: {
        user_id: userId,
        user_role: userRole,
      },
    })

    return NextResponse.json({
      verified: userLink ? userLink.is_verified : false,
      chatId: userLink ? userLink.chat_id : null,
      token: userLink ? userLink.token : null,
      processed: processedCount,
    })

  } catch (error: any) {
    console.error("Error in Telegram Polling API Route:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
