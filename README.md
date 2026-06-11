# Ash Leachate Visualiser

A browser-based tool for plotting volcanic ash leachate chemistry. Users upload or
paste single-element concentration data and, with one click, generate a
publication-quality box-and-whisker figure — as **absolute** values or **normalised**
to a global reference database (Ayris & Delmelle, 2012). It also produces a
copy-pasteable **methods paragraph**.

Everything runs **client-side** — no server, no data leaves the browser — so it can be
hosted free on GitHub Pages and embedded in a Drupal (or any) website via an `<iframe>`.

## Features

- Upload a CSV or paste data; downloadable template + example dataset.
- Live data preview with validation (unrecognised columns, below-detection-limit values).
- Toggles: absolute ↔ normalised, all elements ↔ only-my-elements, units, ash:water
  ratio, magmatic composition (basalt → rhyolite, default *all data*), log/linear y-axis.
- Box-and-whisker plots (median, IQR, range) with individual points overlaid.
- Export **PNG** (raster) and **SVG** (vector, for journals), plus a **processed CSV**
  of the per-element summary statistics.
- Auto-generated, options-aware methods text with a copy button.

## Data format

One row per sample. First column is the sample identifier; each remaining column is an
element symbol (`Cl`, `F`, `SO4`, `Ca`, `As`, …). Blank cells = not measured.
Below-detection values may be written as `<0.01`. See [`data/template.csv`](data/template.csv)
and [`data/example_leachate.csv`](data/example_leachate.csv).

| sample_id | Cl  | F    | SO4 | Ca  | As    |
|-----------|-----|------|-----|-----|-------|
| ASH-01    | 118 | 42.1 | 265 | 141 | 0.071 |

## ⚠ Reference database — placeholder values

`data/normalization_ayris_delmelle_2012.json` has the correct **structure** and element
list, but the numeric reference medians are **illustrative placeholders**. Replace them
with the verified values from Ayris & Delmelle (2012), then set `"verified": true` in the
file's metadata. Until then, normalised plots and the methods text are flagged accordingly.

## Local development

No build step. Serve the folder over HTTP (needed for `fetch` of the data files):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying on GitHub Pages

1. Push to `main`.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   The included workflow (`.github/workflows/deploy-pages.yml`) publishes the site.

## Embedding in Drupal

```html
<iframe src="https://<user>.github.io/ash_leachate_vis_02/"
        title="Ash Leachate Visualiser"
        style="width:100%; min-height:1100px; border:0;" loading="lazy"></iframe>
```

## Stack

Plain HTML/CSS/JS · [PapaParse](https://www.papaparse.com/) (CSV) ·
[Plotly.js](https://plotly.com/javascript/) (plots) — both via CDN.
