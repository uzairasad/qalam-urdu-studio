# Qalam Urdu Studio

A desktop publishing suite for Urdu Nastaliq, Arabic and English: a modern successor to
InPage Urdu Professional. Phonetic and multi-layout Urdu keyboards, multi-column page layout,
master pages, tables, an Urdu dictionary, and PDF / Word / PNG / text / HTML export.

It runs as a native app on **Windows, macOS and Linux** (and, experimentally, Android), built
with Rust and [Tauri 2](https://tauri.app). It is also still a PWA and a single-file offline HTML app.

## Downloads

Releases are built on GitHub Actions from this repository's source, and every file has a
SHA-256 checksum in `SHA256SUMS.txt`.

| Platform | Files | Notes |
| --- | --- | --- |
| Windows 10/11 | `_x64-setup.exe`, `.msi`, `-portable-windows-x64.zip` | Not code-signed yet: SmartScreen may warn on first run. |
| macOS 10.15+ | `_aarch64.dmg` (Apple Silicon), `_x64.dmg` (Intel) | Not notarized yet: right-click > Open the first time. |
| Linux | `.AppImage`, `.deb`, `.rpm` | Needs WebKitGTK 4.1 (Ubuntu 22.04+, Debian 12+, Fedora 37+). |
| Android | `-android-experimental.apk` | Debug-signed, for sideloading and testing. |

## How it's built (and why not egui)

[Mister Download Manager](https://github.com/anefzaoui/misterdownloadmanager) rewrote IDM natively in
Rust with egui. That works for a download manager, but it doesn't work for an Urdu typesetter.
egui and other Rust-native GUI toolkits don't do complex-script shaping or bidirectional layout,
so Nastaliq comes out as disconnected letters. The text engines in system webviews do handle it
(DirectWrite in WebView2, CoreText in WKWebView, HarfBuzz in WebKitGTK and Android).

So Qalam takes the Tauri route:

```
src/            React + TypeScript editor (unchanged UI, shared with the PWA)
src/platform/   native.ts: the one bridge between the editor and its host
src-tauri/      Rust shell: window, native Save dialogs that write real files,
                native printing, file associations (.qlm/.qpg), opening documents
                from the command line / Explorer / Finder, single running instance
```

In a browser, `src/platform/native.ts` falls back to the old web behaviour, so one codebase
serves the desktop app, the PWA and the single-file offline HTML. The typesetting fonts are
bundled (`src/fonts.css`), so every build works with no network connection.

## Develop

Prerequisites: Node 22+, Rust (stable, via [rustup](https://rustup.rs)), and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS (on Windows: the
"Desktop development with C++" build tools; WebView2 already comes with Windows 10/11).

```bash
npm install
npm run app:dev      # desktop app with hot reload
npm run app:build    # installers in target/release/bundle/
npm run dev          # web/PWA only, http://localhost:3000
npm run build        # PWA (dist/) + single-file offline HTML
```

Rust checks: `cargo fmt --all`, `cargo clippy --workspace --all-targets`, `cargo test --workspace`.

## Releasing

1. Bump `version` in `package.json` (the installers take it from there) and in `Cargo.toml`'s
   `[workspace.package]`.
2. Commit, then tag and push: `git tag v0.1.0 && git push origin v0.1.0`.
3. `.github/workflows/release.yml` builds every platform, uploads them with `SHA256SUMS.txt`
   and publishes the release.

To sign the builds later, add the Windows certificate / Apple notarization secrets that
[tauri-action](https://github.com/tauri-apps/tauri-action) reads.
