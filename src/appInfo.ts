// Shown in the title bar, status bar and About box. The version comes from package.json, the
// same source the native installers (src-tauri/tauri.conf.json) use, so they never disagree.
import { version } from '../package.json';

export const APP_NAME = 'Qalam Urdu Studio';
export const APP_VERSION = version;
export const APP_AUTHOR = 'Uzair Asad';
