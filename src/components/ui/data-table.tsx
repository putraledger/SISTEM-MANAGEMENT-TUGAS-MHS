"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Column<T> {
  header: string
  accessor: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  rowKey: (item: T) => string | number
  title?: string
  actionButton?: React.ReactNode
}

export function DataTable<T>({
  data,
  columns,
  className,
  rowKey,
  title,
  actionButton,
}: DataTableProps<T>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "rounded-xl border border-slate-100 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900/50",
        className
      )}
    >
      {/* Title / Action Header */}
      {(title || actionButton) && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/10">
          {title && (
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
              {title}
            </h4>
          )}
          {actionButton && <div>{actionButton}</div>}
        </div>
      )}

      {/* Responsive Table Wrapper */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider dark:border-slate-800/80 dark:bg-slate-950/20">
              {columns.map((col, idx) => (
                <th key={idx} className={cn("px-5 py-3.5", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-xs text-slate-400 font-medium"
                >
                  Belum ada data tersedia.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={rowKey(item)}
                  className="hover:bg-slate-50/50 even:bg-slate-50/10 transition-colors duration-200 dark:hover:bg-slate-800/20 dark:even:bg-slate-950/5"
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={cn("px-5 py-3.5 align-middle", col.className)}>
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
