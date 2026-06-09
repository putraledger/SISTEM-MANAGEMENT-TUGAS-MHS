"use client"

import React, { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { StatCard } from "@/components/ui/stat-card"
import { getReportingData, getProdis } from "../actions"
import { SearchInput, FilterDropdown } from "@/components/ui/search-filter"
import { FileSpreadsheet, FileText, BarChart3, TrendingUp, AlertTriangle, Users, BookOpen } from "lucide-react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"

// Safely import react-pdf only client-side
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"

// PDF Styling for report
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#f3f4f6",
    padding: 15,
    borderRadius: 8,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  statLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableRowHeader: {
    margin: "auto",
    flexDirection: "row",
    backgroundColor: "#1e3a8a",
  },
  tableColHeader: {
    width: "12.5%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
  },
  tableColHeaderLarge: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
  },
  tableCol: {
    width: "12.5%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
  },
  tableColLarge: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
  },
  tableTextHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tableText: {
    fontSize: 8,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
})

// PDF Document Component
const ReportPdfDocument = ({ data, stats, semester }: { data: any[]; stats: any; semester: string }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>SIMATU - Laporan Akademik</Text>
        <Text style={pdfStyles.subtitle}>Rekapitulasi Nilai & Statistik Pengumpulan - Semester {semester}</Text>
      </View>

      {/* Stats Summary */}
      <View style={pdfStyles.statsContainer}>
        <View style={pdfStyles.statBox}>
          <Text style={pdfStyles.statValue}>{stats.total}</Text>
          <Text style={pdfStyles.statLabel}>TOTAL SUBMISI</Text>
        </View>
        <View style={pdfStyles.statBox}>
          <Text style={pdfStyles.statValue}>{stats.tepatWaktu}</Text>
          <Text style={pdfStyles.statLabel}>TEPAT WAKTU</Text>
        </View>
        <View style={pdfStyles.statBox}>
          <Text style={pdfStyles.statValue}>{stats.terlambat}</Text>
          <Text style={pdfStyles.statLabel}>TERLAMBAT</Text>
        </View>
        <View style={pdfStyles.statBox}>
          <Text style={pdfStyles.statValue}>{stats.enrollmentCount}</Text>
          <Text style={pdfStyles.statLabel}>TOTAL ENROLLMENT</Text>
        </View>
      </View>

      {/* Table */}
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableRowHeader}>
          <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableTextHeader}>Kode MK</Text></View>
          <View style={pdfStyles.tableColHeaderLarge}><Text style={pdfStyles.tableTextHeader}>Mata Kuliah</Text></View>
          <View style={pdfStyles.tableColHeaderLarge}><Text style={pdfStyles.tableTextHeader}>Prodi</Text></View>
          <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableTextHeader}>SKS</Text></View>
          <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableTextHeader}>Mhs</Text></View>
          <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableTextHeader}>Tugas</Text></View>
          <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableTextHeader}>Submisi</Text></View>
          <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableTextHeader}>Rerata Nilai</Text></View>
        </View>

        {data.map((item) => (
          <View key={item.id} style={pdfStyles.tableRow}>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableText}>{item.kode}</Text></View>
            <View style={pdfStyles.tableColLarge}><Text style={pdfStyles.tableText}>{item.nama}</Text></View>
            <View style={pdfStyles.tableColLarge}><Text style={pdfStyles.tableText}>{item.prodi}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableText}>{item.sks} SKS</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableText}>{item.studentCount}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableText}>{item.tugasCount}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableText}>{item.totalSubmissions}</Text></View>
            <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableText}>{item.avgGrade !== null ? item.avgGrade : "N/A"}</Text></View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>SIMATU © 2026 - Laporan Akademik Resmi Tergenerasi Otomatis</Text>
      </View>
    </Page>
  </Document>
)

