//! Qalam Urdu Studio's native shell.
//!
//! The editor itself is the React app in `../src`, shown in the system webview (WebView2 on
//! Windows, WKWebView on macOS/iOS, WebKitGTK on Linux, Android System WebView). Those engines
//! shape Nastaliq with HarfBuzz/CoreText/DirectWrite, which no Rust-native GUI toolkit does yet.
//! This crate gives the editor what a browser tab can't: native Save dialogs that write real
//! files, native printing, opening documents from the command line / file manager / Finder,
//! one running instance that receives documents opened later, signed in-app updates (desktop),
//! and sizing the window to fit the screen at any display scaling.

use std::{
    collections::HashSet,
    path::{Path, PathBuf},
    sync::Mutex,
};

use serde::Serialize;
use tauri::{
    ipc::{InvokeBody, Request, Response},
    AppHandle, Emitter, Manager, State, WebviewWindow,
};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

/// Event the frontend listens to; it then calls `take_pending_files`.
const OPEN_FILES_EVENT: &str = "qalam://open-files";

/// Download progress of an update being installed: `[bytes so far, total or null]`.
#[cfg(desktop)]
const UPDATE_PROGRESS_EVENT: &str = "qalam://update-progress";

/// Release pages and downloads are the only other web addresses the app opens.
const RELEASES_PREFIX: &str = "https://github.com/uzairasad/qalam-urdu-studio/releases/";

/// Files the editor can open (see `handleOpenFile` in `src/App.tsx`).
/// `inp`/`b01`: InPage documents and the backups InPage keeps next to them.
const OPENABLE_EXTENSIONS: &[&str] = &["qlm", "qpg", "inp", "b01", "docx", "pdf", "txt", "json"];

/// The only web pages the app opens in the system browser (About box links). The webview has
/// no general "open URL" permission; it asks for one of these by name.
const PROJECT_LINKS: &[(&str, &str)] = &[
    ("website", "https://uzairasad.github.io/qalam-urdu-studio/"),
    ("source", "https://github.com/uzairasad/qalam-urdu-studio"),
    (
        "license",
        "https://github.com/uzairasad/qalam-urdu-studio/blob/main/LICENSE",
    ),
    (
        "notices",
        "https://github.com/uzairasad/qalam-urdu-studio/blob/main/THIRD-PARTY-NOTICES.md",
    ),
];

fn project_link(name: &str) -> Option<&'static str> {
    PROJECT_LINKS
        .iter()
        .find(|(n, _)| *n == name)
        .map(|(_, url)| *url)
}

/// Documents handed to the app by the OS, waiting for the editor to pick them up.
/// `allowed` is the only set of paths `read_document` will read, so the webview can't read
/// arbitrary files.
#[derive(Default)]
struct OpenQueue {
    pending: Mutex<Vec<PathBuf>>,
    allowed: Mutex<HashSet<PathBuf>>,
}

impl OpenQueue {
    /// Queues the openable files among `paths`; true when at least one was queued.
    fn push(&self, paths: impl IntoIterator<Item = PathBuf>) -> bool {
        let fresh: Vec<PathBuf> = paths
            .into_iter()
            .filter(|p| p.is_file() && is_openable(p))
            .collect();
        if fresh.is_empty() {
            return false;
        }
        self.allowed.lock().unwrap().extend(fresh.iter().cloned());
        self.pending.lock().unwrap().extend(fresh);
        true
    }
}

/// The folder the last Save dialog ended in, so the next one starts there.
#[derive(Default)]
struct LastSaveDir(Mutex<Option<PathBuf>>);

