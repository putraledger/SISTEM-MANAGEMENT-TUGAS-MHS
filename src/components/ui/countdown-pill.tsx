"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface CountdownPillProps {
  deadline: string | Date
}

export function CountdownPill({ deadline }: CountdownPillProps) {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [status, setStatus] = useState<"urgent" | "normal" | "overdue">("normal")

  useEffect(() => {
    const deadlineDate = new Date(deadline)

    function updateTimer() {
      const now = new Date()
      const diff = deadlineDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Tenggat Terlewati")
        setStatus("overdue")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`Tinggal ${days}h ${hours}j ${minutes}m`)
        setStatus("normal")
      } else {
        setTimeLeft(`Sisa ${hours}j ${minutes}m ${seconds}s`)
        setStatus("urgent")
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [deadline])

  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-rose-100 bg-rose-50 text-[10px] font-bold text-rose-650 dark:bg-rose-950/20 dark:border-rose-900/20 dark:text-rose-400">
        <AlertTriangle className="size-3 shrink-0" />
        {timeLeft}
      </span>
    )
  }

  if (status === "urgent") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-100 bg-amber-50 text-[10px] font-bold text-amber-650 animate-pulse dark:bg-amber-950/20 dark:border-amber-900/20 dark:text-amber-400">
        <Clock className="size-3 shrink-0" />
        {timeLeft}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-[10px] font-bold text-blue-650 dark:bg-blue-950/20 dark:border-blue-900/20 dark:text-blue-400">
      <Clock className="size-3 shrink-0" />
      {timeLeft}
    </span>
  )
}
