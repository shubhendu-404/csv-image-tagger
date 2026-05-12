# Image Tagger

A fast, keyboard-driven web app for bulk-tagging and sorting product images from CSV exports. Upload any product CSV, tag images at speed using hotkeys, and export a filtered CSV or image URL list.

---

## Purpose

Reviewing and removing unwanted product images manually through a Shopify admin is slow. This tool lets you load a full product export, tag each image (remove, keep, review, etc.) using keyboard shortcuts, and export a clean filtered CSV — without touching the admin.

Designed for speed: multi-select images, press a number key, move to next product with spacebar. No mouse required once you're in the tagger.

---

## Setup

**Requirements:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs at `http://localhost:5173`.

**Build for production:**

```bash
npm run build
# Output in dist/ — serve with any static host
npm run preview  # preview production build locally
```

---

## Usage

### 1. Upload CSV

Drag and drop (or click to browse) any product CSV file. The app auto-detects image URLs from all columns — no column name assumptions. Works with Shopify full exports and any custom product CSV that contains image URLs.

### 2. Setup Tags

Create up to 9 tags before starting. Each tag is automatically assigned a number key (1–9).

**Quick presets:** Remove · Keep · Review · Blurry · Duplicate

Tags have auto-assigned colors. You can remove and reorder tags before starting.

### 3. Tag Images

Products are shown one at a time. All detected images appear in a grid. Key-value metadata is displayed at the top.

#### Selecting images

| Action | Result |
|--------|--------|
| `Click` | Toggle select/deselect |
| `Shift + Click` | Range select |
| `Ctrl + A` | Select all images |
| `Esc` | Deselect all |

#### Applying tags

| Key | Action |
|-----|--------|
| `1` – `9` | Apply that tag to all selected images |
| `0` | Remove tags from selected images (if any selected) |
| `0` | Remove **all** tags from current product (if nothing selected) |

Tags are applied instantly and selection is cleared — ready for the next batch.

#### Navigation

| Key | Action |
|-----|--------|
| `Space` or `Enter` | Next product |
| `Backspace` | Previous product |
| Click the counter `12 / 340` | Jump to any product by number |

#### Typical speed workflow

```
Product loads
→ Click first bad image
→ Shift+Click last bad image   (range selects all in between)
→ Press 1                      (tags all as "Remove", deselects)
→ Press Space                  (next product)
```

Or:

```
→ Ctrl+A                       (select all)
→ Press 2                      (tag all as "Keep")
→ Click exceptions             (toggle-deselect good ones)
→ Press 1                      (tag exceptions as "Remove")
→ Press Space
```

### 4. Export

Click **Export** in the top-right at any time (progress is not lost).

#### Option A — Filtered CSV

Select which tags to remove. Downloads a modified version of your original CSV with those image columns cleared and compacted. Ready to re-import.

#### Option B — Tagged Image URL List

Downloads `tagged_images.csv` with all tagged image URLs, their tag name, source column, and product reference. Useful for bulk delete scripts or further processing.

---

## CSV Compatibility

- One row per product (standard Shopify full export format)
- Image URLs are auto-detected from any column by URL pattern (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.svg`)
- All non-image columns are shown as key-value metadata
- Original column structure is preserved in filtered CSV export

---

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- PapaParse (CSV parsing)
- Pure frontend — no backend, no data leaves your browser
