"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"
import { DashboardCard } from "./dashboard-card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeType = "neutral",
  className,
}: StatCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-emerald-600 dark:text-emerald-400"
      case "negative":
        return "text-rose-600 dark:text-rose-400"
      default:
        return "text-slate-500 dark:text-slate-400"
    }
  }

  return (
    <DashboardCard className={cn("flex items-center justify-between p-5 bg-white border-slate-100", className)}>
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {label}
        </span>
        <h4 className="text-2xl font-bold text-slate-800 tracking-tight dark:text-white">
          {value}
        </h4>
        {change && (
          <span className={cn("text-[10px] font-medium block mt-0.5", getChangeColor())}>
            {change}
          </span>
        )}
      </div>
      <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
        <Icon className="size-5" />
      </div>
    </DashboardCard>
  )
}
