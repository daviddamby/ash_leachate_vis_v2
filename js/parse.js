/* parse.js — turn raw CSV text into a validated dataset. */
window.ALV = window.ALV || {};

/* A parsed value can be a number, or a below-detection-limit marker. */
function parseCell(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "" || /^(na|nd|n\/a|\.)$/i.test(s)) return null;        // missing
  const bdl = /^[<≤]\s*([\d.]+)/.exec(s);                            // "<0.01"
  if (bdl) return { bdl: true, dl: parseFloat(bdl[1]), value: parseFloat(bdl[1]) / 2 };
  const num = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(num) ? { bdl: false, value: num } : null;
}

/* Normalise a header token to a known element symbol (case-insensitive). */
function matchElement(header) {
  const h = String(header).trim();
  const known = ALV.db ? Object.keys(ALV.db.elements) : [];
  return known.find((e) => e.toLowerCase() === h.toLowerCase()) || null;
}

/*
 * Returns { samples:[{id, values:{el:{value,bdl,dl}}}], elements:[...],
 *           unknownColumns:[...], bdlCount:int, sampleCount }
 */
ALV.parseCSV = function (text) {
  const out = Papa.parse(text.trim(), { header: true, skipEmptyLines: "greedy" });
  if (!out.data.length) throw new Error("No rows found in the data.");

  const fields = out.meta.fields || [];
  // First column (or one literally named sample*) is the sample identifier.
  const idField =
    fields.find((f) => /^(sample[_\s-]?id|sample|id|name)$/i.test(f)) || fields[0];

  const elementCols = [];   // [{field, el}]
  const unknownColumns = [];
  fields.forEach((f) => {
    if (f === idField) return;
    const el = matchElement(f);
    if (el) elementCols.push({ field: f, el });
    else if (f.trim() !== "") unknownColumns.push(f);
  });

  const samples = [];
  const elementsPresent = new Set();
  let bdlCount = 0;

  out.data.forEach((row, i) => {
    const id = (row[idField] || "").toString().trim() || "sample_" + (i + 1);
    const values = {};
    elementCols.forEach(({ field, el }) => {
      const cell = parseCell(row[field]);
      if (cell) {
        values[el] = cell;
        elementsPresent.add(el);
        if (cell.bdl) bdlCount++;
      }
    });
    if (Object.keys(values).length) samples.push({ id, values });
  });

  if (!samples.length) throw new Error("No numeric element data could be read.");
  if (!elementsPresent.size)
    throw new Error("No recognised element columns found. Use symbols such as Cl, F, SO4, Ca …");

  return {
    samples,
    elements: [...elementsPresent].sort(
      (a, b) => ALV.db.elements[a].sort - ALV.db.elements[b].sort
    ),
    unknownColumns,
    bdlCount,
    sampleCount: samples.length
  };
};
