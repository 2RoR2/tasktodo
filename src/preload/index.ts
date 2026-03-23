import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { UpdateStatus } from '../shared/updater'

// Custom APIs for renderer
const api = {
  getAppVersion: (): Promise<string> => electronAPI.ipcRenderer.invoke('app:get-version'),
  getUpdaterVersion: (): Promise<string> =>
    electronAPI.ipcRenderer.invoke('app:get-updater-version'),
  getUpdateStatus: (): Promise<UpdateStatus> =>
    electronAPI.ipcRenderer.invoke('updater:get-status'),
  checkForUpdates: (): Promise<UpdateStatus> => electronAPI.ipcRenderer.invoke('updater:check'),
  installUpdate: (): Promise<void> => electronAPI.ipcRenderer.invoke('updater:install'),
  onUpdateStatusChanged: (callback: (status: UpdateStatus) => void): (() => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, status: UpdateStatus): void =>
      callback(status)

    electronAPI.ipcRenderer.on('updater:status-changed', subscription)

    return (): void => {
      electronAPI.ipcRenderer.removeListener('updater:status-changed', subscription)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
