# Group Address Manager

A dependency-free editor for **KNX group addresses** that imports and exports the
**ETS 6 group address export format** (`http://knx.org/xml/ga-export/01`).

Create, edit and delete main groups, middle groups and subgroups, attach
DataPoint types, then hand the result straight back to ETS — or keep working
offline and export a project file for your own backup.

```
0/0/1   1  Lights     1  Ground floor     1  Kitchen - ceiling light     DPST-1-001
0/0/2   1  Lights     1  Ground floor     2  Kitchen - ceiling light     DPST-1-011
1/0/5   2  Heating    1  Room setpoints    5  Heating - valve drive       DPST-5-001
```

## Why this project

* **No installation, no build step, no dependencies.** Plain HTML, CSS and
  JavaScript in small modules that are loaded as ordinary scripts. Open
  `index.html` and it runs — from a web server, from GitHub Pages, or straight
  from the file system.
* **Nothing leaves your machine.** There is no backend and no telemetry; the
  data lives in `localStorage` and in files you download yourself.
* **It cannot silently destroy your work.** Every change is validated before it
  is applied, imports are previewed first, and destructive actions can be undone.

## Features

### Group addresses

* Three-level group addresses (`main / middle / subgroup`) with indices
  `1–32`, `1–8` and `0–255`.
* Create, rename, move and delete entries — including renaming a main or middle
  group in place.
* Automatic sorting by address, live "next free index" hints and a live preview
  of the group address while you type.
* Full validation with inline field errors instead of popup alerts:
  required names, index ranges, a subgroup name without an index, and
  **duplicate group addresses**.
* Deleting the last address of a group cleans up the group structure that is
  left empty (and tells you about it).

### DataPoint types

* The KNX DataPoint Type catalogue with **352 entries** (`DPST-…` ids), grouped
  by main type.
* Filter box that searches by id or symbolic name (`1-001`, `switch`, …).
* Multiple DataPoint types per address (as used by ETS) are preserved on
  import, and types that are not in the catalogue are kept instead of dropped.

### Import & export

* **Import XML** — ETS group address export. The file is parsed and summarised
  in a preview dialog (counts and warnings) **before** anything is replaced.
* **Export XML** — writes `group_addresses.xml` in the ETS format, fully
  namespace-correct and with escaped attribute values.
* **Import / export project** — a JSON file (`group_addresses.project.json`)
  for backups and version control.
* **Undo last change** — restores the state from before the last import,
  deletion or reset.

### Quality of life

* Automatic saving to `localStorage`, so a reload does not lose anything.
* Native `<dialog>` modal confirmations for destructive actions.
* Toast notifications, an empty state, a summary line with the number of
  groups, and a responsive layout with a light and dark theme.
* Keyboard and screen-reader friendly: real `<form>` (Enter submits), `<label>`
  for every field, `aria-invalid` + error text on invalid fields, focus
  management in dialogs, `Esc` closes them.

## Quick start

```text
1. Download or clone the repository.
2. Open index.html in a modern browser.
```

That is the whole setup. Optionally serve the folder with any static server
(VS Code *Live Server*, `python -m http.server`, …) — it makes no difference,
because the application has no build step and needs no server-side code.

To publish it, enable GitHub Pages for the repository root — `index.html` is
already the entry point.

## Usage

| Step | What to do |
| --- | --- |
| Add an address | Fill in main group name + index, middle group name + index, optionally a subgroup name and index, pick a DataPoint type, press **Add group address**. |
| Add a group without an address | Leave the subgroup name and index empty. The middle group is created and shown as “no subgroups”. |
| Edit | **Edit** in the row. The form is pre-filled, the row is highlighted and the button becomes **Save changes**. Renames, index changes (moves) and DataPoint types are all applied on save. |
| Cancel an edit | **Cancel edit** (or `Esc`-free: just press the button) — nothing is changed. |
| Delete | **Delete** in the row, then confirm. |
| Reorder | Change an index — the table is always sorted by address. |

### Group address format

The three indices are exactly the fields of a KNX group address:

| Field | Range in this editor | Notes |
| --- | --- | --- |
| Main group | `1 – 32` | 5 bits, stored as `main - 1` in the address |
| Middle group | `1 – 8` | 3 bits, stored as `middle - 1` in the address |
| Subgroup | `0 – 255` | 8 bits, stored as-is (so `1/1/0` is a valid address) |

The address string in the export and in the table is
`(main - 1) / (middle - 1) / subgroup` (for example `0/0/1`), and the numeric
address is `(main - 1) × 2048 + (middle - 1) × 256 + subgroup`.

### Import rules

An import never happens silently. The file is parsed and validated first, and
the preview shows what will be imported and what was unusual about it.

