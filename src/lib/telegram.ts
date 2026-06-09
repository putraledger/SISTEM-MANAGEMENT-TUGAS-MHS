import { prisma } from "./prisma"
import axios from "axios"

/**
 * Send a Markdown message to a Telegram chat ID
 */
export async function sendTelegram(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.log("Telegram Bot Token is not set. Skipping notification.")
    return false
  }

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    })
    return true
  } catch (err) {
    console.error(`Failed to send Telegram notification to chat ${chatId}:`, err)
    return false
  }
}

interface NotificationInput {
  userId: string       // nim / nidn / username
  userRole: string     // mahasiswa / dosen / admin
  judul: string
  pesan: string
}

/**
 * Log a notification in the database, and automatically dispatch a Telegram
 * message if the recipient has verified their Telegram account.
 */
export async function createNotification({ userId, userRole, judul, pesan }: NotificationInput) {
  try {
    // 1. Save to DB history
    const dbNotif = await prisma.notifikasi.create({
      data: {
        user_id: userId,
        user_role: userRole,
        judul,
        pesan,
        is_read: false,
      },
    })

    // 2. Fetch active Telegram link
    const link = await prisma.telegram_link.findFirst({
      where: {
        user_id: userId,
        user_role: userRole,
        is_verified: true,
      },
    })

    // 3. Dispatch Telegram if verified link exists
    if (link) {
      const formattedText = `🔔 *${judul}*\n\n${pesan}`
      await sendTelegram(link.chat_id, formattedText)
    }

    return dbNotif
  } catch (error) {
    console.error(`Error in createNotification for ${userId} (${userRole}):`, error)
    throw error
  }
}
