import fs from "fs"
import path from "path"

const settingsFilePath = path.join(process.cwd(), "src/lib/settings.json")

export interface AppSettings {
  appName: string
  logoUrl: string
}

export function getSettings(): AppSettings {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const fileContent = fs.readFileSync(settingsFilePath, "utf8")
      return JSON.parse(fileContent)
    }
  } catch (error) {
    console.error("Error reading settings.json:", error)
  }
  return {
    appName: "SIMATU",
    logoUrl: "",
  }
}

export function updateSettings(newSettings: Partial<AppSettings>): AppSettings {
  const currentSettings = getSettings()
  const updated = { ...currentSettings, ...newSettings }
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(updated, null, 2), "utf8")
  } catch (error) {
    console.error("Error writing settings.json:", error)
  }
  return updated
}
