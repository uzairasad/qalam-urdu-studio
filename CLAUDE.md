# Qalam Urdu Studio — notes for Claude

Urdu Nastaliq desktop publishing by **Uzair Asad** (GitHub `uzairasad`). Free and open source,
GPL-3.0-or-later. One React codebase ships a PWA (GitHub Pages `/app/`), a single-file offline
HTML, and Tauri 2 native apps for Windows, macOS, Linux and Android. README.md has the
user-facing overview and architecture; this file is how to work on it.

## Commands

```bash
npm install
npm run dev          # web app at http://localhost:3000
npm run app:dev      # native window with hot reload (needs Rust + Tauri prerequisites)
npm run lint         # tsc --noEmit
npm test             # node --test on src/**/*.test.ts
npm run build        # PWA into dist/ + single-file offline HTML (scripts/build-offline.mjs)
npm run build:desktop  # what Tauri bundles (no single-file step)
cargo fmt --all && cargo clippy --workspace --all-targets -- -D warnings && cargo test --workspace
```

Run lint, tests and (for Rust changes) fmt/clippy/test before committing; CI runs the same on Windows,
macOS and Linux. `cargo clippy` needs `dist/` (run `npm run build:desktop` first).
`target/` is only a build cache: `cargo clean` frees it whenever it gets large (it reached 17 GB
before dev builds dropped dependency debug info in `Cargo.toml`).

## Map

| Path | What |
| --- | --- |
| `src/App.tsx` | Main state: document tabs, autosave to localStorage, open/save/export handlers |
| `src/components/DocumentCanvas.tsx` | Page canvas: frames, selection, layout |
| `src/components/RibbonToolbar.tsx` | The ribbon (largest UI file) |
| `src/components/*Modal.tsx` | Dialogs: dictionary, keyboard, setup, print preview, find/replace… |
| `src/utils/export*.ts`, `import*.ts` | PDF, Word, PNG, text export; Word/PDF/text import |
| `src/utils/ole.ts`, `inpageText.ts`, `importInpage.ts` | Real InPage files: OLE reader, InPage↔Unicode table and fixes, entry point (layout, falling back to text); `exportInpage.ts` writes InPage-encoded text |
| `src/utils/inpageFormat.ts`, `inpageLayout.ts`, `fitText.ts`, `dibToPng.ts` | InPage structures (layout records, fonts, text, styles, saved frames and lines; `docs/INPAGE-FORMAT.md`), pages rebuilt from them, shrinking text that overflows (browser), pictures |
| `src/utils/richText.ts`, `components/RichText.tsx` | Per-word formatting (`TextElement.runs`): rendering, keeping runs in step with edits (`updateTextElement`) |
| `src/utils/inpageWriter.ts`, `inpageTemplate.ts`, `oleWriter.ts` | Save as InPage (.inp): InPage100 stream from the document + template pieces of InPage's FONTS.INP; OLE writer |
| `src/utils/tables.ts` | Table column widths |
| `src/utils/qlmFormat.ts` | The .qlm format: ZIP package (mimetype, document.json, media/), opens older JSON saves (`docs/QLM-FORMAT.md`) |
| `src/theme.ts`, `src/index.css` | Light/dark theme (`data-theme`; dark remaps the palette, `.page-background`/`.print-page-view`/`.keep-colors` keep real colours); safe-area insets (`--safe-*`) |
| `src/utils/textLayout.ts` | Plain text → A4 pages of text frames (used by the .txt and InPage importers) |
| `src/utils/phoneticKeyboard.ts` | Urdu keyboard layouts |
| `src/utils/urduDict*.ts` | Offline Urdu dictionary data and lookup |
| `src/utils/templates.ts` | Page templates |
| `src/appInfo.ts` | Name, version (from package.json), links — mirrors `PROJECT_LINKS` in Rust |
| `src/platform/native.ts` | Only place that talks to Tauri; falls back to browser behaviour |
| `src/platform/updates.ts`, `components/Updates.tsx` | Update check/install: Tauri updater (desktop), GitHub release (Android, portable, fallback), service worker (web) |
| `src/fonts.css`, `scripts/woff2-only.mjs` | Bundled @fontsource fonts; build drops `.woff` fallbacks |
| `src-tauri/src/lib.rs` | Rust commands: save_file, print_document, open_project_link, open_release_link, check_update/install_update, take_pending_files/read_document (.qlm/.qpg file associations, single instance); `fit_window_to_screen` |
| `site/index.html` | GitHub Pages landing page |
| `.github/workflows/` | ci.yml, pages.yml, release.yml |

## Keep in mind

- Nastaliq is shaped by the system web engine (DirectWrite / Core Text / HarfBuzz). Test Urdu
  text rendering after any typography or font change, in the browser and ideally the native app.
- All fonts are bundled (offline is a feature). Don't add fonts or data loaded from the network.
- The webview has no fs permissions: Rust only reads files the OS handed over (`OpenQueue.allowed`)
  and only writes where the user chose in a Save dialog.
- InPage: never commit real InPage documents (the user's family archive is private); tests
  build synthetic documents (`src/utils/inpageTestFiles.ts`). To check real ones locally:
  `INPAGE_SAMPLES=/path/to/folder npm test`. Classic InPage stores Urdu numbers reversed,
  medial ی as the ے code (A5) only sometimes (A4 is usual), and one code (A3) for ئ/ء. InPage
  2009+ files have an `InPage300` stream (UTF-16 text) with the same structure. Read
  `docs/INPAGE-FORMAT.md` before changing the readers, and update it with what you find.
- Native printing is desktop-only (`#[cfg(desktop)]`); Android falls back to `window.print()`.
- Autosave keys in localStorage include legacy names (`qalampage_autosave_v1`, `inpage_autosave_v4`)
  that are still read for migration; don't remove them.
- The About box, title bar and status bar show the real version and "Created by Uzair Asad".
- Updates: installed apps only accept updates signed with the updater key (public half in
  `tauri.conf.json` → `plugins.updater.pubkey`; private half in the `TAURI_SIGNING_PRIVATE_KEY`
  secret, kept outside the repo). Changing the key means one manual install for every user.
  The only network calls are the update check (on demand, or daily at start-up if enabled) and
  the site's GitHub API fetch.
- Short windows (display scaling 150–200%): use the `short:` variant (max-height 600px) to
  compact chrome, and let dialogs scroll rather than clip. Rust clamps the window's minimum size
  to the monitor's work area at launch (`fit_window_to_screen`).

## Releasing

1. Bump `version` in `package.json` and `[workspace.package]` in `Cargo.toml`; add a CHANGELOG entry.
2. Commit and push to `main` (directly, or by merging a PR). Don't push tags: cloud sessions
   aren't allowed to, and they aren't needed. `release.yml`'s `plan` job sees a version with no
   `vX.Y.Z` tag yet, creates the tag on that commit (pushing one by hand still works too).
3. `release.yml` then builds all platforms, signs the APK (secrets `ANDROID_KEYSTORE_BASE64`,
   `ANDROID_KEYSTORE_PASSWORD`, alias `qalam`), writes the updater feed `latest.json` (once, in
   the publish job: builds updating it together clash), uploads SHA256SUMS and publishes. A run
   that fails partway leaves a draft; the next push to `main` touching `release.yml` or
   `package.json` finishes it.
   Actions → Release → Run workflow with `android_only` is a quick APK-only check.

Commits are authored as `uzairasad <11199078+uzairasad@users.noreply.github.com>`.
