const $ = (id) => document.getElementById(id);
let selectedFile = null;
let latestMetrics = null;
let loadingTimer = null;
const API_BASE = "/";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtPct = (value) => Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(2)}%` : "-";
const fmtConfidence = (value) => Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(2)}%` : "-";

function friendlyFetchError(error) {
  if (error instanceof TypeError && /fetch/i.test(error.message || "")) {
    return "Training server is not reachable. Please refresh this page and try again.";
  }
  return error.message || "Request failed.";
}

function setStatus(text) {
  $("status").textContent = text;
}

function setTrainingLoading(isLoading) {
  const overlay = $("loadingOverlay");
  const steps = [
    "Filtering blank and short verbatims.",
    "Splitting labeled rows into train and test sets.",
    "Creating MiniLM sentence embeddings.",
    "Fitting the Logistic Regression classifier.",
    "Calculating accuracy, F1, and per-theme metrics.",
    "Saving the trained model for the Lab app.",
  ];
  if (!isLoading) {
    overlay.hidden = true;
    clearInterval(loadingTimer);
    loadingTimer = null;
    $("trainBtn").disabled = false;
    return;
  }
  let index = 0;
  $("loadingStep").textContent = steps[index];
  overlay.hidden = false;
  $("trainBtn").disabled = true;
  clearInterval(loadingTimer);
  loadingTimer = setInterval(() => {
    index = (index + 1) % steps.length;
    $("loadingStep").textContent = steps[index];
  }, 1800);
}

function updateColumns(columns = [], feedbackColumn = "") {
  $("feedbackColumn").innerHTML = columns.map(col => `<option value="${escapeHtml(col)}" ${col === feedbackColumn ? "selected" : ""}>${escapeHtml(col)}</option>`).join("");
  $("labelColumn").innerHTML = `<option value="">Select label column</option>` + columns.map(col => `<option value="${escapeHtml(col)}">${escapeHtml(col)}</option>`).join("");
  $("acptColumn").innerHTML = `<option value="">Optional</option>` + columns.map(col => `<option value="${escapeHtml(col)}">${escapeHtml(col)}</option>`).join("");
  $("resolutionColumn").innerHTML = `<option value="">Optional</option>` + columns.map(col => `<option value="${escapeHtml(col)}">${escapeHtml(col)}</option>`).join("");
}

function renderMetrics(metrics) {
  const values = [
    ["Model", metrics.modelName || "-"],
    ["Training Rows", Number(metrics.trainedRows || 0).toLocaleString()],
    ["Accuracy", fmtPct(metrics.accuracy)],
    ["Macro F1", fmtPct(metrics.macroF1)],
    ["Weighted F1", fmtPct(metrics.weightedF1)],
    ["Outputs", Object.values(metrics.outputs || {}).filter(output => output.trained).length || 1],
  ];
  $("metricGrid").innerHTML = values.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
}

function formatDetailValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => `${key}: ${item}`).join(", ");
  }
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(4);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value || "-";
}

function titleFromKey(key) {
  return String(key).replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
}

function flattenDetails(values, prefix = "") {
  return Object.entries(values || {}).flatMap(([key, value]) => {
    const label = prefix ? `${prefix} / ${titleFromKey(key)}` : titleFromKey(key);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenDetails(value, label);
    }
    return [[label, value]];
  });
}

function renderTechnicalDetails(metrics) {
  const details = metrics.technicalDetails || {};
  const groups = Object.entries(details);
  if (!groups.length) {
    $("technicalDetails").className = "details-grid empty-state";
    $("technicalDetails").textContent = "No technical details available.";
    return;
  }
  $("technicalDetails").className = "details-grid";
  $("technicalDetails").innerHTML = groups.map(([group, values]) => `
    <article class="detail-card">
      <h3>${escapeHtml(titleFromKey(group))}</h3>
      <dl>
        ${flattenDetails(values).map(([key, value]) => `
          <dt>${escapeHtml(key)}</dt>
          <dd>${escapeHtml(formatDetailValue(value))}</dd>
        `).join("")}
      </dl>
    </article>
  `).join("");
}

