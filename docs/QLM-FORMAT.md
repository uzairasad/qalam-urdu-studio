# The .qlm document format

Qalam Urdu Studio's own documents. `src/utils/qlmFormat.ts` reads and writes them.

## Why its own format

Word (`.docx`) and PDF can't hold what a page-layout document is made of: text frames placed
exactly on the page, linked frames, master pages, Urdu typesetting settings per frame. Full DTP
interchange formats (IDML and the like) are very large to implement and still don't carry
Nastaliq settings. So Qalam keeps its own format, built on open pieces: a ZIP package with JSON
inside, the same approach as `.docx`, `.odt` and `.epub`. Any ZIP tool can open a `.qlm`, and
Word, PDF, PNG, HTML and plain-text exports are there for sharing with other programs.

## Version 2 (0.1.7 and later)

A ZIP file containing:

| Entry | Contents |
| --- | --- |
| `mimetype` | `application/vnd.qalam-urdu-studio.document`, the first entry, stored uncompressed |
| `document.json` | `{ "format": "qalam-urdu-studio", "version": 2, "generator", "savedAt", "document" }` |
| `media/imageN.ext` | each picture once, as an ordinary image file |

`document` is the `DocumentProject` of `src/types/inpage.ts`: `pageSetup` (sizes in mm),
`pages` (each with `elements`), `masterElements` (on every page), `title`, `fileName`.
Elements are text frames, pictures, shapes, lines and tables with positions in mm. A picture's
`imageSrc` names its `media/` file.

Readers should ignore fields they don't know. A newer `version` opens as far as it can.

## Version 1 (0.1.6 and earlier)

The `DocumentProject` as plain JSON, pictures as base64 `data:` URLs inside it. These files (and
`.qpg` and `.json` saves of the same form) still open; saving again writes version 2.
