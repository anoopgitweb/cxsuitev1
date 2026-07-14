(() => {
  const get = (id) => document.getElementById(id);
  const safe = (value) => typeof escapeHtml === "function" ? escapeHtml(String(value ?? "")) : String(value ?? "");
  const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const fixed = (value, digits = 2) => numeric(value) == null ? "Not available" : numeric(value).toFixed(digits);
  const pct = (value) => numeric(value) == null ? "Not available" : fixed(value) + "%";
  const model = () => state?.analysis?.evidenceRelationship || {};
  const backendRows = () => Array.isArray(model().dimensions) ? model().dimensions : [];
  const sourceRows = () => typeof resultAllRows === "function" ? resultAllRows() : (state?.analysis?.feedbackRows || state?.analysis?.preview || []);
  const setupDimensions = () => {
    const analysis = state?.analysis || {};
    const cache = typeof readSetupCache === "function" ? readSetupCache() : {};
    const mapping = analysis.mapping || cache.mapping || {};
    const payload = (analysis.dynamicDimensions || []).map((item) => typeof item === "string" ? item : item?.name);
    const mapped = [mapping.agent ? "Agent Name" : "", mapping.manager ? "Manager/TL" : "", mapping.wave ? "Wave" : "", mapping.tenure ? "Tenure" : ""];
    const configured = typeof dashboardMakerSetupDimensionColumns === "function" ? dashboardMakerSetupDimensionColumns() : [];
    return Array.from(new Set([...(model().selectedDimensions || []), ...(analysis.selectedDimensionColumns || []), ...payload, ...(state.dynamicDimensions || []), ...(cache.dynamicDimensions || []), ...mapped, ...configured]
      .map((value) => String(value || "").trim()).filter(Boolean)));
  };
  const outcomeValue = (row) => {
    const label = String(row?.["NPS Type"] || "").trim().toLowerCase();
    return label === "promoter" ? 100 : label === "passive" ? 0 : label === "detractor" ? -100 : null;
  };
  function recoveredRows() {
    const dataRows = sourceRows();
    const minimum = Number(model().minimumSample || 5);
    if (!dataRows.length) return [];
    return setupDimensions().map((dimension) => {
      const groups = new Map();
      let populated = 0;
      dataRows.forEach((row) => {
        const value = String(row?.[dimension] ?? "").trim();
        const outcome = outcomeValue(row);
        if (!value || outcome == null) return;
        populated += 1;
        if (!groups.has(value)) groups.set(value, []);
        groups.get(value).push(outcome);
      });
      const eligible = [...groups.entries()].filter(([, values]) => values.length >= minimum);
      if (!populated) return { Dimension: dimension, Status: "Selected in Setup - no populated analyzed values", Populated: 0, "Missing %": 100, Values: 0, "Eligible Values": 0 };
      const all = eligible.flatMap(([, values]) => values);
      const mean = all.length ? all.reduce((sum, value) => sum + value, 0) / all.length : null;
      const totalVariance = mean == null ? 0 : all.reduce((sum, value) => sum + ((value - mean) ** 2), 0);
      const scored = eligible.map(([value, values]) => ({ value, count: values.length, score: values.reduce((sum, item) => sum + item, 0) / values.length }));
      const betweenVariance = mean == null ? 0 : scored.reduce((sum, item) => sum + item.count * ((item.score - mean) ** 2), 0);
      const effect = totalVariance > 0 ? betweenVariance / totalVariance : null;
      const ordered = scored.slice().sort((a, b) => b.score - a.score);
      return { Dimension: dimension, Status: eligible.length >= 2 ? "Recovered from analyzed rows" : "Insufficient eligible values", Populated: populated, "Missing %": ((dataRows.length - populated) / dataRows.length) * 100, Values: groups.size, "Eligible Values": eligible.length, Relationship: effectLabel(effect), "Effect Size": effect, "Score Spread": ordered.length >= 2 ? ordered[0].score - ordered.at(-1).score : null, "Highest Value": ordered[0]?.value, "Highest Score": ordered[0]?.score, "Lowest Value": ordered.at(-1)?.value, "Lowest Score": ordered.at(-1)?.score, Numeric: false };
    });
  }
  const rows = () => backendRows().length ? backendRows() : recoveredRows();
  const dimensions = () => Array.from(new Set([...setupDimensions(), ...rows().map((row) => row.Dimension)].map((value) => String(value || "").trim()).filter(Boolean)));
  const effectLabel = (value) => numeric(value) == null ? "Unavailable" : numeric(value) >= 0.14 ? "Strong" : numeric(value) >= 0.06 ? "Moderate" : numeric(value) >= 0.01 ? "Weak" : "Minimal";
  const metricCard = (label, value, note, tone = "") => '<article class="metric-card ' + safe(tone) + '"><span>' + safe(label) + '</span><strong>' + safe(value) + '</strong><small>' + safe(note) + '</small></article>';

  function selectedRow() {
    const selected = get("evidenceRelationshipDimension")?.value || dimensions()[0] || "";
    return rows().find((row) => row.Dimension === selected) || { Dimension: selected, Status: "Not returned in analysis output" };
  }

  function renderTable(items) {
    const columns = ["Dimension", "Status", "Populated", "Missing %", "Values", "Eligible Values", "Relationship", "Effect Size", "Score Spread", "Highest Value", "Highest Score", "Lowest Value", "Lowest Score"];
    if (!items.length) return '<tbody><tr><td>No Setup-selected dimensions were returned for this analysis.</td></tr></tbody>';
    const head = '<thead><tr>' + columns.map((column) => '<th>' + safe(column) + '</th>').join("") + '</tr></thead>';
    const body = items.map((row) => '<tr>' + columns.map((column) => {
      let value = row[column];
      if (["Effect Size", "Score Spread", "Highest Score", "Lowest Score"].includes(column) && numeric(value) != null) value = fixed(value);
      if (column === "Missing %" && numeric(value) != null) value = pct(value);
      return '<td>' + safe(value ?? "Not available") + '</td>';
    }).join("") + '</tr>').join("");
    return head + '<tbody>' + body + '</tbody>';
  }

  function renderDetail(row) {
    if (!row?.Dimension) return '<div class="evidence-empty">Select dimensions during Setup and rerun the analysis.</div>';
    const facts = [
      ["Analysis status", row.Status || "Unavailable"],
      ["Populated responses", Number(row.Populated || 0).toLocaleString()],
      ["Missing data", pct(row["Missing %"])],
      ["Distinct values", Number(row.Values || 0).toLocaleString()],
      ["Values meeting minimum sample", Number(row["Eligible Values"] || 0).toLocaleString()],
      ["Relationship strength", row.Relationship || effectLabel(row["Effect Size"])],
      ["Effect size", fixed(row["Effect Size"], 4)],
      ["Score spread", numeric(row["Score Spread"]) == null ? "Not available" : fixed(row["Score Spread"]) + " pts"],
    ];
    const factHtml = facts.map(([label, value]) => '<div><span>' + safe(label) + '</span><strong>' + safe(value) + '</strong></div>').join("");
    const metric = safe(model().metric || "Score");
    return '<div class="evidence-detail-grid">' + factHtml + '</div><div class="evidence-extremes">' +
      '<article class="best"><span>Highest outcome</span><strong>' + safe(row["Highest Value"] || "Not available") + '</strong><small>' + (numeric(row["Highest Score"]) == null ? "Score unavailable" : metric + " " + fixed(row["Highest Score"])) + '</small></article>' +
      '<article class="risk"><span>Lowest outcome</span><strong>' + safe(row["Lowest Value"] || "Not available") + '</strong><small>' + (numeric(row["Lowest Score"]) == null ? "Score unavailable" : metric + " " + fixed(row["Lowest Score"])) + '</small></article></div>';
  }

  function renderRegression(row) {
    if (!row?.Dimension) return '<div class="evidence-empty">No dimension selected.</div>';
    if (!row.Numeric) {
      return '<div class="evidence-method-note"><strong>Categorical relationship method</strong><p>' + safe(row.Dimension) + ' is assessed with between-group effect size rather than Pearson correlation or linear regression. This is statistically appropriate for a categorical dimension.</p><span>Effect size: ' + fixed(row["Effect Size"], 4) + ' · ' + safe(row.Relationship || effectLabel(row["Effect Size"])) + ' relationship</span></div>';
    }
    if (numeric(row["Pearson r"]) == null) {
      return '<div class="evidence-method-note"><strong>Numeric model unavailable</strong><p>The current evidence does not contain enough usable numeric variation for a stable correlation and regression read.</p></div>';
    }
    const direction = numeric(row["Pearson r"]) > 0 ? "positive" : numeric(row["Pearson r"]) < 0 ? "negative" : "neutral";
    return '<div class="evidence-regression-grid">' +
      '<article><span>Pearson correlation</span><strong>' + fixed(row["Pearson r"], 4) + '</strong><small>' + direction + ' linear relationship</small></article>' +
      '<article><span>Regression slope</span><strong>' + fixed(row["Regression Slope"], 4) + '</strong><small>Outcome-point change per one-unit increase</small></article>' +
      '<article><span>R squared</span><strong>' + fixed(row["R Squared"], 4) + '</strong><small>Variation explained by this single numeric field</small></article></div>' +
      '<div class="evidence-causality-note">Association does not establish causation. Validate operational context before assigning action.</div>';
  }

  function renderNarrative(row) {
    const data = model();
    const strongest = data.strongestDimension || rows().filter((item) => numeric(item["Effect Size"]) != null).sort((a, b) => numeric(b["Effect Size"]) - numeric(a["Effect Size"]))[0];
    const confidence = numeric(data.confidenceLow) == null ? "not available" : fixed(data.confidenceLow) + " to " + fixed(data.confidenceHigh);
    const lead = strongest ? strongest.Dimension + " has the strongest measurable relationship (" + (strongest.Relationship || effectLabel(strongest["Effect Size"])) + ", effect size " + fixed(strongest["Effect Size"], 4) + ")." : "No selected dimension currently has sufficient evidence for a measurable relationship ranking.";
    const current = row?.Dimension ? row.Dimension + " is marked " + (row.Status || "Unavailable") + " with " + Number(row.Populated || 0).toLocaleString() + " populated responses and " + Number(row["Eligible Values"] || 0).toLocaleString() + " eligible values." : "";
    return '<p><strong>Evidence strength:</strong> ' + safe(data.evidenceRating || "Insufficient") + ' based on ' + Number(data.usableResponses || 0).toLocaleString() + ' usable responses. The 95% confidence interval is ' + safe(confidence) + '.</p>' +
      '<p><strong>Strongest relationship:</strong> ' + safe(lead) + '</p><p><strong>Selected dimension:</strong> ' + safe(current) + '</p>' +
      '<p class="evidence-guardrail">These results describe statistical association and evidence strength. They do not prove that a dimension caused the customer outcome.</p>';
  }

  function render() {
    const selector = get("evidenceRelationshipDimension");
    if (!selector) return;
    const available = dimensions();
    const previous = selector.value;
    selector.innerHTML = available.length ? available.map((dimension) => '<option value="' + safe(dimension) + '">' + safe(dimension) + '</option>').join("") : '<option value="">No selected dimensions</option>';
    selector.value = available.includes(previous) ? previous : (available[0] || "");
    const row = selectedRow();
    const data = model();
    const strongest = data.strongestDimension || rows().filter((item) => numeric(item["Effect Size"]) != null).sort((a, b) => numeric(b["Effect Size"]) - numeric(a["Effect Size"]))[0] || {};
    if (get("evidenceRelationshipStatus")) get("evidenceRelationshipStatus").textContent = available.length ? available.length + " Setup-selected dimension" + (available.length === 1 ? "" : "s") + " retained · minimum sample " + Number(data.minimumSample || 5) : "No Setup-selected dimensions are available.";
    if (get("evidenceRelationshipCards")) get("evidenceRelationshipCards").innerHTML = [
      metricCard(data.metric || "Score", fixed(data.score), Number(data.usableResponses || 0).toLocaleString() + " usable responses", "positive"),
      metricCard("95% Confidence Interval", numeric(data.confidenceLow) == null ? "Not available" : fixed(data.confidenceLow) + " to " + fixed(data.confidenceHigh), "Margin of error " + (numeric(data.marginOfError) == null ? "not available" : "±" + fixed(data.marginOfError) + " pts")),
      metricCard("Evidence Rating", data.evidenceRating || "Insufficient", "Volume-based reliability context", data.evidenceRating === "Strong" ? "positive" : "passive"),
      metricCard("Strongest Dimension", strongest.Dimension || "Not available", strongest.Dimension ? (strongest.Relationship || effectLabel(strongest["Effect Size"])) + " relationship · effect " + fixed(strongest["Effect Size"], 4) : "No eligible relationship", strongest.Dimension ? "positive" : "passive"),
    ].join("");
    if (get("evidenceRelationshipNarrative")) get("evidenceRelationshipNarrative").innerHTML = renderNarrative(row);
    if (get("evidenceRelationshipDetail")) get("evidenceRelationshipDetail").innerHTML = renderDetail(row);
    if (get("evidenceRelationshipRegression")) get("evidenceRelationshipRegression").innerHTML = renderRegression(row);
    if (get("evidenceRelationshipTable")) get("evidenceRelationshipTable").innerHTML = renderTable(rows());
  }

  document.addEventListener("change", (event) => { if (event.target?.id === "evidenceRelationshipDimension") render(); });
  window.renderEvidenceRelationshipIntelligence = render;
  window.evidenceRelationshipExportRows = rows;
  window.setTimeout(render, 0);
})();
