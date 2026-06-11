/* app.js — UI wiring and orchestration. */
window.ALV = window.ALV || {};

const $ = (sel) => document.querySelector(sel);

function readOptions() {
  return {
    valueType:   document.querySelector('input[name="valuetype"]:checked').value,
    elements:    document.querySelector('input[name="elements"]:checked').value,
    yscale:      document.querySelector('input[name="yscale"]:checked').value,
    unitId:      $("#sel-units").value,
    ratio:       $("#sel-ratio").value,
    composition: $("#sel-composition").value
  };
}

function setStatus(html) { $("#data-status").innerHTML = html; }

function compositionLabel(c) {
  if (c === "all") return "All data (basalt → rhyolite)";
  return c.replace(/(^|-)\w/g, (m) => m.toUpperCase()).replace(/-/g, " ");
}

function populateControls() {
  const m = ALV.db.metadata;

  ALV.UNITS.forEach((u) => {
    $("#sel-units").add(new Option(u.label, u.id));
  });

  m.ash_water_ratios.forEach((r) => $("#sel-ratio").add(new Option(r, r)));
  $("#sel-ratio").value = m.ash_water_ratios[Math.min(2, m.ash_water_ratios.length - 1)];

  m.compositions.forEach((c) => $("#sel-composition").add(new Option(compositionLabel(c), c)));
  $("#sel-composition").value = "all";

  $("#ref-citation").textContent = m.source_citation;
  const badge = $("#ref-status");
  if (m.verified) { badge.textContent = "verified data"; badge.className = "ref-status verified"; }
  else { badge.textContent = "placeholder data — verify before publication"; badge.className = "ref-status placeholder"; }
}

function renderPreview(ds) {
  const cols = ["sample_id", ...ds.elements];
  const head = "<tr>" + cols.map((c) => `<th>${c}</th>`).join("") + "</tr>";
  const body = ds.samples.slice(0, 8).map((s) => {
    const cells = ds.elements.map((el) => {
      const v = s.values[el];
      if (!v) return "<td>·</td>";
      return v.bdl ? `<td class="bdl">&lt;${v.dl}</td>` : `<td>${v.value}</td>`;
    });
    return `<tr><td>${s.id}</td>${cells.join("")}</tr>`;
  }).join("");
  $("#preview-table").innerHTML = head + body;
  $("#preview-summary").textContent =
    `${ds.sampleCount} samples · ${ds.elements.length} elements` +
    (ds.samples.length > 8 ? " (showing first 8)" : "");
  $("#preview").classList.remove("is-hidden");
}

function ingest(text) {
  try {
    const ds = ALV.parseCSV(text);
    ALV.dataset = ds;
    renderPreview(ds);
    $("#btn-create").disabled = false;

    let msg = `<span class="ok">✓ Loaded ${ds.sampleCount} samples, ${ds.elements.length} recognised elements.</span>`;
    const notes = [];
    if (ds.bdlCount) notes.push(`<span class="warn">${ds.bdlCount} below-detection values → substituted with ½ × limit.</span>`);
    if (ds.unknownColumns.length) notes.push(`<span class="warn">Ignored unrecognised columns: ${ds.unknownColumns.join(", ")}.</span>`);
    if (notes.length) msg += "<ul><li>" + notes.join("</li><li>") + "</li></ul>";
    setStatus(msg);
  } catch (e) {
    ALV.dataset = null;
    $("#btn-create").disabled = true;
    $("#preview").classList.add("is-hidden");
    setStatus(`<span class="err">✗ ${e.message}</span>`);
  }
}

function createPlot() {
  if (!ALV.dataset) return;
  const opts = readOptions();
  const built = ALV.buildSeries(ALV.dataset, opts);

  if (!built.elements.length) {
    setStatus(`<span class="err">✗ No elements to plot with the current options.</span>`);
    return;
  }
  if (built.warnings.length) {
    setStatus(`<span class="warn">⚠ ${built.warnings.join(" ")}</span>`);
  }

  $("#plot-empty").classList.add("is-hidden");
  ALV.renderPlot(built, opts);
  $("#downloads").classList.remove("is-hidden");
  $("#methods-text").textContent = ALV.buildMethods(ALV.dataset, built, opts);
}

function wireEvents() {
  // Tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", t === tab);
      });
      $("#panel-upload").classList.toggle("is-hidden", tab.id !== "tab-upload");
      $("#panel-paste").classList.toggle("is-hidden", tab.id !== "tab-paste");
    });
  });

  // File upload + drag/drop
  const dz = $("#dropzone"), fileInput = $("#file-input");
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) f.text().then(ingest);
  });
  ["dragover", "dragenter"].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("is-drag"); }));
  ["dragleave", "drop"].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("is-drag"); }));
  dz.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0];
    if (f) f.text().then(ingest);
  });

  // Paste
  $("#btn-parse-paste").addEventListener("click", () => {
    const t = $("#paste-area").value.trim();
    if (t) ingest(t);
  });

  // Example data
  $("#btn-example").addEventListener("click", () => {
    fetch("data/example_leachate.csv").then((r) => r.text()).then(ingest);
  });

  // Create + downloads
  $("#btn-create").addEventListener("click", createPlot);
  $("#btn-png").addEventListener("click", () => ALV.downloadImage("png"));
  $("#btn-svg").addEventListener("click", () => ALV.downloadImage("svg"));
  $("#btn-csv").addEventListener("click", () => ALV.downloadCSV());

  // Re-render live when options change (only after a first plot exists)
  document.querySelectorAll('input[name], #sel-units, #sel-ratio, #sel-composition')
    .forEach((el) => el.addEventListener("change", () => { if (ALV.lastPlot) createPlot(); }));

  // Normalisation hint visibility
  document.querySelectorAll('input[name="valuetype"]').forEach((r) =>
    r.addEventListener("change", () => {
      $("#hint-norm").style.display =
        readOptions().valueType === "normalized" ? "block" : "none";
    }));

  // Copy methods
  $("#btn-copy-methods").addEventListener("click", () => {
    navigator.clipboard.writeText($("#methods-text").textContent).then(() => {
      const b = $("#btn-copy-methods"); const old = b.textContent;
      b.textContent = "Copied ✓";
      setTimeout(() => (b.textContent = old), 1500);
    });
  });
}

(async function init() {
  try {
    await ALV.loadDatabase();
    populateControls();
    wireEvents();
  } catch (e) {
    setStatus(`<span class="err">✗ ${e.message}</span>`);
  }
})();
