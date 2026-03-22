import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater, type UpdateInfo, type ProgressInfo } from 'electron-updater'
import type { UpdateStatus } from '../shared/updater'

let mainWindow: BrowserWindow | null = null

let updateStatus: UpdateStatus = {
  stage: 'idle',
  currentVersion: app.getVersion(),
  message: 'Waiting to check for updates.'
}

function broadcastUpdateStatus(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('updater:status-changed', updateStatus)
}

function setUpdateStatus(next: Partial<UpdateStatus>): void {
  updateStatus = {
    ...updateStatus,
    ...next,
    currentVersion: app.getVersion()
  }

  broadcastUpdateStatus()
}

function formatUpdateMessage(info: UpdateInfo): string {
  const publishedAt = info.releaseDate ? new Date(info.releaseDate).toLocaleString() : null

  if (!publishedAt) {
    return `Version ${info.version} is available and downloading now.`
  }

  return `Version ${info.version} is available and was published on ${publishedAt}.`
}

function setupAutoUpdater(): void {
  if (!app.isPackaged) {
    setUpdateStatus({
      stage: 'dev',
      message:
        'Auto-update checks run in the packaged app. Build an installer to test the full flow.'
    })
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    setUpdateStatus({
      stage: 'checking',
      nextVersion: undefined,
      percent: undefined,
      message: 'Checking GitHub Releases for a newer version.'
    })
  })

  autoUpdater.on('update-available', (info) => {
    setUpdateStatus({
      stage: 'available',
      nextVersion: info.version,
      message: formatUpdateMessage(info)
    })
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    setUpdateStatus({
      stage: 'downloading',
      percent: Math.round(progress.percent),
      message: `Downloading version ${updateStatus.nextVersion ?? ''}`.trim()
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    setUpdateStatus({
      stage: 'downloaded',
      nextVersion: info.version,
      percent: 100,
      message: `Version ${info.version} is ready. Restart the app to install it.`
    })
  })

  autoUpdater.on('update-not-available', () => {
    setUpdateStatus({
      stage: 'up-to-date',
      nextVersion: undefined,
      percent: undefined,
      message: `You are on the latest version (${app.getVersion()}).`
    })
  })

  autoUpdater.on('error', (error) => {
    setUpdateStatus({
      stage: 'error',
      percent: undefined,
      message: error == null ? 'The update check failed.' : error.message
    })
  })

  void autoUpdater.checkForUpdates()
}

function createWindow(): void {
  const icon = join(__dirname, '../../resources/icon.png')

  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    title: 'Task To Do',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow = window

  // macOS only
  if (process.platform === 'darwin' && window.setWindowButtonVisibility) {
    window.setWindowButtonVisibility(true)
  }

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.on('did-finish-load', () => {
    broadcastUpdateStatus()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('app:get-version', () => app.getVersion())
  ipcMain.handle('updater:get-status', () => updateStatus)
  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged) {
      setUpdateStatus({
        stage: 'dev',
        message: 'Package the app before running the auto-update workflow.'
      })
      return updateStatus
    }

    await autoUpdater.checkForUpdates()
    return updateStatus
  })
  ipcMain.handle('updater:install', () => {
    if (updateStatus.stage === 'downloaded') {
      autoUpdater.quitAndInstall()
    }
  })

  createWindow()
  setupAutoUpdater()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
