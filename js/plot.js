/* plot.js — render box-and-whisker plots with Plotly. */
window.ALV = window.ALV || {};

ALV.CATEGORY_COLORS = {
  "halogen":        "#2b6777",
  "anion":          "#3a7d8c",
  "alkali":         "#8e6cae",
  "alkaline-earth": "#5a7d3c",
  "major":          "#777f8a",
  "metalloid":      "#c98a1b",
  "trace-metal":    "#b4471f"
};

ALV.lastPlot = null;   // { built, opts } for export

ALV.renderPlot = function (built, opts) {
  const traces = built.elements.map((el) => {
    const cat = (ALV.db.elements[el] || {}).category || "major";
    return {
      type: "box",
      name: el,
      y: built.series[el],
      boxpoints: "all",
      jitter: 0.4,
      pointpos: 0,
      marker: { size: 4, color: ALV.CATEGORY_COLORS[cat], opacity: 0.55 },
      line: { color: ALV.CATEGORY_COLORS[cat] },
      fillcolor: ALV.CATEGORY_COLORS[cat] + "22",
      hovertemplate: el + "<br>%{y:.3g}<extra></extra>"
    };
  });

  const layout = {
    margin: { l: 64, r: 18, t: 16, b: 56 },
    showlegend: false,
    font: { family: "-apple-system, Segoe UI, Roboto, sans-serif", size: 13, color: "#1b2733" },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    xaxis: { title: { text: "Element", font: { size: 13 } }, tickfont: { size: 12 }, automargin: true },
    yaxis: {
      title: { text: built.axisLabel, font: { size: 13 } },
      type: opts.yscale === "log" ? "log" : "linear",
      zeroline: false,
      gridcolor: "#eef2f5"
    }
  };

  // Reference line at 1.0 for normalised plots.
  if (built.normalize) {
    layout.shapes = [{
      type: "line", xref: "paper", x0: 0, x1: 1, yref: "y", y0: 1, y1: 1,
      line: { color: "#c0392b", width: 1.2, dash: "dash" }
    }];
    layout.annotations = [{
      xref: "paper", x: 1, y: 1, yref: "y", text: "global reference", showarrow: false,
      xanchor: "right", yanchor: "bottom", font: { size: 10, color: "#c0392b" }
    }];
  }

  const config = { responsive: true, displaylogo: false, displayModeBar: false };
  Plotly.react("plot", traces, layout, config);
  ALV.lastPlot = { built, opts };
};

ALV.downloadImage = function (format) {
  if (!ALV.lastPlot) return;
  Plotly.downloadImage("plot", {
    format: format,            // 'png' or 'svg'
    filename: "ash_leachate_" + (ALV.lastPlot.opts.valueType),
    width: 1200, height: 700, scale: format === "png" ? 2 : 1
  });
};

ALV.downloadCSV = function () {
  if (!ALV.lastPlot) return;
  const { built } = ALV.lastPlot;
  const rows = [["element", "n", "min", "q1", "median", "q3", "max"]];
  built.elements.forEach((el) => {
    const v = built.series[el].slice().sort((a, b) => a - b);
    if (!v.length) return;
    const q = (p) => {
      const i = (v.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
      return v[lo] + (v[hi] - v[lo]) * (i - lo);
    };
    rows.push([el, v.length, v[0], q(0.25), q(0.5), q(0.75), v[v.length - 1]]
      .map((x) => (typeof x === "number" ? +x.toFixed(4) : x)));
  });
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ash_leachate_processed.csv";
  a.click();
  URL.revokeObjectURL(a.href);
};
