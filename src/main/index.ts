import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  Notification,
  type MessageBoxOptions
} from 'electron'
import { existsSync, readFileSync } from 'fs'
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

function getUpdaterPackageVersion(): string {
  try {
    const packageJsonPath = join(app.getAppPath(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    return (
      packageJson.dependencies?.['electron-updater'] ??
      packageJson.devDependencies?.['electron-updater'] ??
      'unknown'
    )
  } catch {
    return 'unknown'
  }
}

function hasAutoUpdateConfiguration(): boolean {
  return existsSync(join(process.resourcesPath, 'app-update.yml'))
}

function getFriendlyUpdateMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('app-update.yml') || message.includes('ENOENT')) {
    return 'Auto-update works only from an installed published release, not from the unpacked build.'
  }

  return message
}

function getWindowForDialogs(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow
  }

  return BrowserWindow.getAllWindows().find((window) => !window.isDestroyed()) ?? null
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

function showUpdateNotification(title: string, body: string): void {
  if (!Notification.isSupported()) return

  new Notification({
    title,
    body,
    icon: join(__dirname, '../../resources/icon.png')
  }).show()
}

function revealWindowForUpdatePrompt(window: BrowserWindow | null): BrowserWindow | null {
  if (!window || window.isDestroyed()) return null

  if (window.isMinimized()) {
    window.restore()
  }

  if (!window.isVisible()) {
    window.show()
  }

  window.focus()
  return window
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

  if (!hasAutoUpdateConfiguration()) {
    setUpdateStatus({
      stage: 'dev',
      message:
        'Auto-update works only from an installed published release, not from the unpacked build.'
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

    showUpdateNotification(
      'Update available',
      `Version ${info.version} is downloading in the background.`
    )

    const window = revealWindowForUpdatePrompt(getWindowForDialogs())
    const dialogOptions: MessageBoxOptions = {
      type: 'info',
      title: 'Update available',
      message: `Version ${info.version} is available.`,
      detail: 'The update is downloading in the background and will be ready to install soon.'
    }

    if (window) {
      void dialog.showMessageBox(window, dialogOptions)
      return
    }

    void dialog.showMessageBox(dialogOptions)
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    setUpdateStatus({
      stage: 'downloading',
      percent: Math.round(progress.percent),
      message: `Downloading version ${updateStatus.nextVersion ?? ''}`.trim()
    })
  })

  autoUpdater.on('update-downloaded', async (info) => {
    setUpdateStatus({
      stage: 'downloaded',
      nextVersion: info.version,
      percent: 100,
      message: `Version ${info.version} is ready. Restart the app to install it.`
    })

    showUpdateNotification(
      'Update ready to install',
      `Version ${info.version} has finished downloading. Restart the app to install it.`
    )

    const window = revealWindowForUpdatePrompt(getWindowForDialogs())
    const dialogOptions: MessageBoxOptions = {
      type: 'info',
      title: 'Update ready',
      message: `Version ${info.version} has been downloaded.`,
      detail:
        'Restart now to install the update, or choose Later to install it after closing the app.',
      buttons: ['Restart now', 'Later'],
      cancelId: 1,
      defaultId: 0
    }
    const result = window
      ? await dialog.showMessageBox(window, dialogOptions)
      : await dialog.showMessageBox(dialogOptions)

    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
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
      stage: hasAutoUpdateConfiguration() ? 'error' : 'dev',
      percent: undefined,
      message: error == null ? 'The update check failed.' : getFriendlyUpdateMessage(error)
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
  electronApp.setAppUserModelId('com.rachel.tasktodo')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('app:get-version', () => app.getVersion())
  ipcMain.handle('app:get-updater-version', () => getUpdaterPackageVersion())
  ipcMain.handle('updater:get-status', () => updateStatus)
  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged || !hasAutoUpdateConfiguration()) {
      setUpdateStatus({
        stage: 'dev',
        message:
          'Install a published release build before running the auto-update workflow.'
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
