export async function uploadFile(file: File, userId: string, tugasId: string | number) {
  const fileExt = file.name.split('.').pop() || ''
  // Folder structure: submissions/task_${tugasId}/${userId}_${Date.now()}.${fileExt}
  const fileName = `${userId}_${Date.now()}.${fileExt}`
  const filePath = `submissions/task_${tugasId}/${fileName}`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', filePath)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Gagal mengunggah file')
  }

  return response.json() as Promise<{
    success: boolean
    url: string
    path: string
  }>
}
