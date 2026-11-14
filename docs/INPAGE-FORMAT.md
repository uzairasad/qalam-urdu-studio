# The InPage document format

What Qalam Urdu Studio reads from InPage documents, and how. InPage's format isn't published;
everything here was worked out from real documents and checked against InPage's own PDF output
where one was available. The readers are `src/utils/inpageFormat.ts` (structures) and
`src/utils/inpageLayout.ts` (building pages); `src/utils/ole.ts` reads the container.

Thanks to the people who published earlier research, which this builds on and corrects:
[inpage-format](https://github.com/ImadC9/inpage-format) and
[urdu-page](https://github.com/mubashir2k17/urdu-page) (both MIT), and the classic converters
listed in `src/utils/inpageText.ts`.

## Container

A `.inp` (or `.B01` backup) is an OLE compound file with:

| Stream | Written by | Text encoding |
| --- | --- | --- |
| `InPage100` | InPage 1.x, 2.x, 2000, XP 2004, 2005 | InPage's own: `04 xx` per Urdu letter (`05 xx` Sindhi, `07 xx` the Arabic set used for Arabic, Pashto, Kashmiri: Urdu codes), ASCII for English |
| `InPage300` | InPage 2009 and later | UTF-16LE |
| `DocumentInfo` | all | title, author |
| `PPicts…` | all, one per picture | Windows DIB without a file header |

Both document streams have the same structure, below. All numbers are little-endian; lengths and
positions are in **1/2000 point**.

## Tags

Most properties are tag–value pairs: `[key u8][group u8][value]`. The value is 2 bytes, or
4 bytes for these:

| Group | 4-byte keys |
| --- | --- |
| `00` | `80` (master reference / paragraph style), `82` (serial number) |
| `03` (text frame) | `01`, `02`, `06`, `08` |
| `05` (picture / shape) | `00`–`04` |
| `7c` (page) | `03`–`07` |
| `7e` (geometry, drawing) | `00`–`03`, `05`, `1a`–`1c` |
| `7f` (character / paragraph) | `00`, `05`, `06`, `21`, `48`, `81`–`83`, `8a`, `8b`, `8d`–`8f` |

`7e.1b` (polygon) and `05.00` (picture file names) are followed by that many bytes of data.

## 1. Document defaults

Near the start: page width, height and left/top/right/bottom margins as six consecutive tags
`06 01` … `0b 01`, each with a 4-byte value. Later, the default character and paragraph
properties start with the font selectors `00 02`, `01 02`, `02 02` and run up to the first
wrapped property (`9a 7f`/`9b 7f`). This is paragraph style 0 ("Normal").

The paragraph style sheet follows: one record per style,
`[u32 size][u16 1][u16 shortcut][u16 index][u16 1][u32 n][tags][e6 7f u32 name-length name]`.
`80.00` names the style it is based on.

## 2. Layout

From the first page record to the document name ("InPage Arabic Document"), one record per
object: `[kind u16][id u16][page u32][length u32][tags]`. Records may be separated by a 6-byte
group header or a 4-byte link-chain note.

| Kind | Object |
| --- | --- |
| 1 | page (`7c.03`–`06`: margins; `7c.07`: master page, only on real pages) |
| 3 | text frame (`03.05`: columns, `03.06`: gutter) |
| 4 | line (`x, y` to `x + w, y + h`) |
| 5 | box, ellipse, polygon (`05.05`: 0 box, 1 ellipse, 2 rounded, 6 polygon) or picture (`05.00` names its `PPicts…` stream) |
| 6 | guide |

Page 0 is the pasteboard, then the master pages, then the document's pages. Every object has
`80.00`: `ffffffff`, or for an object a master page placed on this page, the master object's id
(low word) and master page (high word); its tags override the master's.

Geometry is `7e.00`–`03` (x, y, width, height; width/height may be negative). A text frame
without geometry is the page's automatic text area inside the margins. Also: `7e.05` border
width, `7e.15` border style (0 none), `7e.0e` fill and `7e.07` line colour (index into the colour
table: None, White, Black, Gray, Red, Yellow, Green, Cyan, Blue, Magenta, …), `7e.1a` rotation in
1/1000 degree (anticlockwise about the top-left corner).

## 3. Fonts and text

The font table is `[u32 size]` then slots of 54 bytes (`InPage100`, ASCII names) or 86 bytes
(`InPage300`, UTF-16 names). Style runs select fonts by slot index (`02.02` Urdu/Arabic,
`02.01` English).

The text table follows directly:

- **InPage100:** `[u32 length][bytes ending in 0d]` per paragraph; `[u32 0][u8 flag]` between
  them, flag 0 ending a story. Then `ffffffff`.
- **InPage300:** `[u32 byte length]` per paragraph, `0` ending each story, then `ffffffff`, then
  all the paragraphs' UTF-16 text (each ending in CR).

A story is the text of one chain of linked frames. In the text, `0x02` is the page-number marker.

## 4. Style runs

Directly after the text (InPage100: after the `ffffffff`):
`[u32 byte count][u32 size][u16 1][u32 size − 6][tags]` until the runs cover the same bytes as
the text. `80.00` is the paragraph style; the other tags override it: `7f.00` size, `7f.01`
horizontal scale (1/1000), `7f.02` weight (≥ 600 bold), `7f.03` italic, `7f.05` baseline shift,
`7f.07` colour, `7f.80` alignment (0 left, 1 right, 2 centre, 3 justify, 4 force-justify),
`7f.8a` leading.

## 5. Saved layout

`ffffffff`, `u16`, then 62-byte records starting with `u32 50`: for each story, one record per
frame (or column) it flows through, then an empty record. In each: `+4` height of text in this
frame, `+12` frame content height, `+16` column width, `+28` frame object id, `+30` page.

Then `ffffffff 00000000 00000000` (InPage300: `ffffffff 00000000` and a `u32`) and one record
per line, covering the text bytes in order: `[u32 bytes][u32 height][u32 flags][u32 size]` then
`size` bytes: baseline, `u16` run count at `+20`, and runs of 30 bytes (InPage300: 34) starting
with the run kind (`7f80` English, `7f85` Urdu/Arabic, `7f87` table cells, …). Empty lines have
size 8.

The importer gives every frame the lines whose heights add up to the height InPage used there,
so text breaks between linked frames, and between pages, exactly where InPage broke it. Line
heights also give each paragraph its exact position inside the frame.

## What the importer does with it

- **Per-word formatting:** each piece of text keeps its style run's font, size, weight, italic and
  colour where they differ from its block's (`TextElement.runs`).
- **Tables:** lines whose runs are table cells (`7f87`) carry each cell's edges (`+8`/`+12`, from the
  right, in reading order). A run of rows with two or more cells becomes a table with those column
  widths; a row that is one cell spanning the table stays a line of text.
- **Pictures:** `05.01`/`05.02` place the image inside the frame (from inside its border), at its
  natural size `05.03`/`05.04` (1/2000 pt) times `05.08`/`05.09` (thousandths); the frame crops it.
  `05.0d` is 8 bytes and `05.0f` 4 bytes wide.
- **Text wrap:** a line's available width (`+28`) is less than the column where it wraps around
  an object; its run extents (`+8`/`+12` from the column's left) show which side it was set on. Such
  lines are placed one by one in that space. Multi-column frames are laid out column by column.

## Writing (.inp)

`src/utils/inpageWriter.ts` writes InPage100 files. Parts not understood are copied from InPage's
own sample document FONTS.INP (`src/utils/inpageTemplate.ts`: header and preferences, colour table,
defaults, style sheet, font table, record layouts; none of its text). Written from the document:
page size and margins (defaults and page records), one page per page (object numbers continue the
template's sequence), the text as one story through the master page's text frame, style runs, saved
frames, and one saved line per paragraph, so InPage sets the lines itself. The section table at
`0x10` (`[u16 id][u32 end]` × 7) and the main section's story count are updated. Frame positions,
pictures and shapes aren't written. Not yet tried in InPage itself.

## Not read yet

Table cell borders (where InPage keeps them hasn't been found; tables come in without, as InPage's
own output of the sample tables shows), merged table cells, kashida justification, and the
contour of text wrap (the space beside the object is used, not its exact outline).