export default function ReportingPage() {
  const [data, setData] = useState<any | null>(null)
  const [prodis, setProdis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Search & Filter State
  const [search, setSearch] = useState("")
  const [prodiFilter, setProdiFilter] = useState("all")

  async function loadData() {
    setLoading(true)
    try {
      const res = await getReportingData()
      setData(res)
      const prds = await getProdis()
      setProdis(prds)
    } catch (err) {
      toast.error("Gagal memuat laporan data akademik")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    setIsMounted(true)
  }, [])

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="size-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  // Filter logic
  const filteredRekap = data.rekapMatakuliah.filter((item: any) => {
    const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase()) || item.kode.toLowerCase().includes(search.toLowerCase())
    const matchProdi = prodiFilter === "all" || item.prodi === prodiFilter
    return matchSearch && matchProdi
  })

  // Export to Excel handler
  const handleExportExcel = () => {
    const wsData = filteredRekap.map((item: any) => ({
      "Kode MK": item.kode,
      "Nama Mata Kuliah": item.nama,
      "Program Studi": item.prodi,
      "Bobot SKS": item.sks,
      "Jumlah Mahasiswa": item.studentCount,
      "Jumlah Tugas": item.tugasCount,
      "Total Submisi": item.totalSubmissions,
      "Submisi Tepat Waktu": item.onTimeSubmissions,
      "Submisi Terlambat": item.lateSubmissions,
      "Rata-rata Nilai": item.avgGrade !== null ? item.avgGrade : "Belum Dinilai",
    }))

    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Akademik")
    XLSX.writeFile(wb, `SIMATU_Laporan_Semester_${data.activeSemesterNama.replace(/\s+/g, "_")}.xlsx`)
    toast.success("Berhasil mengekspor data ke Excel!")
  }

  const columns = [
    {
      header: "Kode MK",
      accessor: (item: any) => <span className="font-bold text-blue-600 font-mono text-xs">{item.kode}</span>,
    },
    {
      header: "Mata Kuliah",
      accessor: (item: any) => <span className="font-semibold text-slate-800 dark:text-slate-200">{item.nama}</span>,
    },
    {
      header: "Prodi / SKS",
      accessor: (item: any) => (
        <span className="text-slate-500 font-medium">
          {item.prodi} ({item.sks} SKS)
        </span>
      ),
    },
    {
      header: "Jml Mahasiswa",
      accessor: (item: any) => <span className="text-slate-700 font-bold dark:text-slate-350">{item.studentCount} Mhs</span>,
    },
    {
      header: "Tugas / Submisi",
      accessor: (item: any) => (
        <span className="text-xs text-slate-450 font-medium">
          {item.tugasCount} Tugas ({item.totalSubmissions} Submisi)
        </span>
      ),
    },
    {
      header: "Kepatuhan Waktu",
      accessor: (item: any) => (
        <span className="text-[10px] text-emerald-650 font-bold dark:text-emerald-400">
          {item.onTimeSubmissions} Tepat / {item.lateSubmissions} Lambat
        </span>
      ),
    },
    {
      header: "Rerata Nilai",
      accessor: (item: any) => (
        <span className={`font-bold px-2 py-0.5 rounded text-xs ${
          item.avgGrade === null 
            ? "text-slate-400 italic bg-slate-50 border border-slate-100 dark:bg-slate-900/10 dark:border-slate-800"
            : item.avgGrade >= 80
            ? "text-emerald-600 bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/10"
            : item.avgGrade >= 60
            ? "text-blue-600 bg-blue-50 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/10"
            : "text-amber-600 bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/10"
        }`}>
          {item.avgGrade !== null ? item.avgGrade : "N/A"}
        </span>
      ),
    },
  ]

  const prodiFilterOptions = [
    { label: "Semua Prodi", value: "all" },
    ...prodis.map((p) => ({ label: p.nama, value: p.nama })),
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Title & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Laporan & Analitik Akademik
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-tight uppercase">
              REKAPITULASI NILAI DAN STATISTIK PENGUMPULAN SEMESTER AKTIF ({data.activeSemesterNama})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="text-xs bg-white border-slate-200 text-slate-650 hover:bg-slate-50 transition-colors active:scale-95 duration-150 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="size-4 mr-1.5 text-emerald-600" /> Export Excel
            </Button>
            {isMounted && (
              <PDFDownloadLink
                document={
                  <ReportPdfDocument
                    data={filteredRekap}
                    stats={data.submissionsStats}
                    semester={data.activeSemesterNama}
                  />
                }
                fileName={`SIMATU_Laporan_Semester_${data.activeSemesterNama.replace(/\s+/g, "_")}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Button
                    size="sm"
                    disabled={pdfLoading}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/25 active:scale-95 transition-transform cursor-pointer"
                  >
                    <FileText className="size-4 mr-1.5" /> {pdfLoading ? "Generating PDF..." : "Export PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </div>

        {/* Global Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Submisi Tugas"
            value={data.submissionsStats.total}
            icon={BarChart3}
            change="Jumlah pengumpulan tugas"
            changeType="neutral"
          />
          <StatCard
            label="Submisi Tepat Waktu"
            value={data.submissionsStats.tepatWaktu}
            icon={TrendingUp}
            change="Tepat sebelum deadline"
            changeType="positive"
          />
          <StatCard
            label="Submisi Terlambat"
            value={data.submissionsStats.terlambat}
            icon={AlertTriangle}
            change="Melebihi batas waktu"
            changeType={data.submissionsStats.terlambat > 0 ? "negative" : "neutral"}
          />
          <StatCard
            label="Total Enrollment Mahasiswa"
            value={data.submissionsStats.enrollmentCount}
            icon={Users}
            change="Relasi mahasiswa-kelas"
            changeType="positive"
          />
        </div>

        {/* Filters and Table Controls */}
        <DashboardCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-white border-slate-100" animateScroll={false}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari berdasarkan kode atau nama matakuliah..."
            className="md:w-80"
          />
          
          <div className="flex items-center gap-2">
            <FilterDropdown
              label="Program Studi"
              options={prodiFilterOptions}
              selectedValue={prodiFilter}
              onChangeValue={setProdiFilter}
            />
          </div>
        </DashboardCard>

        {/* Reporting Datatable */}
        <DataTable
          data={filteredRekap}
          columns={columns}
          rowKey={(item) => item.id}
          title="Rekapitulasi Nilai & Kepatuhan Batas Waktu per Matakuliah"
        />

      </div>
    </DashboardLayout>
  )
}
