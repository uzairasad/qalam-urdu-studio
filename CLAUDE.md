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
npm run build        # PWA into dist/ + single-file offline HTML (scripts/build-offline.mjs)
npm run build:desktop  # what Tauri bundles (no single-file step)
cargo fmt --all && cargo clippy --workspace --all-targets -- -D warnings && cargo test --workspace
```

Run lint and (for Rust changes) fmt/clippy/test before committing; CI runs the same on Windows,
macOS and Linux. `cargo clippy` needs `dist/` (run `npm run build:desktop` first).

## Map

| Path | What |
| --- | --- |
| `src/App.tsx` | Main state: document tabs, autosave to localStorage, open/save/export handlers |
| `src/components/DocumentCanvas.tsx` | Page canvas: frames, selection, layout |
| `src/components/RibbonToolbar.tsx` | The ribbon (largest UI file) |
| `src/components/*Modal.tsx` | Dialogs: dictionary, keyboard, setup, print preview, find/replace… |
| `src/utils/export*.ts`, `import*.ts` | PDF, Word, PNG, text, InPage export; Word/PDF/text import |
| `src/utils/phoneticKeyboard.ts` | Urdu keyboard layouts |
| `src/utils/urduDict*.ts` | Offline Urdu dictionary data and lookup |
| `src/utils/templates.ts` | Page templates |
| `src/appInfo.ts` | Name, version (from package.json), links — mirrors `PROJECT_LINKS` in Rust |
| `src/platform/native.ts` | Only place that talks to Tauri; falls back to browser behaviour |
| `src/fonts.css`, `scripts/woff2-only.mjs` | Bundled @fontsource fonts; build drops `.woff` fallbacks |
| `src-tauri/src/lib.rs` | Rust commands: save_file, print_document, open_project_link, take_pending_files/read_document (.qlm/.qpg file associations, single instance) |
| `site/index.html` | GitHub Pages landing page |
| `.github/workflows/` | ci.yml, pages.yml, release.yml |

## Keep in mind

- Nastaliq is shaped by the system web engine (DirectWrite / Core Text / HarfBuzz). Test Urdu
  text rendering after any typography or font change, in the browser and ideally the native app.
- All fonts are bundled (offline is a feature). Don't add fonts or data loaded from the network.
- The webview has no fs permissions: Rust only reads files the OS handed over (`OpenQueue.allowed`)
  and only writes where the user chose in a Save dialog.
- Native printing is desktop-only (`#[cfg(desktop)]`); Android falls back to `window.print()`.
- Autosave keys in localStorage include legacy names (`qalampage_autosave_v1`, `inpage_autosave_v4`)
  that are still read for migration; don't remove them.
- The About box, title bar and status bar show the real version and "Created by Uzair Asad".

## Releasing

1. Bump `version` in `package.json` and `[workspace.package]` in `Cargo.toml`; add a CHANGELOG entry.
2. Commit, `git tag vX.Y.Z`, `git push origin main vX.Y.Z`.
3. `release.yml` builds all platforms, signs the APK (secrets `ANDROID_KEYSTORE_BASE64`,
   `ANDROID_KEYSTORE_PASSWORD`, alias `qalam`), uploads SHA256SUMS and publishes.
   Actions → Release → Run workflow with `android_only` is a quick APK-only check.

Commits are authored as `uzairasad <11199078+uzairasad@users.noreply.github.com>`.
