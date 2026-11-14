# Changelog

## Unreleased

- Qalam Urdu Studio is now open source under the GNU GPL v3.0 or later. The About box shows the
  license with links to the website, source code, license and third-party notices.
- Android: the APK is now a signed release build (`-android-arm64.apk`, about 11 MB), so future versions
  install as updates. It's signed with a different key than earlier test builds, so uninstall
  0.1.x before installing it.
- The title bar, status bar, toolbox and About box show the real version instead of "v1.0".
  The About box says "Created by Uzair Asad". Exported PDF and Word files record the app version.
- Smaller downloads: the bundled fonts ship only in WOFF2, which roughly halves their size in
  every installer, the APK and the single-file offline HTML (14.7 MB down to 8.4 MB). The offline
  HTML is no longer packed inside the native apps.
- The web app's "Download Single-File App" button always gets the copy from the same build.
- New project website on GitHub Pages, with the web app at `/app/`.
- Release builds can sign Windows (Azure Trusted Signing) and macOS (Developer ID +
  notarization) apps once those certificates are added (see `docs/SIGNING.md`).
- Removed files and dependencies left over from the original prototype.

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
