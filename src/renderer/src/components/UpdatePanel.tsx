import type { UpdateStatus } from '../../../shared/updater'

type UpdatePanelProps = {
  appVersion: string
  status: UpdateStatus
  onCheckForUpdates: () => Promise<UpdateStatus>
  onInstallUpdate: () => Promise<void>
}

function UpdatePanel({
  appVersion,
  status,
  onCheckForUpdates,
  onInstallUpdate
}: UpdatePanelProps): React.JSX.Element {
  const isChecking = status.stage === 'checking' || status.stage === 'downloading'
  const isReadyToInstall = status.stage === 'downloaded'

  return (
    <section className="update-panel">
      <div className="update-panel__header">
        <div>
          <p className="update-panel__eyebrow">Update Center</p>
          <h2>App version {appVersion}</h2>
        </div>
        <span className={`update-pill update-pill--${status.stage}`}>
          {isReadyToInstall ? 'Ready to install' : status.stage.replace('-', ' ')}
        </span>
      </div>

      <p className="update-panel__message">{status.message}</p>

      {typeof status.percent === 'number' && (
        <div className="update-progress">
          <div className="update-progress__bar" style={{ width: `${status.percent}%` }} />
        </div>
      )}

      <div className="update-panel__actions">
        <button
          className="secondary-btn"
          type="button"
          onClick={() => void onCheckForUpdates()}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Check for updates'}
        </button>

        {isReadyToInstall && (
          <button className="primary-btn" type="button" onClick={() => void onInstallUpdate()}>
            Restart and install
          </button>
        )}
      </div>

      {status.nextVersion && (
        <p className="update-panel__meta">Latest release detected: v{status.nextVersion}</p>
      )}
    </section>
  )
}

export default UpdatePanel
