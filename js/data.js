/* data.js — loads the normalisation reference database and exposes shared state. */
window.ALV = window.ALV || {};

ALV.db = null;           // parsed normalisation database
ALV.dataset = null;      // parsed user dataset (see parse.js)

ALV.UNITS = [
  { id: "mg/kg", label: "mg/kg (yield per mass ash)", perMass: true,  factorToMgkg: 1 },
  { id: "ug/kg", label: "µg/kg (yield per mass ash)", perMass: true,  factorToMgkg: 0.001 },
  { id: "mg/L",  label: "mg/L (leachate solution)",   perMass: false, factorToMgkg: null },
  { id: "ug/L",  label: "µg/L (leachate solution)",   perMass: false, factorToMgkg: null }
];

/* Parse an "ash:water" ratio string like "1:25" into mL water per g ash (= L/kg). */
ALV.ratioFactor = function (ratioStr) {
  const m = /^\s*1\s*:\s*([\d.]+)\s*$/.exec(ratioStr || "");
  return m ? parseFloat(m[1]) : null;
};

ALV.loadDatabase = async function () {
  const res = await fetch("data/normalization_ayris_delmelle_2012.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load normalisation database (HTTP " + res.status + ").");
  ALV.db = await res.json();
  return ALV.db;
};

/* Elements known to the reference DB, in scientific (sort) order. */
ALV.dbElements = function () {
  if (!ALV.db) return [];
  return Object.keys(ALV.db.elements).sort(
    (a, b) => ALV.db.elements[a].sort - ALV.db.elements[b].sort
  );
};

/* Reference median for an element under a given composition, with fallback to "all". */
ALV.referenceValue = function (el, composition) {
  const e = ALV.db && ALV.db.elements[el];
  if (!e || !e.reference) return null;
  if (composition && e.reference[composition] != null) return e.reference[composition];
  return e.reference.all != null ? e.reference.all : null;
};
