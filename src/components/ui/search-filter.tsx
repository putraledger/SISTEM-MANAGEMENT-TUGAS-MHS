"use client"

import React from "react"
import { Search, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = "Cari data...",
  className = "",
  ...props
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs pl-9 pr-8 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 focus:border-blue-500 focus:bg-white dark:bg-slate-900/20 dark:border-slate-800 dark:focus:border-blue-500 dark:focus:bg-slate-900/40 transition-all duration-200 text-slate-800 dark:text-slate-100"
        {...props}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChangeText("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="size-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

interface FilterOption {
  label: string
  value: string
}

interface FilterDropdownProps {
  label?: string
  options: FilterOption[]
  selectedValue: string
  onChangeValue: (value: string) => void
  className?: string
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selectedValue,
  onChangeValue,
  className = "",
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === selectedValue) || options[0]

  return (
    <div ref={dropdownRef} className={`relative flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs text-slate-400 font-semibold whitespace-nowrap hidden sm:inline-block">
          {label}:
        </span>
      )}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-2.5 text-xs py-1.5 pl-3.5 pr-3 border border-slate-200 rounded-lg outline-none bg-white hover:bg-slate-50 active:scale-[0.98] dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-900/80 cursor-pointer transition-all duration-150 text-slate-700 dark:text-slate-200 font-medium"
        >
          <span className="truncate max-w-[140px]">{selectedOption?.label}</span>
          <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-100 dark:bg-slate-950 dark:border-slate-900 rounded-lg shadow-lg py-1 z-55 overflow-hidden"
            >
              {options.map((opt) => {
                const isSelected = opt.value === selectedValue
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChangeValue(opt.value)
                      setIsOpen(false)
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/20 dark:text-blue-400"
                        : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