function renderReport(metrics) {
  const report = metrics.report || {};
  const rows = Object.entries(report).filter(([name, value]) => typeof value === "object" && !["accuracy", "macro avg", "weighted avg"].includes(name));
  if (!rows.length) {
    $("reportTable").className = "table-wrap empty-state";
    $("reportTable").textContent = "No per-theme metrics available.";
    return;
  }
  const outputRows = Object.entries(metrics.outputs || {});
  const outputsTable = outputRows.length ? `
    <h3>Model Outputs</h3>
    <table class="outputs-table">
      <thead><tr><th>Output</th><th>Status</th><th>Column</th><th>Rows</th><th>Accuracy</th><th>Macro F1</th><th>Labels</th></tr></thead>
      <tbody>
        ${outputRows.map(([name, output]) => `
          <tr>
            <td>${escapeHtml(name)}</td>
            <td>${output.trained ? "Trained" : "Skipped"}</td>
            <td>${escapeHtml(output.column || "-")}</td>
            <td>${Number(output.rows || 0).toLocaleString()}</td>
            <td>${output.trained ? fmtPct(output.accuracy) : escapeHtml(output.reason || "-")}</td>
            <td>${output.trained ? fmtPct(output.macroF1) : "-"}</td>
            <td>${escapeHtml((output.labels || []).join(", ") || "-")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";
  $("reportTable").className = "table-wrap";
  $("reportTable").innerHTML = `
    ${outputsTable}
    <h3>Theme Performance</h3>
    <table>
      <thead><tr><th>Theme</th><th>Precision</th><th>Recall</th><th>F1</th><th>Support</th></tr></thead>
      <tbody>
        ${rows.map(([theme, value]) => `
          <tr>
            <td>${escapeHtml(theme)}</td>
            <td>${fmtPct(value.precision)}</td>
            <td>${fmtPct(value.recall)}</td>
            <td>${fmtPct(value["f1-score"])}</td>
            <td>${Number(value.support || 0).toLocaleString()}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function compareModelSelects() {
  return [$("compareModel1"), $("compareModel2"), $("compareModel3")];
}

function updateCompareModelOptions(models = []) {
  const options = `<option value="">Select model</option>` + models.map(model => {
    const label = `${model.name || model.path} (${model.labelCount || 0} labels)`;
    return `<option value="${escapeHtml(model.path)}">${escapeHtml(label)}</option>`;
  }).join("");
  compareModelSelects().forEach((select, index) => {
    const prior = select.value;
    select.innerHTML = options;
    if (models.some(model => model.path === prior)) {
      select.value = prior;
    } else if (models[index]) {
      select.value = models[index].path;
    }
  });
}

async function refreshModelList() {
  setStatus("Retrieving models...");
  try {
    const response = await fetch(`${API_BASE}api/list-models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: $("modelFolder").value }),
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "Could not retrieve models.");
    updateCompareModelOptions(payload.models || []);
    setStatus(`${(payload.models || []).length} models found`);
  } catch (error) {
    setStatus("Model retrieval failed");
    alert(friendlyFetchError(error));
  }
}

function renderModelTestResults(results = []) {
  if (!results.length) {
    $("modelTestResults").className = "table-wrap empty-state";
    $("modelTestResults").textContent = "No model test results available.";
    return;
  }
  const probabilityGroup = (title, probabilities = []) => `
    <div class="prob-group">
      <strong>${escapeHtml(title)}</strong>
      ${probabilities.length ? `
        <ol class="prob-list">
          ${probabilities.map(item => `
            <li>${escapeHtml(item.theme)}: ${fmtConfidence(item.confidence)}</li>
          `).join("")}
        </ol>
      ` : `<small>-</small>`}
    </div>
  `;
  $("modelTestResults").className = "table-wrap";
  $("modelTestResults").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Model</th>
          <th>Predicted Theme</th>
          <th>Predicted ACPT</th>
          <th>Predicted Resolution</th>
          <th>Probability Details</th>
          <th>Trained At</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(result => {
          const acpt = result.outputs?.ACPT;
          const resolution = result.outputs?.["Resolution Status"];
          return `
          <tr>
            <td>
              <strong>${escapeHtml(result.modelName)}</strong><br>
              <small>${escapeHtml(result.modelPath)}</small>
            </td>
            <td>
              <strong>${escapeHtml(result.prediction)}</strong><br>
              <small>${fmtConfidence(result.confidence)}</small>
            </td>
            <td>
              <strong>${escapeHtml(acpt?.prediction || "-")}</strong><br>
              <small>${acpt ? fmtConfidence(acpt.confidence) : "Not trained"}</small>
            </td>
            <td>
              <strong>${escapeHtml(resolution?.prediction || "-")}</strong><br>
              <small>${resolution ? fmtConfidence(resolution.confidence) : "Not trained"}</small>
            </td>
            <td class="prob-details">
              ${probabilityGroup("Theme", result.topProbabilities || [])}
              ${probabilityGroup("ACPT", acpt?.topProbabilities || [])}
              ${probabilityGroup("Resolution", resolution?.topProbabilities || [])}
            </td>
            <td>${escapeHtml(result.trainedAt || "-")}</td>
          </tr>
        `}).join("")}
      </tbody>
    </table>
  `;
}

async function testSelectedModels() {
  const text = $("testVerbatim").value.trim();
  const models = compareModelSelects().map(select => select.value).filter(Boolean);
  if (!text) {
    alert("Paste one verbatim to test.");
    return;
  }
  if (!models.length) {
    alert("Select at least one model.");
    return;
  }
  setStatus("Testing models...");
  try {
    const response = await fetch(`${API_BASE}api/test-models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, models }),
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "Model test failed.");
    renderModelTestResults(payload.results || []);
    setStatus("Model test complete");
  } catch (error) {
    setStatus("Model test failed");
    alert(friendlyFetchError(error));
  }
}

$("fileInput").addEventListener("change", async (event) => {
  selectedFile = event.target.files[0] || null;
  $("fileName").textContent = selectedFile ? selectedFile.name : "No file selected";
  latestMetrics = null;
  $("exportBtn").disabled = true;
  if (!selectedFile) return;
  setStatus("Reading columns...");
  const form = new FormData();
  form.append("file", selectedFile);
  try {
    const response = await fetch(`${API_BASE}api/inspect`, { method: "POST", body: form });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "Could not inspect file.");
    updateColumns(payload.columns || [], payload.feedbackColumn || "");
    setStatus(`${Number(payload.rows || 0).toLocaleString()} rows ready`);
  } catch (error) {
    setStatus("Inspect failed");
    alert(friendlyFetchError(error));
  }
});

$("trainBtn").addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Please choose a labeled CSV or Excel file first.");
    return;
  }
  if (!$("labelColumn").value) {
    alert("Select the human label column before training.");
    return;
  }
  setStatus("Training...");
  setTrainingLoading(true);
  const form = new FormData();
  form.append("file", selectedFile);
  form.append("modelName", $("modelName").value);
  form.append("feedbackColumn", $("feedbackColumn").value);
  form.append("labelColumn", $("labelColumn").value);
  form.append("acptColumn", $("acptColumn").value);
  form.append("resolutionColumn", $("resolutionColumn").value);
  form.append("maxRows", $("maxRows").value);
  try {
    const response = await fetch(`${API_BASE}api/train`, { method: "POST", body: form });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "Training failed.");
    latestMetrics = payload.metrics;
    renderMetrics(payload.metrics);
    renderTechnicalDetails(payload.metrics);
    renderReport(payload.metrics);
    $("exportBtn").disabled = false;
    setStatus("Model trained");
  } catch (error) {
    setStatus("Training failed");
    alert(friendlyFetchError(error));
  } finally {
    setTrainingLoading(false);
  }
});

$("exportBtn").addEventListener("click", async () => {
  if (!latestMetrics) {
    alert("Train a model before exporting.");
    return;
  }
  setStatus("Exporting...");
  try {
    const response = await fetch(`${API_BASE}api/export-training`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics: latestMetrics }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Export failed.");
    }
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    const fileName = match ? match[1] : "theme_training_report.xlsx";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Export ready");
  } catch (error) {
    setStatus("Export failed");
    alert(friendlyFetchError(error));
  }
});

$("refreshModelsBtn").addEventListener("click", refreshModelList);
$("testModelsBtn").addEventListener("click", testSelectedModels);
refreshModelList();
