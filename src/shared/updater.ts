export type UpdateStage =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error'
  | 'dev'

export type UpdateStatus = {
  stage: UpdateStage
  currentVersion: string
  nextVersion?: string
  message: string
  percent?: number
}
