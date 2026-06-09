import * as XLSX from "xlsx"
import React from "react"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"

// PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#333333",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1e3a8a", // navy/blue-900
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#475569", // slate-600
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 10,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
    backgroundColor: "#f1f5f9",
    padding: 6,
    fontWeight: "bold",
  },
  tableCol: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
    padding: 6,
  },
  textHeader: {
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 7.5,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  }
})

// Grades PDF Layout Component
const GradesDoc = ({ courseName, tasks, students }: { courseName: string; tasks: any[]; students: any[] }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Evaluasi & Nilai Mahasiswa</Text>
          <Text style={styles.subtitle}>Mata Kuliah: {courseName}</Text>
        </View>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: "25%" }]}><Text style={styles.textHeader}>NIM & Mahasiswa</Text></View>
            <View style={[styles.tableColHeader, { width: "35%" }]}><Text style={styles.textHeader}>Judul Tugas</Text></View>
            <View style={[styles.tableColHeader, { width: "15%" }]}><Text style={styles.textHeader}>Nilai</Text></View>
            <View style={[styles.tableColHeader, { width: "25%" }]}><Text style={styles.textHeader}>Catatan Umpan Balik</Text></View>
          </View>

          {/* Rows */}
          {students.map((student) => 
            tasks.map((task, idx) => {
              const grade = student.grades[task.id]
              const gradeStr = grade !== null && grade !== undefined ? `${grade} / 100` : "Belum Dinilai"
              const feedbackStr = student.feedbacks[task.id] || "-"
              
              return (
                <View key={`${student.nim}-${task.id}`} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text>{idx === 0 ? `${student.nim}\n${student.nama}` : ""}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "35%" }]}>
                    <Text>{task.judul}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "15%" }]}>
                    <Text>{gradeStr}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={{ fontSize: 7.5 }}>{feedbackStr}</Text>
                  </View>
                </View>
              )
            })
          )}
        </View>

        <Text style={styles.footer}>SIMATU Akademik Portal - Laporan ini diterbitkan secara resmi melalui sistem SIMATU.</Text>
      </Page>
    </Document>
  )
}

// Transcript PDF Layout Component
const TranscriptDoc = ({ studentName, studentNim, prodi, semestersData }: { studentName: string; studentNim: string; prodi: string; semestersData: any[] }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Transkrip Nilai Mandiri Mahasiswa</Text>
          <Text style={styles.subtitle}>Portal Informasi Akademik Terpadu SIMATU</Text>
        </View>

        {/* Student Profile Info */}
        <View style={{ marginBottom: 15, flexDirection: "row", justifyContent: "space-between", fontSize: 9.5 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontWeight: "bold" }}>Nama Lengkap : {studentName}</Text>
            <Text>NIM : {studentNim}</Text>
          </View>
          <View style={{ textAlign: "right", gap: 2 }}>
            <Text>Program Studi : {prodi}</Text>
            <Text>Tanggal Cetak : {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</Text>
          </View>
        </View>

        {semestersData.map((sem) => (
          <View key={sem.semesterNama} style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#1e3a8a", marginBottom: 5 }}>
              {sem.semesterNama}
            </Text>
            
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <View style={[styles.tableColHeader, { width: "15%" }]}><Text style={styles.textHeader}>Kode MK</Text></View>
                <View style={[styles.tableColHeader, { width: "45%" }]}><Text style={styles.textHeader}>Nama Mata Kuliah</Text></View>
                <View style={[styles.tableColHeader, { width: "10%" }]}><Text style={styles.textHeader}>SKS</Text></View>
                <View style={[styles.tableColHeader, { width: "15%" }]}><Text style={styles.textHeader}>Tugas Kumpul</Text></View>
                <View style={[styles.tableColHeader, { width: "15%" }]}><Text style={styles.textHeader}>Nilai Rata-rata</Text></View>
              </View>

              {/* Table Rows */}
              {sem.courses.map((course: any) => (
                <View key={course.kode} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: "15%" }]}><Text>{course.kode}</Text></View>
                  <View style={[styles.tableCol, { width: "45%" }]}><Text>{course.nama}</Text></View>
                  <View style={[styles.tableCol, { width: "10%" }]}><Text>{course.sks}</Text></View>
                  <View style={[styles.tableCol, { width: "15%" }]}><Text>{course.completedTasksCount} / {course.tasksCount}</Text></View>
                  <View style={[styles.tableCol, { width: "15%" }]}>
                    <Text>{course.averageGrade !== null ? `${course.averageGrade} / 100` : "-"}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>Dokumen ini diterbitkan oleh sistem portal akademik SIMATU secara mandiri dan sah sebagai informasi hasil studi mahasiswa.</Text>
      </Page>
    </Document>
  )
}

// Generate Excel Buffer
export function generateGradesExcel(courseName: string, tasks: any[], students: any[]): Buffer {
  const rows = students.map((student) => {
    const row: any = {
      "NIM": student.nim,
      "Nama Mahasiswa": student.nama,
    }
    
    let sum = 0
    let count = 0
    tasks.forEach((task) => {
      const grade = student.grades[task.id]
      row[task.judul] = grade !== null && grade !== undefined ? grade : "-"
      if (grade !== null && grade !== undefined) {
        sum += grade
        count++
      }
    })
    
    row["Rata-rata Skor"] = count > 0 ? Math.round((sum / count) * 100) / 100 : "-"
    return row
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, "Daftar Nilai")
  
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return buffer
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: any[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

// Generate Grades PDF Buffer
export async function generateGradesPDF(courseName: string, tasks: any[], students: any[]): Promise<Buffer> {
  const doc = React.createElement(GradesDoc, { courseName, tasks, students })
  const stream = await pdf(doc as any).toBuffer()
  return await streamToBuffer(stream)
}

// Generate Transcript PDF Buffer
export async function generateTranscriptPDF(studentName: string, studentNim: string, prodi: string, semestersData: any[]): Promise<Buffer> {
  const doc = React.createElement(TranscriptDoc, { studentName, studentNim, prodi, semestersData })
  const stream = await pdf(doc as any).toBuffer()
  return await streamToBuffer(stream)
}