* Group and address values are read from `Name`, `RangeStart` and `Address`.
* Namespace prefixes are supported (`<knx:GroupRange>`), and the parser is
  namespace-agnostic — it matches by local name.
* `RangeStart` is used to derive the main/middle index; when it is missing, the
  indices are assigned in file order and a warning is shown.
* The `Address` attribute wins over the range it is listed in. If the two
  disagree, the entry is filed under the address it actually points to and a
  warning explains it.
* Missing `Address` attributes are numbered sequentially, duplicates are
  ignored — both with a warning.
* **Two-level addresses (`0/1`) are rejected** with a clear message instead of
  being converted into something wrong. This editor supports three-level
  addresses only.
* Broken XML, an empty file or a file without `<GroupRange>` elements are
  refused — your current data is untouched.
* The file is parsed with `DOMParser`, which never resolves external entities
  or fetches anything referenced by the document.
* If the import is cancelled, nothing is written and the undo slot is left
  untouched.

### Export

The generated file follows the ETS structure:

```xml
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<GroupAddress-Export xmlns="http://knx.org/xml/ga-export/01">
  <GroupRange Name="Lighting" RangeStart="0" RangeEnd="2047">
    <GroupRange Name="Ground floor" RangeStart="0" RangeEnd="255">
      <GroupAddress Name="Kitchen - ceiling light - switch" Address="0/0/1" DPTs="DPST-1-001"/>
    </GroupRange>
  </GroupRange>
</GroupAddress-Export>
```

The document is built with `XMLSerializer` and then formatted, so names
containing `&`, `<`, `>`, `"`, `'` or non-ASCII characters are escaped
correctly and cannot corrupt the file. A name containing `>` cannot break the
indentation either — the formatter is quote-aware.

## Data, storage and privacy

* The working data is stored in `localStorage` under `gam:tree:v1`.
* The undo snapshot lives in `gam:snapshot:v1` / `gam:snapshot:label`.
* Nothing is sent anywhere. There is no analytics, no CDN and no external
  request at runtime.
* If `localStorage` is unavailable (private mode, `file://` restrictions), the
  application keeps working in memory and tells you to export your work.

## Tests

The test suite runs in the browser — no Node.js required:

```text
Open tests/tests.html
```

42 tests cover the address helpers, validation, add/rename/move/delete
behaviour (including the “validation must not destroy data” guarantee), JSON
import, XML round trips, escaping, namespace prefixes, broken files, two-level
files, duplicate and mismatched addresses, and the DataPoint catalogue.

`tests/fixtures/sample-ets-export.xml` is a realistic export that can be used
to exercise the import flow manually.

## Project structure

```text
index.html                  markup, form and table
styles.css                  theming (light/dark), layout, components
src/
  dpt-types.js              KNX DataPoint Type catalogue (352 entries)
  dpt.js                    catalogue helpers (lookup, filter, grouping)
  tree.js                   group address model: validation and mutations
  xml.js                    ETS XML import/export (DOMParser/XMLSerializer)
  storage.js                localStorage, undo snapshot, downloads, file reading
  dialog.js                 modal dialogs on the native <dialog> element
  ui.js                     form handling, table rendering, import/export flows
  main.js                   bootstrap and error reporting
tests/
  tests.html                test runner page
  tests.js                  the test suite
  fixtures/                 example ETS export for manual testing
```

The modules communicate through one global namespace (`window.GAM`) and are
loaded in order by `index.html`. That keeps the project runnable straight from
the file system while the code stays split by responsibility.

## Browser support

Recent versions of Chrome, Edge, Firefox and Safari. The application uses
`<dialog>`, `:has()`, `Set`/`Map`, template-free DOM building and CSS custom
properties. Everything that matters keeps working if `:has()` or `<dialog>` is
unsupported (dialogs then fall back to the native `confirm`/`alert`).

## Limitations

* Three-level group addresses only — two-level files are refused, not converted.
* No ETS project (`.knxproj`) import; only the group address export.
* No multi-select, drag & drop or bulk edit.
* No import of multiple files at once.

## Roadmap

* Import of two-level addresses with an explicit conversion step.
* Drag & drop reordering and multi-select actions.
* Excel/CSV import and export for documentation purposes.
* Optional migration to ES modules with Vite + Vitest once a Node toolchain is
  available in the development environment (the current setup deliberately
  needs none).
* Internationalisation (the UI is English only).

## Contributing

Issues and pull requests are welcome. Please keep the project dependency-free
and make sure `tests/tests.html` still passes before opening a pull request.

## License

[MIT](LICENSE) © 2026 Shahidsamadov.
