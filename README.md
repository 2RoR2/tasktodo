# tasktodo

An Electron application with React and TypeScript

## Task 1.4 Auto-Update

This project uses `electron-updater` with `electron-builder` publishing to GitHub Releases.

Implemented flow:

- The Electron main process checks for updates on app start.
- Update events are forwarded to the renderer through preload IPC.
- The renderer shows an in-app "Update Center" card with current version, status, download progress, and a restart/install button.
- `electron-builder.yml` is configured with `publish.provider: github`.
- All packaging scripts now call `electron-builder --config electron-builder.yml` so the GitHub publish target and artifact naming stay consistent.

### Final release checklist

1. Confirm [package.json](/c:/Users/User/Documents/tasktodo/package.json) has version `1.0.0`, then build and publish that release:
   `cmd /c npm run release`
2. Push the commit and tag for `v1.0.0`:
   `git add .`
   `git commit -m "Release v1.0.0"`
   `git tag v1.0.0`
   `git push origin main --tags`
3. Update [package.json](/c:/Users/User/Documents/tasktodo/package.json) to version `1.1.0` and keep the visible Update Center UI change.
4. Build and publish `v1.1.0`:
   `cmd /c npm run release`
5. Push the commit and tag for `v1.1.0`:
   `git add .`
   `git commit -m "Release v1.1.0 with visible change"`
   `git tag v1.1.0`
   `git push origin main --tags`

### Demo sequence for the report

1. Install and launch the packaged `v1.0.0` app.
2. Show the app version in the Update Center.
3. Wait for startup update detection or click `Check for updates`.
4. Capture the `update available` state and download progress.
5. Capture the `Restart and install` state after download completes.
6. Restart the app and show that it reopens on `v1.1.0`.

### Commands used

```bash
# local verification
npm run build
npm run typecheck
npm run build:win

# publish to GitHub Releases
$env:GH_TOKEN="your_github_token"
npm run release
```

### Suggested evidence to capture

- `v1.0.0` GitHub Release page
- `v1.1.0` GitHub Release page
- App running on `v1.0.0`
- Update detected in the in-app update panel
- Download complete / restart to install state
- App reopened on `v1.1.0`

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For windows installer + unpacked build
$ npm run release:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
