const $ = (id) => document.getElementById(id);
let selectedFile = null;
let bulkFile = null;
let latestMetrics = null;
let loadingTimer = null;
let loadingStartedAt = 0;
let loadingEstimateSeconds = 90;
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

function timeLabel(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function estimatedTrainingSeconds() {
  const rows = Math.max(100, Math.min(50000, Number($("maxRows")?.value || 5000) || 5000));
  const trainedOutputs = ["labelColumn", "sentimentColumn", "acptColumn", "resolutionColumn"].filter(id => $(id)?.value).length || 1;
  return Math.max(20, Math.min(300, Math.round(12 + rows * trainedOutputs * 0.018)));
}

function updateTrainingProgress(forcePercent = null) {
  const phases = [
    [8, "Reading workbook and validating selected columns."],
    [18, "Filtering blank and short verbatims."],
    [34, "Splitting labeled rows into train and test sets."],
    [56, "Creating MiniLM sentence embeddings."],
    [76, "Fitting the classifier outputs."],
    [90, "Calculating accuracy, F1, and per-label performance."],
    [96, "Saving the trained model and manifest."],
  ];
  const elapsed = (Date.now() - loadingStartedAt) / 1000;
  const natural = Math.min(96, Math.max(3, (elapsed / loadingEstimateSeconds) * 92 + 4));
  const percent = forcePercent ?? natural;
  const phase = phases.find(([limit]) => percent <= limit) || phases[phases.length - 1];
  $("loadingStep").textContent = phase[1];
  $("loadingPercent").textContent = `${Math.floor(percent)}%`;
  $("loadingElapsed").textContent = `Elapsed ${timeLabel(elapsed)}`;
  const remaining = percent >= 96 ? 0 : Math.max(0, loadingEstimateSeconds - elapsed);
  $("loadingRemaining").textContent = percent >= 96 ? "Finalizing" : `Remaining ~${timeLabel(remaining)}`;
  $("loadingBarFill").style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

function setTrainingLoading(isLoading) {
  const overlay = $("loadingOverlay");
  if (!isLoading) {
    updateTrainingProgress(100);
    overlay.hidden = true;
    clearInterval(loadingTimer);
    loadingTimer = null;
    $("trainBtn").disabled = false;
    return;
  }
  loadingStartedAt = Date.now();
  loadingEstimateSeconds = estimatedTrainingSeconds();
  overlay.hidden = false;
  $("trainBtn").disabled = true;
  clearInterval(loadingTimer);
  updateTrainingProgress(4);
  loadingTimer = setInterval(() => {
    updateTrainingProgress();
  }, 500);
}

function selectOptions(columns = [], selected = "", placeholder = "") {
  const options = placeholder ? [`<option value="">${escapeHtml(placeholder)}</option>`] : [];
  options.push(...columns.map(col => `<option value="${escapeHtml(col)}" ${col === selected ? "selected" : ""}>${escapeHtml(col)}</option>`));
  return options.join("");
}

function updateColumns(columns = [], suggestions = {}) {
  const hint = typeof suggestions === "string" ? { feedback: suggestions } : (suggestions || {});
  $("feedbackColumn").innerHTML = selectOptions(columns, hint.feedback || "", columns.length ? "Select feedback/verbatim column" : "Upload a file first");
  $("labelColumn").innerHTML = selectOptions(columns, hint.label || "", "Select label column");
  $("acptColumn").innerHTML = selectOptions(columns, hint.acpt || "", "Optional");
  $("sentimentColumn").innerHTML = selectOptions(columns, hint.sentiment || "", "Optional");
  $("resolutionColumn").innerHTML = selectOptions(columns, hint.resolution || "", "Optional");
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

function outputClassifierRows(metrics) {
  const outputs = metrics.outputs || {};
  const expected = ["Theme", "Sentiment", "ACPT", "Resolution Status"];
  return expected.map(name => {
    const output = outputs[name] || {};
    const isTheme = name === "Theme";
    const trained = Boolean(output.trained);
    return {
      name,
      status: trained ? "Trained" : "Not trained",
      column: output.column || (isTheme ? metrics.technicalDetails?.input?.labelColumn : "Not selected"),
      rows: output.rows || 0,
      accuracy: trained ? fmtPct(output.accuracy) : "-",
      macroF1: trained ? fmtPct(output.macroF1) : "-",
      labels: (output.labels || []).join(", ") || "-",
      note: trained ? "Ready for prediction" : (output.reason || (isTheme ? "Theme classifier is required" : "Select this human label column before training")),
    };
  });
}

function renderTechnicalDetails(metrics) {
  const details = metrics.technicalDetails || {};
  const groups = Object.entries(details).filter(([group]) => group !== "outputs");
  if (!groups.length) {
    $("technicalDetails").className = "details-grid empty-state";
    $("technicalDetails").textContent = "No technical details available.";
    return;
  }
  $("technicalDetails").className = "details-grid";
  const outputRows = outputClassifierRows(metrics);
  const outputTable = `
    <article class="detail-card output-classifier-card">
      <h3>Classifier Outputs</h3>
      <table class="technical-output-table">
        <thead>
          <tr><th>Output</th><th>Status</th><th>Human Column</th><th>Rows</th><th>Accuracy</th><th>Macro F1</th><th>Note</th></tr>
        </thead>
        <tbody>
          ${outputRows.map(output => `
            <tr class="${output.status === "Trained" ? "is-trained" : "is-skipped"}">
              <td>${escapeHtml(output.name)}</td>
              <td>${escapeHtml(output.status)}</td>
              <td>${escapeHtml(output.column || "-")}</td>
              <td>${Number(output.rows || 0).toLocaleString()}</td>
              <td>${escapeHtml(output.accuracy)}</td>
              <td>${escapeHtml(output.macroF1)}</td>
              <td>${escapeHtml(output.note)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </article>
  `;
  $("technicalDetails").innerHTML = outputTable + groups.map(([group, values]) => `
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
    const trainedOutputs = (model.outputs || []).length ? `; ${model.outputs.join(", ")}` : "";
    const label = `${model.name || model.path} (${model.labelCount || 0} labels${trainedOutputs})`;
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
  updateBulkModelOptions(models);
}

function updateBulkColumns(columns = [], feedbackColumn = "") {
  const select = $("bulkFeedbackColumn");
  if (!select) return;
  if (!columns.length) {
    select.innerHTML = `<option value="">Upload a file first</option>`;
    return;
  }
  const selected = typeof feedbackColumn === "object" ? (feedbackColumn.feedback || "") : feedbackColumn;
  select.innerHTML = selectOptions(columns, selected || "", "Select feedback/verbatim column");
}

function updateBulkModelOptions(models = []) {
  const select = $("bulkModelSelect");
  if (!select) return;
  const prior = select.value;
  if (!models.length) {
    select.innerHTML = `<option value="">No trained models found</option>`;
    return;
  }
  select.innerHTML = models.map(model => {
    const trainedOutputs = (model.outputs || []).length ? `; ${model.outputs.join(", ")}` : "";
    const label = `${model.name || model.path} (${model.labelCount || 0} labels${trainedOutputs})`;
    return `<option value="${escapeHtml(model.path)}">${escapeHtml(label)}</option>`;
  }).join("");
  if (models.some(model => model.path === prior)) {
    select.value = prior;
  }
}

function renderBulkResult(result) {
  const target = $("bulkResult");
  if (!target) return;
  target.className = "bulk-result";
  target.innerHTML = `
    <div class="bulk-result-grid">
      <article class="bulk-result-card">
        <span>Total Rows</span>
        <strong>${Number(result.rows || 0).toLocaleString()}</strong>
      </article>
      <article class="bulk-result-card">
        <span>Classified</span>
        <strong>${Number(result.classifiedRows || 0).toLocaleString()}</strong>
      </article>
      <article class="bulk-result-card">
        <span>Skipped</span>
        <strong>${Number(result.skippedRows || 0).toLocaleString()}</strong>
      </article>
      <article class="bulk-result-card">
        <span>Model Used</span>
        <strong>${escapeHtml(result.modelUsed || "-")}</strong>
      </article>
      <article class="bulk-result-card bulk-output-path">
        <span>Saved To</span>
        <strong>${escapeHtml(result.outputPath || "-")}</strong>
      </article>
    </div>
  `;
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
          <th>Predicted Sentiment</th>
          <th>Predicted ACPT</th>
          <th>Predicted Resolution</th>
          <th>Probability Details</th>
          <th>Trained At</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(result => {
          const acpt = result.outputs?.ACPT;
          const sentiment = result.outputs?.Sentiment;
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
              <strong>${escapeHtml(sentiment?.prediction || "-")}</strong><br>
              <small>${sentiment ? fmtConfidence(sentiment.confidence) : "Not trained"}</small>
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
              ${probabilityGroup("Sentiment", sentiment?.topProbabilities || [])}
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
  updateColumns([]);
  if (!selectedFile) return;
  setStatus("Reading columns...");
  const form = new FormData();
  form.append("file", selectedFile);
  try {
    const response = await fetch(`${API_BASE}api/inspect`, { method: "POST", body: form });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "Could not inspect file.");
    updateColumns(payload.columns || [], payload.suggestedColumns || { feedback: payload.feedbackColumn || "" });
    setStatus(`${Number(payload.rows || 0).toLocaleString()} rows ready`);
  } catch (error) {
    setStatus("Inspect failed");
    alert(friendlyFetchError(error));
  }
});

$("bulkFileInput").addEventListener("change", async (event) => {
  bulkFile = event.target.files[0] || null;
  $("bulkFileName").textContent = bulkFile ? bulkFile.name : "No file selected";
  updateBulkColumns([]);
  if (!bulkFile) return;
  $("bulkResult").className = "bulk-result empty-state";
  $("bulkResult").textContent = "Reading bulk file columns...";
  setStatus("Inspecting bulk file...");
  const form = new FormData();
  form.append("file", bulkFile);
  try {
    const response = await fetch(`${API_BASE}api/bulk-inspect`, { method: "POST", body: form });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "Could not inspect bulk file.");
    updateBulkColumns(payload.columns || [], payload.suggestedColumns || { feedback: payload.feedbackColumn || "" });
    $("bulkResult").textContent = `${Number(payload.rows || 0).toLocaleString()} rows ready. Choose a model and save folder, then run the bulk analysis.`;
    setStatus("Bulk file ready");
  } catch (error) {
    $("bulkResult").textContent = "Bulk file inspection failed.";
    setStatus("Bulk inspect failed");
    alert(friendlyFetchError(error));
  }
});

$("bulkRunBtn").addEventListener("click", async () => {
  if (!bulkFile) {
    alert("Upload the bulk Excel or CSV file first.");
    return;
  }
  if (!$("bulkFeedbackColumn").value) {
    alert("Select the feedback column for the bulk file.");
    return;
  }
  if (!$("bulkModelSelect").value) {
    alert("Select the trained Owl model to use.");
    return;
  }
  if (!$("bulkSaveFolder").value.trim()) {
    alert("Enter the folder path where the output should be saved.");
    return;
  }
  const button = $("bulkRunBtn");
  button.disabled = true;
  button.textContent = "Running...";
  $("bulkResult").className = "bulk-result empty-state";
  $("bulkResult").textContent = "Classifying rows and saving the output file...";
  setStatus("Running bulk analysis...");
  const form = new FormData();
  form.append("file", bulkFile);
  form.append("feedbackColumn", $("bulkFeedbackColumn").value);
  form.append("modelPath", $("bulkModelSelect").value);
  form.append("saveFolder", $("bulkSaveFolder").value.trim());
  form.append("outputName", $("bulkOutputName").value.trim());
  try {
    const response = await fetch(`${API_BASE}api/bulk-predict`, { method: "POST", body: form });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || "Bulk analysis failed.");
    renderBulkResult(payload);
    setStatus("Bulk output saved");
  } catch (error) {
    $("bulkResult").textContent = "Bulk analysis failed.";
    setStatus("Bulk analysis failed");
    alert(friendlyFetchError(error));
  } finally {
    button.disabled = false;
    button.textContent = "Run Bulk Analysis";
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
  form.append("saveFolder", $("saveFolder").value);
  form.append("feedbackColumn", $("feedbackColumn").value);
  form.append("labelColumn", $("labelColumn").value);
  form.append("acptColumn", $("acptColumn").value);
  form.append("sentimentColumn", $("sentimentColumn").value);
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
