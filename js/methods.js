/* methods.js — generate a copy-pasteable methods paragraph from the current options. */
window.ALV = window.ALV || {};

ALV.compositionPhrase = function (c) {
  if (!c || c === "all") return "samples spanning the full compositional range (basalt to rhyolite)";
  return c + " samples";
};

ALV.buildMethods = function (dataset, built, opts) {
  const meta = ALV.db.metadata;
  const nSamples = dataset.sampleCount;
  const nElements = built.elements.filter((el) => built.series[el] && built.series[el].length).length;
  const elList = built.elements.filter((el) => built.series[el].length).join(", ");

  const parts = [];
  parts.push(
    `Water-soluble element concentrations were determined for ${nSamples} volcanic ash leachate ` +
    `sample${nSamples === 1 ? "" : "s"} (${ALV.compositionPhrase(opts.composition)}), ` +
    `prepared at an ash:water ratio of ${opts.ratio}.`
  );

  if (opts.valueType === "normalized") {
    parts.push(
      `Concentrations were expressed as soluble yields (mg/kg ash) and normalised to the global ` +
      `volcanic ash leachate reference of ${meta.source_citation} (doi:${meta.doi}), such that a ` +
      `normalised value of 1 corresponds to the global reference median for each element.`
    );
  } else {
    parts.push(`Concentrations are reported in ${opts.unitId}.`);
  }

  parts.push(
    `Data are shown as box-and-whisker plots (box = interquartile range, line = median, ` +
    `whiskers = full range), with individual sample values overlaid, for the following ` +
    `element${nElements === 1 ? "" : "s"}: ${elList}.`
  );

  if (dataset.bdlCount) {
    parts.push(
      `${dataset.bdlCount} value${dataset.bdlCount === 1 ? " was" : "s were"} below the analytical ` +
      `detection limit and substituted with one half of the reported limit.`
    );
  }

  parts.push(
    `Figures were generated with the Ash Leachate Visualiser` +
    (meta.verified ? "" : " (using placeholder reference values — verify before publication)") + `.`
  );

  return parts.join(" ");
};
