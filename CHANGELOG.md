# Changelog

## 0.1.2 — 2026-11-14

- Android: the experimental APK is now about 23 MB instead of 490 MB. It's built for 64-bit ARM
  phones only (nearly every phone since 2017), stripped of debug information and size-optimised.

## 0.1.1 — 2026-11-13

- Android: the app now builds for Android. Native printing is desktop-only. On phones and tablets,
  Print uses the webview's own print instead.
- Release builds always use npm, so the leftover `bun.lock` no longer confuses the build.

## 0.1.0 — 2026-11-13

First native release: the Google AI Studio PWA, now as a Rust (Tauri 2) app.

- Native app for Windows, macOS and Linux, plus an experimental Android build.
- Save and Export (.qlm, .inp, PDF, Word, PNG, text, HTML) open a native Save dialog and write
  real files. The dialog remembers the last folder.
- Print uses the native print dialog.
- Double-clicking a `.qlm`/`.qpg` file opens it in Qalam. Documents passed on the command line or
  opened while the app is running open in a new tab of the same window.
- Typesetting fonts (Noto Nastaliq Urdu, Gulzar, Amiri, Lateef, Scheherazade New and others) are
  bundled, so the app works with no network connection.
- Builds and checksums come from GitHub Actions.
