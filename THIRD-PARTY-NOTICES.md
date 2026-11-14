# Third-party notices

Qalam Urdu Studio is © 2026 Uzair Asad and licensed under the
[GNU General Public License v3.0 or later](LICENSE). It includes the following third-party
work, each under its own license.

## Fonts

Bundled with the app (through [Fontsource](https://fontsource.org)) under the
[SIL Open Font License 1.1](https://openfontlicense.org). The OFL lets the fonts be bundled with
any software. The fonts themselves stay under the OFL and can't be sold on their own.

| Font | Copyright |
| --- | --- |
| Noto Nastaliq Urdu, Noto Kufi Arabic, Noto Sans Arabic | The Noto Project Authors |
| Gulzar | The Gulzar Project Authors |
| Amiri, Amiri Quran | The Amiri Project Authors |
| Aref Ruqaa | The Aref Ruqaa Project Authors |
| Rakkas | The Rakkas Project Authors |
| Lateef, Scheherazade New | SIL International |
| Reem Kufi | The Reem Kufi Project Authors |
| Readex Pro | The Readex Pro Project Authors |
| Plus Jakarta Sans | The Plus Jakarta Sans Project Authors |

## Libraries

| Library | License |
| --- | --- |
| [React](https://react.dev) | MIT |
| [Tauri](https://tauri.app) (Rust crates and `@tauri-apps/api`) | MIT or Apache-2.0 |
| [jsPDF](https://github.com/parallax/jsPDF) | MIT |
| [docx](https://github.com/dolanmiu/docx) | MIT |
| [JSZip](https://stuk.github.io/jszip/) | MIT or GPL-3.0 |
| [fflate](https://github.com/101arrowz/fflate) | MIT |
| [PDF.js](https://mozilla.github.io/pdf.js/) | Apache-2.0 |
| [Lucide](https://lucide.dev) icons | ISC |
| [Motion](https://motion.dev) | MIT |

## InPage format research

Reading and writing InPage documents builds on published research: the Sindhi character table
in `src/utils/inpageSindhi.ts` comes from [urdu-page](https://github.com/mubashir2k17/urdu-page)
(MIT), and the writer's template (`src/utils/inpageTemplate.ts`) holds structural parts (no text)
of InPage's own sample document FONTS.INP, as published there. InPage is a product of Concept
Software; Qalam Urdu Studio is not affiliated with it.

The complete list of JavaScript and Rust dependencies, with their versions, is in
`package-lock.json` and `Cargo.lock`. Each package's license ships with it.
