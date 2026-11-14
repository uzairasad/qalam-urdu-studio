# Changelog

## 0.1.7 — 2026-11-15

- **Phones: the title bar no longer sits under the status bar and camera cutout**, and dialogs
  and the bottom bar keep clear of them and the gesture bar too.
- **New app icon**: a reed pen writing a Nastaliq stroke, drawn to fit every launcher shape. The
  old icon's text didn't show and its frame was cut off on Android.
- **Starts with a blank page** instead of the newspaper template, with a hint on how to begin.
  Templates are under File → New from Template (no longer repeated in the tab bar), and an
  untouched template isn't restored at the next start.
- **Dark theme**: follows the system, or choose under View → Theme. Pages keep their real colours.
- Text frames wrap the same at every zoom level, so text no longer shows as overflowing at small
  zoom (as on phones). The red reset button is gone from the title bar (Reset Workspace is still
  in the File menu).
- **InPage:** Sindhi text and InPage's Arabic character set (used for Arabic, Pashto and Kashmiri)
  now come across from InPage 2000–2005 documents instead of being dropped.
- **New .qlm format**: a compressed package (like .docx) with pictures stored as image files, so
  documents are much smaller. Older .qlm, .qpg and .json documents still open; once saved again
  they use the new format, which older versions of Qalam Urdu Studio can't open.

## 0.1.6 — 2026-11-15

- Opens InPage 2009 and later documents (`.inp` with Unicode text).
- InPage documents now open with their layout, not just their text: the page size and margins,
  every page, each text frame where InPage put it with the text InPage set in it (a story
  running through linked frames breaks exactly where it did in InPage, page by page), columns,
  rotated frames, fonts, sizes, bold, colours, alignment and line spacing, frame borders and
  fills, lines, boxes, ellipses and slanted shapes, pictures, table rows, page numbers, and
  everything master pages put on each page. InPage's fonts are more compact than the bundled
  ones, so text that wouldn't fit its frame is set a little smaller.
- Pictures with transparent areas no longer show a grey background.

## 0.1.5 — 2026-11-15

- Opens real InPage documents: `.inp` files from InPage 1.x, 2.x, 2000, XP 2004 and 2005, the
  `.B01` backups InPage keeps next to them, and text exported from InPage. The Urdu, Arabic,
  Persian and English text comes in as Unicode with its paragraphs, vowel marks, numbers and
  tables, laid out on A4 pages. The original page layout isn't carried over yet, and files from
  InPage 2009 and later aren't supported yet.
- "Save As InPage (.inp)" saved Qalam's own format under an InPage name, which InPage couldn't
  open. It is now **Export for InPage 2000–2005 (.txt)**: the text in InPage's own encoding, for
  File → Import in old InPage. Documents saved the old way still open.

## 0.1.4 — 2026-11-14

- In-app updates. The desktop apps check GitHub for a new version (File → About → Check for
  updates, or automatically at start-up, at most once a day; you can turn this off), then
  download it, verify its signature, install it and restart, with your open documents kept.
  The portable Windows copy, Linux .deb/.rpm installs and the Android app open the download
  instead, and the web app offers "Reload to update". An Update button appears in the title bar
  when a new version is found.
- Display scaling: the window now fits the screen at 150–200% scaling (the minimum size used to
  be taller than some laptop screens), and in short windows the ribbon and tab bar go compact so
  the page keeps more room. The About box scrolls instead of being cut off, and Escape closes it.
- Unit tests (`npm test`) now run in CI.

## 0.1.3 — 2026-11-14

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
