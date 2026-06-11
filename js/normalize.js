/* normalize.js — unit conversion + normalisation to the reference database. */
window.ALV = window.ALV || {};

/* Convert a per-sample value (in the user's units) to mg/kg ash yield.
   Per-volume units (mg/L, µg/L) require the ash:water ratio. */
ALV.toMgkg = function (value, unitId, ratioFactor) {
  const u = ALV.UNITS.find((x) => x.id === unitId);
  if (!u) return null;
  if (u.perMass) return value * u.factorToMgkg;
  if (ratioFactor == null) return null;            // cannot convert without ratio
  const perVolFactor = unitId === "ug/L" ? 0.001 : 1;
  return value * perVolFactor * ratioFactor;        // (mg/L) × (L/kg) = mg/kg
};

/*
 * Build plot-ready series.
 * opts: { valueType:'absolute'|'normalized', elements:'data'|'all',
 *         unitId, ratio, composition }
 * Returns { elements:[...], series:{el:[numbers...]}, axisLabel, normalize, warnings:[] }
 */
ALV.buildSeries = function (dataset, opts) {
  const warnings = [];
  const ratioFactor = ALV.ratioFactor(opts.ratio);

  let elements =
    opts.elements === "all" ? ALV.dbElements() : dataset.elements.slice();

  const normalize = opts.valueType === "normalized";

  if (normalize && !(ALV.UNITS.find((u) => u.id === opts.unitId) || {}).perMass && ratioFactor == null) {
    warnings.push("A valid ash:water ratio is required to normalise per-volume (mg/L) data.");
  }

  const series = {};
  elements.forEach((el) => {
    const vals = [];
    dataset.samples.forEach((s) => {
      const cell = s.values[el];
      if (!cell) return;
      if (!normalize) {
        vals.push(cell.value);                      // absolute, in user units
      } else {
        const mgkg = ALV.toMgkg(cell.value, opts.unitId, ratioFactor);
        const ref = ALV.referenceValue(el, opts.composition);
        if (mgkg != null && ref) vals.push(mgkg / ref);
      }
    });
    series[el] = vals;
  });

  // When showing "only my elements", drop empties; for "all", keep so gaps are visible.
  if (opts.elements === "data") elements = elements.filter((el) => series[el].length);

  const axisLabel = normalize
    ? "Concentration / global reference (Ayris & Delmelle, 2012)"
    : "Concentration (" + opts.unitId + ")";

  return { elements, series, axisLabel, normalize, warnings };
};
