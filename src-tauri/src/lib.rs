//! Qalam Urdu Studio's native shell.
//!
//! The editor itself is the React app in `../src`, shown in the system webview (WebView2 on
//! Windows, WKWebView on macOS/iOS, WebKitGTK on Linux, Android System WebView). Those engines
//! shape Nastaliq with HarfBuzz/CoreText/DirectWrite, which no Rust-native GUI toolkit does yet.
//! This crate gives the editor what a browser tab can't: native Save dialogs that write real
//! files, native printing, opening documents from the command line / file manager / Finder,
//! and one running instance that receives documents opened later.

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

/// Files the editor can open (see `handleOpenFile` in `src/App.tsx`).
const OPENABLE_EXTENSIONS: &[&str] = &["qlm", "qpg", "inp", "docx", "pdf", "txt", "json"];

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
            }
            let _ = app;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            take_pending_files,
            read_document,
            save_file,
            print_document,
            open_project_link
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
    fn openable_extensions_ignore_case() {
        assert!(is_openable(Path::new("x.DOCX")));
        assert!(!is_openable(Path::new("x.exe")));
        assert!(!is_openable(Path::new("noext")));
    }
}