fn is_openable(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| OPENABLE_EXTENSIONS.contains(&e.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

/// Document paths in a command line (`args[0]` is the program; flags are skipped). Relative
/// paths are resolved against `cwd` — for a second launch that is the *second* process's folder.
fn document_args(args: impl IntoIterator<Item = String>, cwd: Option<&Path>) -> Vec<PathBuf> {
    args.into_iter()
        .skip(1)
        .filter(|a| !a.starts_with('-'))
        .map(PathBuf::from)
        .map(|p| match (p.is_relative(), cwd) {
            (true, Some(cwd)) => cwd.join(p),
            _ => p,
        })
        .filter(|p| is_openable(p))
        .collect()
}

/// Decodes the `encodeURIComponent` form the frontend sends file names in.
fn percent_decode(s: &str) -> String {
    fn hex(b: u8) -> Option<u8> {
        (b as char).to_digit(16).map(|d| d as u8)
    }
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(hi), Some(lo)) = (hex(bytes[i + 1]), hex(bytes[i + 2])) {
                out.push((hi << 4) | lo);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

/// Strips anything that can't be in a file name on any of our platforms.
fn sanitize_file_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect();
    let trimmed = cleaned.trim().trim_matches('.');
    if trimmed.is_empty() {
        "Qalam_Document".into()
    } else {
        trimmed.into()
    }
}

fn filter_label(ext: &str) -> &'static str {
    match ext {
        "qlm" | "qpg" => "Qalam Urdu Studio Document",
        "inp" => "Qalam Document (.inp)",
        "pdf" => "PDF Document",
        "docx" => "Word Document",
        "txt" => "Unicode Text",
        "png" => "PNG Image",
        "html" | "htm" => "HTML Page",
        "json" => "JSON",
        _ => "File",
    }
}

#[derive(Serialize)]
struct PendingFile {
    path: String,
    name: String,
}

/// Documents the OS asked us to open since the last call (drains the queue).
#[tauri::command]
fn take_pending_files(queue: State<'_, OpenQueue>) -> Vec<PendingFile> {
    std::mem::take(&mut *queue.pending.lock().unwrap())
        .into_iter()
        .map(|p| PendingFile {
            name: p
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default(),
            path: p.to_string_lossy().into_owned(),
        })
        .collect()
}

/// The bytes of a document from `take_pending_files` (raw binary, no JSON).
#[tauri::command]
fn read_document(path: String, queue: State<'_, OpenQueue>) -> Result<Response, String> {
    let path = PathBuf::from(path);
    if !queue.allowed.lock().unwrap().contains(&path) {
        return Err("This file was not opened through Qalam Urdu Studio.".into());
    }
    std::fs::read(&path)
        .map(Response::new)
        .map_err(|e| format!("Could not read {}: {e}", path.display()))
}

/// Shows a native Save dialog and writes the request body to the chosen file.
/// The suggested name comes in the `x-file-name` header (URI-encoded); returns the saved path,
/// or `None` when the user cancels.
#[tauri::command]
async fn save_file(
    app: AppHandle,
    last_dir: State<'_, LastSaveDir>,
    request: Request<'_>,
) -> Result<Option<String>, String> {
    let bytes = match request.body() {
        InvokeBody::Raw(bytes) => bytes.clone(),
        InvokeBody::Json(_) => return Err("save_file expects raw bytes".into()),
    };
    let name = request
        .headers()
        .get("x-file-name")
        .and_then(|v| v.to_str().ok())
        .map(percent_decode)
        .map(|n| sanitize_file_name(&n))
        .unwrap_or_else(|| "Qalam_Document.qlm".into());
    let ext = Path::new(&name)
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();

    let mut dialog = app.dialog().file().set_file_name(&name);
    if !ext.is_empty() {
        dialog = dialog.add_filter(filter_label(&ext), &[ext.as_str()]);
    }
    if let Some(dir) = last_dir.0.lock().unwrap().clone() {
        dialog = dialog.set_directory(dir);
    }

    let chosen = tauri::async_runtime::spawn_blocking(move || dialog.blocking_save_file())
        .await
        .map_err(|e| e.to_string())?;
    let Some(chosen) = chosen else {
        return Ok(None);
    };
    let path = chosen.into_path().map_err(|e| e.to_string())?;

    std::fs::write(&path, &bytes).map_err(|e| format!("Could not save {}: {e}", path.display()))?;
    if let Some(parent) = path.parent() {
        *last_dir.0.lock().unwrap() = Some(parent.to_path_buf());
    }
    Ok(Some(path.to_string_lossy().into_owned()))
}

/// Native print dialog for the current page (window.print() is a no-op in some webviews).
/// On Android/iOS there's no webview print API; the frontend then falls back to window.print().
#[tauri::command]
fn print_document(window: WebviewWindow) -> Result<(), String> {
    #[cfg(desktop)]
    return window.print().map_err(|e| e.to_string());
    #[cfg(mobile)]
    {
        let _ = window;
        Err("Native printing is not available on this platform".into())
    }
}

/// Opens one of `PROJECT_LINKS` in the default browser.
#[tauri::command]
fn open_project_link(app: AppHandle, link: String) -> Result<(), String> {
    let url = project_link(&link).ok_or_else(|| format!("Unknown link: {link}"))?;
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}

/// Opens a release page or download (from the update check) in the default browser.
#[tauri::command]
fn open_release_link(app: AppHandle, url: String) -> Result<(), String> {
    if !is_release_link(&url) {
        return Err("Not a Qalam Urdu Studio release link".into());
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}

fn is_release_link(url: &str) -> bool {
    url.starts_with(RELEASES_PREFIX) && !url.contains("..") && !url.chars().any(char::is_whitespace)
}

/// An update found by `check_update`, for the frontend.
#[cfg(desktop)]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateInfo {
    version: String,
    notes: Option<String>,
    /// False for installs the updater can't replace (portable Windows copy, Linux .deb/.rpm):
    /// those are pointed to the download page instead.
    can_install: bool,
}

/// The update `check_update` found, kept for `install_update`.
#[cfg(desktop)]
#[derive(Default)]
struct PendingUpdate(Mutex<Option<tauri_plugin_updater::Update>>);

/// Whether this copy of the app was installed in a way the updater can replace in place.
#[cfg(desktop)]
fn self_updatable() -> bool {
    #[cfg(target_os = "linux")]
    {
        // Only the AppImage updates itself; .deb and .rpm belong to the package manager.
        std::env::var_os("APPIMAGE").is_some()
    }
    #[cfg(target_os = "windows")]
    {
        // NSIS installs leave an uninstaller next to the program; MSI installs live in Program
        // Files. Anything else is the portable copy, which must not turn into an installed one.
        let Ok(exe) = std::env::current_exe() else {
            return false;
        };
        let nsis = exe
            .parent()
            .is_some_and(|d| d.join("uninstall.exe").is_file());
        let msi = ["ProgramFiles", "ProgramFiles(x86)", "ProgramW6432"]
            .iter()
            .filter_map(std::env::var_os)
            .any(|dir| exe.starts_with(dir));
        nsis || msi
    }
    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        true
    }
}

