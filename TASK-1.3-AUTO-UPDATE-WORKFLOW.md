# Complete Task 1.3: Electron Auto-Update Workflow

## Scope

Task 1.3 asks for two kinds of completion:

1. Code and app behavior inside the repository.
2. A real release-and-update demonstration using GitHub Releases.

The repository now covers the implementation portion. The GitHub publish and screen-capture portion must be executed against your live GitHub repo because it depends on signed release artifacts, release metadata, and a packaged app installed outside development mode.

## What is complete in this codebase

The app now satisfies the implementation requirements for auto-update:

- `electron-updater` is integrated into the Electron main process in [src/main/index.ts](/c:/Users/User/Documents/tasktodo/src/main/index.ts).
- `electron-builder` is configured to publish through GitHub in [electron-builder.yml](/c:/Users/User/Documents/tasktodo/electron-builder.yml).
- The app checks for updates on startup by calling `autoUpdater.checkForUpdates()` after the main window is created.
- Update events are sent from the main process to the renderer through preload IPC in [src/preload/index.ts](/c:/Users/User/Documents/tasktodo/src/preload/index.ts).
- The renderer shows in-app update status, progress, and install controls in [src/renderer/src/components/UpdatePanel.tsx](/c:/Users/User/Documents/tasktodo/src/renderer/src/components/UpdatePanel.tsx).
- A visible `v1.1.0` UI change was added in [src/renderer/src/App.tsx](/c:/Users/User/Documents/tasktodo/src/renderer/src/App.tsx) and [src/renderer/src/App.css](/c:/Users/User/Documents/tasktodo/src/renderer/src/App.css): the new task overview cards.

## Required release workflow

To fully complete Task 1.3 end to end, use this exact release sequence:

1. Set [package.json](/c:/Users/User/Documents/tasktodo/package.json) to `1.0.0`.
2. Build and publish `v1.0.0` to GitHub Releases with `GH_TOKEN` set:
   `npm run release`
3. Commit and tag the release:
   `git add .`
   `git commit -m "Release v1.0.0"`
   `git tag v1.0.0`
   `git push origin main --tags`
4. Change [package.json](/c:/Users/User/Documents/tasktodo/package.json) to `1.1.0`.
5. Keep the updater implementation and include the visible UI change from this branch.
6. Build and publish `v1.1.0`:
   `npm run release`
7. Commit and tag that release:
   `git add .`
   `git commit -m "Release v1.1.0"`
   `git tag v1.1.0`
   `git push origin main --tags`

## Demo workflow

After both GitHub Releases exist:

1. Install the packaged `v1.0.0` app.
2. Launch the app and show that the Update Center reports the current app version as `1.0.0`.
3. Let the startup check run, or click `Check for updates`.
4. Capture the `Update available` state.
5. Capture the download progress state.
6. Capture the `Restart and install` state after the download finishes.
7. Restart the app.
8. Show that the app opens on `v1.1.0` and includes the visible UI change.

## Evidence checklist

You will need screenshots or a screen recording of:

- The `v1.0.0` GitHub Release page
- The `v1.1.0` GitHub Release page
- The app running on `v1.0.0`
- The in-app update detection message
- The download progress state
- The restart/install prompt
- The app reopened on `v1.1.0`
- The visible `v1.1.0` UI change

## Important note about completion

This repository can implement and verify the updater wiring, packaging config, and UI flow. It cannot by itself prove the final GitHub Release lifecycle unless you actually publish the two releases and record the installed app updating from `v1.0.0` to `v1.1.0`.
