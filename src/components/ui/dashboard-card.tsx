"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface DashboardCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  animateHover?: boolean
  animateScroll?: boolean
}

export function DashboardCard({
  children,
  className,
  animateHover = true,
  animateScroll = true,
  ...props
}: DashboardCardProps) {
  const hoverProps = animateHover
    ? {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98 },
        transition: { type: "spring" as const, stiffness: 400, damping: 25 },
      }
    : {}

  const scrollProps = animateScroll
    ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-50px" },
        transition: { duration: 0.4, ease: "easeOut" as const },
      }
    : {}

  return (
    <motion.div
      {...hoverProps}
      {...scrollProps}
      className={cn(
        "rounded-xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:shadow-slate-900/20",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
