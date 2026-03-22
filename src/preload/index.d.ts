import { ElectronAPI } from '@electron-toolkit/preload'
import type { UpdateStatus } from '../shared/updater'

export type AppAPI = {
  getAppVersion: () => Promise<string>
  getUpdateStatus: () => Promise<UpdateStatus>
  checkForUpdates: () => Promise<UpdateStatus>
  installUpdate: () => Promise<void>
  onUpdateStatusChanged: (callback: (status: UpdateStatus) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
