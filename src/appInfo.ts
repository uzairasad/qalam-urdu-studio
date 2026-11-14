// Shown in the title bar, status bar and About box. The version comes from package.json, the
// same source the native installers (src-tauri/tauri.conf.json) use, so they never disagree.
import { version } from '../package.json';

export const APP_NAME = 'Qalam Urdu Studio';
export const APP_VERSION = version;
export const APP_AUTHOR = 'Uzair Asad';
export const APP_LICENSE = 'GPL-3.0-or-later';

// Mirrors PROJECT_LINKS in src-tauri/src/lib.rs, the only pages the native app will open.
export const PROJECT_LINKS = {
  website: 'https://uzairasad.github.io/qalam-urdu-studio/',
  source: 'https://github.com/uzairasad/qalam-urdu-studio',
  license: 'https://github.com/uzairasad/qalam-urdu-studio/blob/main/LICENSE',
  notices: 'https://github.com/uzairasad/qalam-urdu-studio/blob/main/THIRD-PARTY-NOTICES.md',
} as const;

export type ProjectLink = keyof typeof PROJECT_LINKS;