/// Asks the release feed whether a newer version exists. Only runs when the user checks (About
/// box) or has automatic checks on; the only data sent is the request for the feed itself.
#[cfg(desktop)]
#[tauri::command]
async fn check_update(
    app: AppHandle,
    pending: State<'_, PendingUpdate>,
) -> Result<Option<UpdateInfo>, String> {
    use tauri_plugin_updater::UpdaterExt;
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?;
    let info = update.as_ref().map(|u| UpdateInfo {
        version: u.version.clone(),
        notes: u.body.clone(),
        can_install: self_updatable(),
    });
    *pending.0.lock().unwrap() = update;
    Ok(info)
}

/// Downloads the update found by `check_update`, checks its signature, installs it and
/// restarts the app.
#[cfg(desktop)]
#[tauri::command]
async fn install_update(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<(), String> {
    let update = pending
        .0
        .lock()
        .unwrap()
        .take()
        .ok_or("No update to install. Check for updates again.")?;
    let mut received: u64 = 0;
    update
        .download_and_install(
            |chunk, total| {
                received += chunk as u64;
                let _ = app.emit(UPDATE_PROGRESS_EVENT, (received, total));
            },
            || {},
        )
        .await
        .map_err(|e| e.to_string())?;
    app.restart();
}

/// The window's sizes in the config are logical pixels. With display scaling turned up (150%,
/// 200%...) on a small screen, the minimum size can be bigger than the screen, pushing the title
/// bar or the status bar off-screen. Clamp the minimum to the monitor's work area, and keep the
/// window inside it (it normally opens maximized).
#[cfg(desktop)]
fn fit_window_to_screen(window: &tauri::WebviewWindow) -> tauri::Result<()> {
    use tauri::{LogicalSize, Size};
    let Some(monitor) = window.current_monitor()?.or(window.primary_monitor()?) else {
        return Ok(());
    };
    let scale = monitor.scale_factor();
    let work: LogicalSize<f64> = monitor.work_area().size.to_logical(scale);
    let outer: LogicalSize<f64> = window.outer_size()?.to_logical(scale);
    let inner: LogicalSize<f64> = window.inner_size()?.to_logical(scale);
    // Title bar and borders.
    let frame_w = (outer.width - inner.width).max(0.0);
    let frame_h = (outer.height - inner.height).max(0.0);

    let min_w = 360f64.min(work.width - frame_w);
    let min_h = 400f64.min(work.height - frame_h);
    window.set_min_size(Some(Size::Logical(LogicalSize::new(min_w, min_h))))?;

    if window.is_maximized()? || work.width < 900.0 || work.height < 600.0 {
        return window.maximize();
    }
    if outer.width <= work.width * 0.95 && outer.height <= work.height * 0.95 {
        return Ok(());
    }
    let width = inner.width.min(work.width * 0.95 - frame_w).max(min_w);
    let height = inner.height.min(work.height * 0.95 - frame_h).max(min_h);
    window.set_size(Size::Logical(LogicalSize::new(width, height)))?;
    window.center()
}

fn queue_and_notify(app: &AppHandle, paths: Vec<PathBuf>) {
    if app.state::<OpenQueue>().push(paths) {
        let _ = app.emit(OPEN_FILES_EVENT, ());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg_attr(mobile, allow(unused_mut))]
    let mut builder = tauri::Builder::default();

    // A second launch (double-clicking another document) hands its files to this instance.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            queue_and_notify(app, document_args(args, Some(Path::new(&cwd))));
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }));
    }

    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .manage(PendingUpdate::default());
    }

    let app = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(OpenQueue::default())
        .manage(LastSaveDir::default())
        .setup(|app| {
            #[cfg(desktop)]
            {
                let cwd = std::env::current_dir().ok();
                app.state::<OpenQueue>()
                    .push(document_args(std::env::args(), cwd.as_deref()));
                if let Some(window) = app.get_webview_window("main") {
                    if let Err(e) = fit_window_to_screen(&window) {
                        eprintln!("Could not fit the window to the screen: {e}");
                    }
                }
            }
            let _ = app;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            take_pending_files,
            read_document,
            save_file,
            print_document,
            open_project_link,
            open_release_link,
            #[cfg(desktop)]
            check_update,
            #[cfg(desktop)]
            install_update
        ])
        .build(tauri::generate_context!())
        .expect("error while building Qalam Urdu Studio");

    app.run(|_app, _event| {
        // macOS / iOS deliver documents opened from Finder as an event, not as arguments.
        #[cfg(any(target_os = "macos", target_os = "ios"))]
        if let tauri::RunEvent::Opened { urls } = _event {
            let paths = urls
                .into_iter()
                .filter_map(|u| u.to_file_path().ok())
                .collect();
            queue_and_notify(_app, paths);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn command_line_keeps_only_documents() {
        let args = ["qalam.exe", "--flag", "notes.qlm", "photo.jpg", "book.PDF"].map(String::from);
        let cwd = Path::new("/docs");
        assert_eq!(
            document_args(args, Some(cwd)),
            vec![cwd.join("notes.qlm"), cwd.join("book.PDF")]
        );
    }

    #[test]
    fn decodes_uri_component_names() {
        assert_eq!(percent_decode("%D8%A7%D8%B1%D8%AF%D9%88.qlm"), "اردو.qlm");
        assert_eq!(percent_decode("a%20b%2"), "a b%2");
        assert_eq!(percent_decode("plain.pdf"), "plain.pdf");
    }

    #[test]
    fn sanitizes_names() {
        assert_eq!(sanitize_file_name("a/b:c?.pdf"), "a_b_c_.pdf");
        assert_eq!(sanitize_file_name("  ..  "), "Qalam_Document");
    }

    #[test]
    fn only_known_project_links_open() {
        assert_eq!(
            project_link("source"),
            Some("https://github.com/uzairasad/qalam-urdu-studio")
        );
        assert!(PROJECT_LINKS.iter().all(|(_, u)| u.starts_with("https://")));
        assert_eq!(project_link("file:///etc/passwd"), None);
    }

    #[test]
    fn only_release_links_open() {
        assert!(is_release_link(
            "https://github.com/uzairasad/qalam-urdu-studio/releases/latest"
        ));
        assert!(is_release_link("https://github.com/uzairasad/qalam-urdu-studio/releases/download/v0.2.0/Qalam-Urdu-Studio-0.2.0-android-arm64.apk"));
        assert!(!is_release_link(
            "https://github.com/someone/else/releases/latest"
        ));
        assert!(!is_release_link(
            "https://github.com/uzairasad/qalam-urdu-studio/releases/../../evil"
        ));
        assert!(!is_release_link("file:///etc/passwd"));
    }

    #[test]
    fn openable_extensions_ignore_case() {
        assert!(is_openable(Path::new("x.DOCX")));
        assert!(is_openable(Path::new("Sample.INP")));
        assert!(is_openable(Path::new("Sample.B01")));
        assert!(!is_openable(Path::new("x.exe")));
        assert!(!is_openable(Path::new("noext")));
    }
}
