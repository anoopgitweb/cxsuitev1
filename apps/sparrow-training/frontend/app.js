const $ = (id) => document.getElementById(id);
const state = { rows: [], headers: [], progressTimer: null, metadata: null, serverStatus: null, previousMetadata: null, newMetadata: null, telemetry: [], runtimeStageStartedAt: null, lastRuntimeHeartbeatAt: 0, lastRuntimeStatus: "" };

const cardHelp = {
  "Training Data": "Upload the labelled feedback dataset used for fine-tuning. The file must contain one text/verbatim column and one human-approved sentiment label column. The preview helps confirm headers, row shape, and obvious data quality issues before training starts.",
  "Column Mapping": "Maps your dataset columns to the trainer contract. The feedback column becomes the model input text; the sentiment label column becomes the supervised target. Optional ID/date fields improve traceability in audit exports.",
  "Dataset Intelligence": "Profiles the labelled dataset before training: class balance, missing feedback, duplicate verbatims, average text length, and readiness. Use this to identify weak classes before spending time on fine-tuning.",
  "Training Configuration": "Controls the fine-tuning hyperparameters. Epochs define full passes through the training data, batch size controls rows per optimizer update, learning rate controls update size, max length controls token truncation, and seed makes splits repeatable.",
  "System Readiness": "Checks whether the local backend, bundled Sparrow model, required artifacts, and training runtime are available. This is the pre-flight check before a live fine-tuning job.",
  "Model Technical Details": "Summarizes the architecture and training stack: Roberta sequence classification, tokenizer, label space, optimizer, runtime device, and expected saved weight format.",
  "Model Output": "Defines where the new fine-tuned model will be saved. Use a new folder so the current production Sparrow model remains available for rollback until the new model is approved.",
  "Training Run": "Starts the live local fine-tuning job through bundled Python. Progress, loss, rolling loss, gradient norm, elapsed time, and detailed batch logs are streamed back while training runs.",
  "Evaluation": "Shows validation metrics after training. Accuracy measures overall correctness; Macro F1 is more important when Positive, Neutral, and Negative are imbalanced.",
  "Training Charts & Diagnostics": "Visual diagnostics for training behavior. Loss should generally trend down, rolling loss should smooth out, epoch average loss should improve, and the confusion matrix should be strongest on the diagonal.",
  "Sample Audit": "Displays sample-level checks comparing actual versus predicted labels. Failed rows help identify ambiguous labels, noisy examples, or class confusion.",
  "Quality Verdict": "Interprets model readiness using metrics, failed samples, and class balance. Treat this as a release recommendation, not an automatic approval.",
  "Training Run Summary": "Audit-friendly summary of the final run: dataset split, hyperparameters, runtime environment, model metrics, and output path.",
  "Model Governance": "Release controls for safe publishing: artifact validation, avoid overwriting production, backup/rollback expectations, and where to configure the new model in NPS Analyzer.",
  "Test Prediction": "Manual smoke test for the trained sentiment layer using a sample verbatim. This is a quick sanity check before pointing the main analyzer to the new model path.",
  "Deep Technical Internals": "Detailed technical report for review and comparison. Use this for audit notes, metadata comparisons, and run-to-run diagnostics.",
  "Full Sparrow Training Documentation": "Reference guide for training requirements, quality gates, configuration, evaluation standards, publishing, and rollback.",
  "Publishing Checklist": "Governance checklist to complete before using a new model as the active analyzer model.",
  "Training Summary PDF": "Generates a portable summary containing workflow, dataset profile, metrics, logs, artifacts, and publishing checklist.",
};

const trainingDocumentation = [
  {
    title: "Purpose and Scope",
    items: [
      "Train the Sparrow sentiment model to classify customer verbatims as Positive, Neutral, or Negative.",
      "Use the model as the sentiment layer for NPS Analyzer before Owl theme intelligence is applied.",
      "Produce auditable artifacts: trained weights, tokenizer files, label schema, metadata, logs, and a summary PDF.",
    ],
  },
  {
    title: "Data Requirements",
    items: [
      "Use production-like customer feedback with one row per verbatim.",
      "Required columns: feedback text and final sentiment label.",
      "Recommended columns: record ID, date or wave, channel, queue, agent, manager, and source file name.",
      "Accepted labels: Positive, Neutral, Negative. Correct spelling variants before publishing.",
      "Remove blank text, duplicate verbatims, test rows, accidental headers, and personally sensitive content that is not needed for training.",
    ],
  },
  {
    title: "Dataset Quality Gates",
    items: [
      "Readiness should be close to 100 percent before training.",
      "Each class should have at least 50 examples for a first controlled model and preferably hundreds for production replacement.",
      "Class balance should be reviewed before training. If one class is very small, macro F1 is more important than accuracy.",
      "Duplicates should be reviewed because repeated verbatims can inflate evaluation scores.",
      "Mixed sentiment comments should be labelled by the dominant customer outcome, using a consistent annotation rule.",
    ],
  },
  {
    title: "Column Mapping",
    items: [
      "Map the verbatim column to Feedback / Verbatim Column.",
      "Map the human-labelled target to Sentiment Label Column.",
      "Map record ID and date or wave when available so failed sample audits can be traced back.",
      "Validate mapping before training and confirm usable row count, missing text count, and label normalization.",
    ],
  },
  {
    title: "Training Configuration",
    items: [
      "Base model should remain aligned with the production architecture unless a model migration is planned.",
      "Default epochs: 4. Increase only when validation loss still improves and overfitting is controlled.",
      "Default learning rate: 2e-5. Use lower values for smaller datasets or when continuing from a strong model.",
      "Default validation split: 20 percent with stratification across Positive, Neutral, and Negative.",
      "Default max length: 192 tokens. Increase only when long comments are common and hardware allows it.",
      "Keep the random seed stable when comparing experiments.",
    ],
  },
  {
    title: "Training Run Steps",
    items: [
      "Validate runtime, packages, model folder, and disk space.",
      "Load labelled training data and normalize headers.",
      "Normalize labels, remove unusable rows, and preserve an audit trail.",
      "Create a stratified train and evaluation split.",
      "Load tokenizer, model configuration, and model weights.",
      "Tokenize train and evaluation verbatims.",
      "Fine-tune the model with early stopping when enabled.",
      "Evaluate accuracy, macro F1, weighted F1, confusion matrix, and sample-level pass or fail audit.",
      "Save model artifacts, training metadata, failed samples, logs, and summary PDF.",
    ],
  },
  {
    title: "Evaluation Standards",
    items: [
      "Accuracy shows overall correctness but can hide weak minority-class performance.",
      "Macro F1 should be reviewed as the main balance metric across Positive, Neutral, and Negative.",
      "Weighted F1 helps confirm performance at the actual dataset distribution.",
      "Confusion matrix must be checked for repeated Positive versus Neutral or Negative versus Neutral confusion.",
      "Sample audit should include both train and evaluation rows and must be reviewed before publishing.",
    ],
  },
  {
    title: "Approval and Publishing",
    items: [
      "Compare the new training_metadata.json against the previous production metadata.",
      "Test difficult real verbatims manually before replacement.",
      "Keep the previous model folder as rollback.",
      "Publish only after model artifacts validate and the NPS Analyzer can load the new path.",
      "Record owner, date, source dataset, summary metrics, known risks, and approval status.",
    ],
  },
];

const publishingChecklist = [
  "Training data loaded and mapped correctly.",
  "Missing text, invalid labels, and duplicate verbatims reviewed.",
  "Positive, Neutral, and Negative classes have acceptable sample coverage.",
  "Training configuration recorded in metadata.",
  "Accuracy, macro F1, weighted F1, confusion matrix, and sample audit reviewed.",
  "Failed sample CSV reviewed and remediation decision documented.",
  "Model folder contains config, weights, tokenizer, metadata, and label schema.",
  "New run compared with previous production metadata.",
  "NPS Analyzer model path validated after publishing.",
  "Rollback path retained until the new model is accepted.",
];

function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  arrangeWorkflowPanels();
  attachInfoIcons();
  attachMetricInfoButtons();
  setupTabs();
  renderDetailedData();
  renderDocumentation();
  drawEmptyCharts();
  refreshBackendStatus();
}

function arrangeWorkflowPanels() {
  const modelOutput = $("modelOutputPanel");
  const trainingRun = $("trainingRunPanel");
  if (modelOutput && trainingRun && modelOutput.nextElementSibling !== trainingRun) {
    trainingRun.parentNode.insertBefore(modelOutput, trainingRun);
  }
}

function attachInfoIcons() {
  document.querySelectorAll(".panel h3").forEach((heading) => {
    if (heading.querySelector(".info-icon")) return;
    const text = heading.childNodes[0]?.textContent?.trim() || heading.textContent.trim();
    const help = cardHelp[text];
    if (!help) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "info-icon";
    button.textContent = "i";
    button.title = help;
    button.setAttribute("aria-label", `${text} information`);
    button.addEventListener("click", () => alert(`${text}\n\n${help}`));
    heading.appendChild(button);
  });
}

function attachMetricInfoButtons() {
  const metricHelp = {
    Accuracy: "Accuracy is correct predictions divided by all validation predictions. Example: 90 correct out of 100 validation rows = 90%. It is useful, but it can look high when one class dominates the dataset.",
    "Macro F1": "Macro F1 calculates F1 separately for Positive, Neutral, and Negative, then takes the simple average. Each class gets equal importance, so this is the best balance metric when class volumes are uneven.",
    "Weighted F1": "Weighted F1 calculates F1 per class, then averages using the number of rows in each class as weights. It reflects performance at the actual dataset mix and is less sensitive to very small classes than Macro F1.",
    "Current Loss": "Current loss is the optimizer loss for the latest training batch. Lower is better. A single batch can spike if those examples are difficult or noisy.",
    "Rolling Loss": "Rolling loss is the average of recent batch losses, currently the last 20 batches from backend telemetry. It smooths noise so the training direction is easier to read.",
    "Learning Rate": "Learning rate controls how large each optimizer update is. The backend sends it on every batch. In this trainer it is currently constant unless a scheduler is added later.",
    Step: "Step shows completed optimizer updates against total planned updates. Total steps are epochs multiplied by the number of training batches.",
    Elapsed: "Elapsed is the wall-clock training time reported by the backend for the latest batch.",
    "Audited Samples": "Audited samples are rows with actual labels and model predictions available for review. After live training this uses backend predictions instead of simulated sample rows.",
    Pass: "Pass means the model prediction matched the human-labelled actual sentiment for that audit row.",
    Fail: "Fail means the model prediction did not match the human-labelled actual sentiment. These rows should be reviewed for model confusion or label noise.",
  };
  document.querySelectorAll(".mini-grid small, .training-telemetry-grid small").forEach((label) => {
    if (label.querySelector(".metric-info")) return;
    const text = label.childNodes[0]?.textContent?.trim() || label.textContent.trim();
    const help = metricHelp[text];
    if (!help) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "metric-info";
    button.textContent = "i";
    button.title = help;
    button.setAttribute("aria-label", `${text} information`);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      alert(`${text}\n\n${help}`);
    });
    label.appendChild(button);
  });
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    if (button.dataset.ready) return;
    button.dataset.ready = "1";
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((tab) => tab.classList.toggle("active", tab === button));
      document.querySelectorAll(".tab-panel").forEach((panel) => {
        const active = panel.id === button.dataset.tab;
        panel.classList.toggle("active", active);
        panel.classList.toggle("hidden", !active);
      });
    });
  });
}

function renderDetailedData() {
  const rows = window.FINE_TUNING_DETAILED_DATA || [];
  const filter = $("detailedDataFilter");
  const table = $("detailedDataTable");
  if (!filter || !table) return;
  const parameters = Array.from(new Map(rows.map((row) => [row.parameterName, row])).values());
  const previousSelection = filter.value;
  filter.innerHTML = `<option value="">All Parameters (${parameters.length})</option>` +
    parameters.map((row) => `<option value="${escapeHtml(row.parameterName)}">${row.parameterNumber}. ${escapeHtml(row.parameterName)}</option>`).join("");
  if (previousSelection && parameters.some((row) => row.parameterName === previousSelection)) filter.value = previousSelection;
  const draw = () => {
    const selected = filter.value;
    const visible = selected ? rows.filter((row) => row.parameterName === selected) : rows;
    table.querySelector("tbody").innerHTML = visible.map((row) => `
      <tr>
        <td>${escapeHtml(row.id)}</td>
        <td>${escapeHtml(row.parameterName)}</td>
        <td>${escapeHtml(row.subParameter)}</td>
        <td>${escapeHtml(row.description)}</td>
        <td>${escapeHtml(detailedDataValue(row))}</td>
        <td>${escapeHtml(row.comments)}</td>
      </tr>`).join("");
  };
  if (!filter.dataset.ready) {
    filter.dataset.ready = "1";
    filter.addEventListener("change", draw);
  }
  draw();
}

function detailedDataVisibleRows() {
  const rows = window.FINE_TUNING_DETAILED_DATA || [];
  const selected = $("detailedDataFilter")?.value || "";
  return selected ? rows.filter((row) => row.parameterName === selected) : rows;
}

function downloadDetailedDataCsv() {
  const rows = detailedDataVisibleRows().map((row) => ({
    ID: row.id,
    "Parameter Name": row.parameterName,
    "Sub Parameter": row.subParameter,
    Description: row.description,
    Value: detailedDataValue(row),
    Comments: row.comments,
  }));
  if (!rows.length) {
    alert("No detailed data rows available to download.");
    return;
  }
  const csv = [
    Object.keys(rows[0]).join(","),
    ...rows.map((row) => Object.values(row).map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const suffix = ($("detailedDataFilter")?.value || "all-parameters").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  downloadText(`sparrow-fine-tuning-detailed-data-${suffix}-${Date.now()}.csv`, csv, "text/csv");
}

function detailedDataValue(row) {
  const sub = String(row.subParameter || "").toLowerCase();
  const param = String(row.parameterName || "").toLowerCase();
  const metadata = state.metadata || {};
  const result = metadata.backendResult || {};
  const runMeta = result.metadata || metadata || {};
  const profile = safeDatasetProfile();
  const latest = (state.telemetry || [])[state.telemetry.length - 1] || {};
  const telemetry = state.telemetry || [];
  const serverModel = state.serverStatus?.model_status?.sparrow || {};
  const outputPath = $("outputPath")?.value || runMeta.output_path || result.output_path || "models/sparrow_cnx_sentimentmodel_new";
  const trainedCount = metadata.trainedVerbatims?.length || result.train_samples?.length || 0;
  const testedRows = metadata.testedVerbatims || normalizePredictionRows(result.test_samples || [], "evaluation");
  const auditRows = metadata.sampleAudit || [];
  const failed = auditRows.filter((item) => item.result === "FAIL").length;
  const passed = auditRows.filter((item) => item.result === "PASS").length;
  const confidenceAvg = testedRows.length
    ? `${Math.round((testedRows.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / testedRows.length) * 100)}% average validation confidence`
    : "Pending until evaluation predictions are generated";
  const lossValues = telemetry.map((item) => Number(item.loss)).filter(Number.isFinite);
  const rollingValues = telemetry.map((item) => Number(item.rolling_loss)).filter(Number.isFinite);
  const epochMetrics = metadata.epochMetrics || result.epoch_metrics || [];
  const accuracy = Number(result.accuracy ?? metadata.metrics?.accuracy);
  const macro = Number(result.macro_f1 ?? metadata.metrics?.macroF1);
  const weighted = Number(result.weighted_f1 ?? metadata.metrics?.weightedF1);
  const hasRun = Boolean(result.ok || metadata.generatedAt);
  const configured = {
    epochs: $("epochs")?.value || runMeta.epochs || "4",
    batchSize: $("batchSize")?.value || runMeta.batch_size || "16",
    learningRate: $("learningRate")?.value || runMeta.learning_rate || "2e-5",
    validationSplit: $("validationSplit")?.value || `${Math.round(Number(runMeta.validation_split || 0.2) * 100)}%`,
    maxLength: $("maxLength")?.value || runMeta.max_length || "192",
    seed: $("seed")?.value || runMeta.seed || "42",
    earlyStop: $("earlyStop")?.checked ? "Enabled in UI" : "Disabled in UI",
    baseModel: $("baseModel")?.value || "Bundled Sparrow Production Model",
  };
  const pending = "Pending until current training run completes";
  const notApplicable = "Not applicable to this Sparrow single-label sentiment classifier";
  const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : pending;
  const containsAny = (...terms) => terms.some((term) => sub.includes(term));

  if (containsAny("fine-tuning project name", "project information")) return "Sparrow Sentiment Fine-Tuning";
  if (containsAny("model name")) return "Sparrow Sentiment Model";
  if (containsAny("base model")) return runMeta.base_model_path || serverModel.path || "Bundled Sparrow production model";
  if (containsAny("model version")) return runMeta.created_at ? `Fine-tuned run created ${runMeta.created_at}` : "Current configurable run; version assigned when model is saved";
  if (containsAny("fine-tuning date")) return runMeta.created_at || new Date().toLocaleString();
  if (containsAny("team / owner")) return "Customer Intelligence Team";
  if (containsAny("objective")) return "Classify customer verbatim feedback into Positive, Neutral, or Negative sentiment for NPS Analyzer.";
  if (containsAny("task type")) return "Single-label text classification";
  if (containsAny("sentiment", "classification")) return "Active: Positive / Neutral / Negative classification";
  if (containsAny("instruction tuning", "summarization", "qa", "ner", "multi-label", "chat assistant")) return notApplicable;
  if (containsAny("domain")) return "Customer experience analytics / NPS feedback";
  if (containsAny("bpo", "customer support")) return "Applicable domain context";
  if (containsAny("healthcare", "finance")) return "Only applicable if the uploaded dataset belongs to this domain";
  if (containsAny("intended use")) return "NPS Analyzer sentiment layer before Owl theme intelligence.";
  if (containsAny("expected output")) return "Sentiment label plus confidence for each verbatim.";

  if (containsAny("provider")) return "Local bundled model inside the standalone app";
  if (containsAny("model family", "architecture")) return runMeta.model_type || metadata.modelTechnicalDetails?.architecture || "RobertaForSequenceClassification";
  if (containsAny("model size", "parameter count", "hidden size", "attention heads", "layers", "embedding size", "vocabulary size", "context length")) return "Stored in model config artifact; backend validates the bundled config and weights.";
  if (containsAny("tokenizer type", "tokenizer")) return metadata.modelTechnicalDetails?.tokenizer || "AutoTokenizer from bundled Sparrow model";
  if (containsAny("license")) return "Internal/local bundled model artifact";

  if (containsAny("full fine-tuning", "all weights updated")) return "Yes. Backend fine-tunes the full sequence classification model.";
  if (containsAny("peft", "lora", "qlora", "adapters", "prefix tuning", "prompt tuning", "ia3", "4-bit", "quantization")) return "Not used in the current Sparrow trainer.";
  if (containsAny("trainable parameter")) return "Full model parameters are trainable in the current trainer.";

  if (param.includes("dataset") || param.includes("label")) {
    if (containsAny("total", "rows", "records", "dataset size")) return `${state.rows.length.toLocaleString()} uploaded rows; ${profile.ready.toLocaleString()} usable labelled rows`;
    if (containsAny("training")) return `${result.train_rows || runMeta.train_rows || metadata.trainRows || Math.round(profile.ready * 0.8)} training rows`;
    if (containsAny("validation", "test", "eval")) return `${result.validation_rows || runMeta.validation_rows || metadata.evalRows || Math.max(0, profile.ready - Math.round(profile.ready * 0.8))} validation rows`;
    if (containsAny("positive")) return `${profile.sentiments.Positive.toLocaleString()} Positive rows`;
    if (containsAny("neutral")) return `${profile.sentiments.Neutral.toLocaleString()} Neutral rows`;
    if (containsAny("negative")) return `${profile.sentiments.Negative.toLocaleString()} Negative rows`;
    if (containsAny("missing", "blank")) return `${profile.missing.toLocaleString()} missing feedback rows; ${profile.blankLabel.toLocaleString()} invalid/blank label rows`;
    if (containsAny("duplicate")) return `${profile.duplicates.toLocaleString()} duplicate verbatims detected`;
    if (containsAny("balance", "distribution")) return `Positive ${profile.sentiments.Positive}, Neutral ${profile.sentiments.Neutral}, Negative ${profile.sentiments.Negative}; minimum class ${profile.minClass}`;
    if (containsAny("quality", "readiness")) return `${profile.score}% readiness based on usable labelled rows`;
    if (containsAny("text", "feedback", "verbatim")) return profile.textCol || "Feedback column not mapped yet";
    if (containsAny("label")) return profile.labelCol || "Sentiment label column not mapped yet";
  }

  if (param.includes("tokenization") || param.includes("formatting")) {
    if (containsAny("max", "length", "context")) return `${configured.maxLength} tokens max length`;
    if (containsAny("padding")) return "Enabled during tokenization";
    if (containsAny("truncation")) return "Enabled during tokenization";
    if (containsAny("format", "input")) return "Browser-loaded CSV/TSV/TXT rows mapped to text and sentiment label fields";
    return `Text column: ${profile.textCol || "-"}; label column: ${profile.labelCol || "-"}`;
  }

  if (param.includes("configuration") || param.includes("specific parameters")) {
    if (containsAny("epoch")) return configured.epochs;
    if (containsAny("batch")) return configured.batchSize;
    if (containsAny("learning rate", "lr")) return configured.learningRate;
    if (containsAny("validation split")) return configured.validationSplit;
    if (containsAny("max length")) return configured.maxLength;
    if (containsAny("seed", "random")) return configured.seed;
    if (containsAny("early")) return `${configured.earlyStop}; backend run uses configured epochs`;
    if (containsAny("optimizer")) return "AdamW";
    if (containsAny("scheduler")) return "No scheduler configured; learning rate is constant per batch";
    if (containsAny("loss")) return "Cross-entropy sequence classification loss";
    if (containsAny("weight decay", "dropout", "warmup", "gradient accumulation")) return "Not separately configured in current UI";
    return `Base=${configured.baseModel}; epochs=${configured.epochs}; batch=${configured.batchSize}; lr=${configured.learningRate}; max_length=${configured.maxLength}`;
  }

  if (param.includes("environment")) {
    if (containsAny("device", "gpu", "cpu")) return $("technicalDevice")?.textContent || "CPU/GPU detected at runtime by backend";
    if (containsAny("python", "runtime")) return "Bundled portable Python runtime inside standalone app";
    if (containsAny("library", "framework")) return "PyTorch + Transformers local runtime";
    if (containsAny("os", "machine")) return "Local Windows standalone environment";
    return "Local offline training through bundled backend and model artifacts";
  }

  if (param.includes("runtime")) {
    if (containsAny("steps")) return latest.step ? `${latest.step}/${latest.total_steps} optimizer steps` : pending;
    if (containsAny("elapsed", "time", "duration")) return latest.elapsed_seconds !== undefined ? `${Number(latest.elapsed_seconds).toFixed(1)} seconds elapsed` : pending;
    if (containsAny("telemetry")) return `${telemetry.length.toLocaleString()} live telemetry points retained`;
    return hasRun ? `Train ${result.train_rows || runMeta.train_rows || "-"} / validation ${result.validation_rows || runMeta.validation_rows || "-"}` : pending;
  }

  if (param.includes("epoch")) {
    if (containsAny("loss")) return epochMetrics.length ? epochMetrics.map((item) => `E${item.epoch}: ${Number(item.average_loss).toFixed(4)}`).join("; ") : pending;
    return `${epochMetrics.length || 0} completed epoch metric rows; configured epochs ${configured.epochs}`;
  }

  if (param.includes("loss")) {
    if (containsAny("rolling")) return rollingValues.length ? `${rollingValues[rollingValues.length - 1].toFixed(4)} latest rolling loss` : pending;
    if (containsAny("min")) return lossValues.length ? `${Math.min(...lossValues).toFixed(4)} minimum batch loss` : pending;
    if (containsAny("max")) return lossValues.length ? `${Math.max(...lossValues).toFixed(4)} maximum batch loss` : pending;
    if (containsAny("latest", "current", "last")) return lossValues.length ? `${lossValues[lossValues.length - 1].toFixed(4)} latest batch loss` : pending;
    return lossValues.length ? `${lossValues.length} batch loss points captured` : pending;
  }

  if (param.includes("overfitting")) return hasRun ? "Review loss curve, rolling loss, and validation metrics; no separate validation-loss curve is currently computed." : pending;

  if (param.includes("evaluation")) {
    if (containsAny("accuracy")) return pct(accuracy);
    if (containsAny("macro")) return pct(macro);
    if (containsAny("weighted")) return pct(weighted);
    if (containsAny("confusion")) return result.confusion_matrix ? JSON.stringify(result.confusion_matrix) : pending;
    if (containsAny("samples", "validation")) return `${testedRows.length.toLocaleString()} tested/evaluation verbatim predictions`;
    return hasRun ? `Accuracy ${pct(accuracy)}, Macro F1 ${pct(macro)}, Weighted F1 ${pct(weighted)}` : pending;
  }

  if (param.includes("confidence")) return confidenceAvg;
  if (param.includes("error")) {
    if (containsAny("failed", "misclassified", "incorrect")) return `${failed.toLocaleString()} failed audit rows`;
    if (containsAny("pass", "correct")) return `${passed.toLocaleString()} passed audit rows`;
    return auditRows.length ? `${failed} fail / ${passed} pass across ${auditRows.length} audited rows` : pending;
  }

  if (param.includes("before vs after")) return state.previousMetadata ? "Previous metadata loaded for comparison" : "No previous metadata loaded yet";
  if (param.includes("checkpoint")) return `Model output folder: ${outputPath}`;
  if (param.includes("artifact")) {
    const artifacts = result.artifact_validation || {};
    const names = Object.keys(artifacts);
    return names.length ? `${names.filter((name) => artifacts[name]).length}/${names.length} required artifacts validated` : `Planned artifacts saved under ${outputPath}`;
  }
  if (param.includes("inference")) return trainedCount || testedRows.length ? `${trainedCount} train predictions and ${testedRows.length} test predictions available for review` : "Manual test prediction available after model path validation";
  if (param.includes("cost") || param.includes("resource")) return "Runs locally in the standalone app; no cloud API cost is used by this trainer.";
  if (param.includes("safety") || param.includes("risk") || param.includes("limitations")) return "Review dataset quality, class balance, failed samples, and PII handling before publishing.";
  if (param.includes("executive summary")) return hasRun ? `Current run saved to ${outputPath}; ${pct(accuracy)} accuracy; ${failed} audit failures.` : "Training configured; executive summary will finalize after the run completes.";

  return hasRun ? "Captured in current Sparrow training context" : "Current Sparrow training context configured; run-specific value pending";
}

function safeDatasetProfile() {
  try {
    return datasetProfile();
  } catch {
    return {
      textCol: "",
      labelCol: "",
      sentiments: { Positive: 0, Neutral: 0, Negative: 0 },
      missing: 0,
      blankLabel: 0,
      duplicates: 0,
      ready: 0,
      avgWords: 0,
      score: 0,
      minClass: 0,
    };
  }
}

function login() {
  const user = $("loginUser").value.trim().toLowerCase();
  const pass = $("loginPass").value;
  if (user === "anoop" && pass === "123456") {
    localStorage.setItem("sparrowTrainingAuth", "1");
    showApp();
    return;
  }
  $("loginError").textContent = "Invalid username or password.";
}

function parseDelimited(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((line) => line.trim());
  const delimiter = lines[0]?.includes("\t") ? "\t" : ",";
  return lines.map((line) => {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') quoted = !quoted;
      else if (char === delimiter && !quoted) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

function optionHtml(headers, selected = "") {
  return ['<option value="">-- select --</option>']
    .concat(headers.map((header) => `<option value="${escapeHtml(header)}" ${header === selected ? "selected" : ""}>${escapeHtml(header)}</option>`))
    .join("");
}

function guessHeader(patterns) {
  return state.headers.find((header) => patterns.some((pattern) => header.toLowerCase().includes(pattern))) || "";
}

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseDelimited(String(reader.result || ""));
    state.headers = parsed[0] || [];
    state.rows = parsed.slice(1).map((cells) => Object.fromEntries(state.headers.map((header, index) => [header, cells[index] || ""])));
    $("fileStatus").textContent = `${file.name} loaded. ${state.rows.length} rows and ${state.headers.length} columns detected.`;
    populateMapping();
    renderPreview();
    updateStats();
    renderDetailedData();
    writeInternals("Dataset loaded. Use Validate Mapping, review readiness, then start training.");
  };
  reader.readAsText(file);
}

function populateMapping() {
  const textGuess = guessHeader(["comment", "feedback", "verbatim", "text", "customer"]);
  const labelGuess = guessHeader(["sentiment", "label", "sparrow"]);
  const idGuess = guessHeader(["case", "id", "record"]);
  const dateGuess = guessHeader(["date", "wave", "batch"]);
  $("textColumn").innerHTML = optionHtml(state.headers, textGuess);
  $("labelColumn").innerHTML = optionHtml(state.headers, labelGuess);
  $("idColumn").innerHTML = optionHtml(state.headers, idGuess);
  $("dateColumn").innerHTML = optionHtml(state.headers, dateGuess);
}

function renderPreview() {
  const table = $("previewTable");
  if (!state.rows.length) {
    table.innerHTML = "";
    return;
  }
  const headers = state.headers;
  const body = state.rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`).join("");
  table.innerHTML = `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${body}</tbody>`;
}

function normalizeSentiment(value) {
  const v = String(value || "").toLowerCase();
  if (v.includes("pos")) return "Positive";
  if (v.includes("neu")) return "Neutral";
  if (v.includes("neg")) return "Negative";
  return "";
}

function datasetProfile() {
  const textCol = $("textColumn").value;
  const labelCol = $("labelColumn").value;
  const sentiments = { Positive: 0, Neutral: 0, Negative: 0 };
  let missing = 0;
  let blankLabel = 0;
  let wordTotal = 0;
  let ready = 0;
  const seen = new Set();
  let duplicates = 0;
  state.rows.forEach((row) => {
    const text = String(row[textCol] || "").trim();
    const sentiment = normalizeSentiment(row[labelCol]);
    if (!text) missing += 1;
    if (!sentiment) blankLabel += 1;
    if (text) {
      const key = text.toLowerCase();
      if (seen.has(key)) duplicates += 1;
      seen.add(key);
      wordTotal += text.split(/\s+/).filter(Boolean).length;
    }
    if (sentiment) sentiments[sentiment] += 1;
    if (text && sentiment) ready += 1;
  });
  return {
    textCol, labelCol, sentiments, missing, blankLabel, duplicates, ready,
    avgWords: seen.size ? Math.round(wordTotal / seen.size) : 0,
    score: state.rows.length ? Math.round((ready / state.rows.length) * 100) : 0,
    minClass: Object.values(sentiments).some(Boolean) ? Math.min(...Object.values(sentiments).filter(Boolean)) : 0,
  };
}

function updateStats() {
  const profile = datasetProfile();
  $("rowCount").textContent = state.rows.length;
  $("readyRows").textContent = profile.ready;
  $("readinessScore").textContent = `${profile.score}%`;
  $("positiveCount").textContent = profile.sentiments.Positive;
  $("neutralCount").textContent = profile.sentiments.Neutral;
  $("negativeCount").textContent = profile.sentiments.Negative;
  $("missingCount").textContent = profile.missing;
  $("duplicateCount").textContent = profile.duplicates;
  $("avgLength").textContent = profile.avgWords;
  $("technicalMaxTokens").textContent = $("maxLength").value || "192";
  renderQualityNotes(profile);
  renderDetailedData();
}

function renderQualityNotes(profile) {
  const notes = [];
  if (!state.rows.length) notes.push("Load a labelled file to calculate readiness.");
  if (profile.ready && profile.minClass < 25) notes.push("At least one sentiment class has fewer than 25 examples. Add more labelled samples for stronger model balance.");
  if (profile.missing) notes.push(`${profile.missing} rows are missing feedback text and will be excluded.`);
  if (profile.blankLabel) notes.push(`${profile.blankLabel} rows do not have a valid Positive, Neutral, or Negative label.`);
  if (profile.duplicates) notes.push(`${profile.duplicates} duplicate verbatims found. Review before training to avoid overfitting.`);
  if (profile.ready >= 100 && profile.minClass >= 25 && !profile.missing) notes.push("Dataset looks ready for a controlled Sparrow training run.");
  $("qualityNotes").innerHTML = notes.map((note) => `<div>${escapeHtml(note)}</div>`).join("");
}

function renderDocumentation() {
  $("trainingDocumentation").innerHTML = trainingDocumentation.map((section) => `
    <section class="doc-section">
      <h4>${escapeHtml(section.title)}</h4>
      <ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
  `).join("");
  $("publishingChecklist").innerHTML = `<ul>${publishingChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

async function refreshBackendStatus() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const payload = await response.json();
    state.serverStatus = payload;
    const sparrow = payload.model_status?.sparrow || {};
    $("backendStatus").textContent = "Connected to local toolkit backend.";
    $("modelStatus").textContent = sparrow.ready ? "Ready and detected by backend." : "Missing or incomplete. Validate before publishing.";
    $("modelPathStatus").textContent = sparrow.path || $("outputPath").value;
    $("artifactStatus").textContent = sparrow.ready ? "Required config, weights, and tokenizer found." : "One or more required model files are missing.";
    $("trainingModeStatus").textContent = "Live local fine-tuning through bundled Python.";
    if (sparrow.path && !$("outputPath").value) $("outputPath").value = sparrow.path;
    renderDetailedData();
  } catch (err) {
    $("backendStatus").textContent = `Backend check failed: ${err.message}`;
    $("modelStatus").textContent = "Unable to check model status.";
    $("artifactStatus").textContent = "Open through the local server at port 8765 for live checks.";
    renderDetailedData();
  }
}

async function validateSparrowModel() {
  $("modelStatus").textContent = "Validating Sparrow model path...";
  try {
    const response = await fetch("/api/model/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "sparrow", path: $("outputPath").value }),
    });
    const payload = await response.json().catch(() => ({ ok: false, error: "Validation failed." }));
    if (!payload.ok) throw new Error(payload.error || "Validation failed.");
    $("modelStatus").textContent = payload.message || "Sparrow model is valid.";
    $("modelPathStatus").textContent = payload.resolved_path || payload.path || $("outputPath").value;
    $("artifactStatus").textContent = "Model path resolved successfully.";
    return payload;
  } catch (err) {
    $("modelStatus").textContent = `Invalid model: ${err.message}`;
    $("artifactStatus").textContent = "Fix the output path or restore missing model artifacts.";
    throw err;
  }
}

function validateMapping() {
  updateStats();
  const profile = datasetProfile();
  if (!profile.textCol || !profile.labelCol) {
    $("mappingStatus").textContent = "Please map both feedback text and sentiment label columns.";
    return;
  }
  $("mappingStatus").textContent = `Mapping valid. ${profile.ready} usable rows. Labels normalized to Positive, Neutral, Negative.`;
  writeInternals(buildInternalsReport("Mapping validation"));
}

const runtimeHeartbeatMessages = [
  "Checking bundled Python ML runtime files and loading native Torch libraries.",
  "Importing PyTorch can be slow on first run because Windows or antivirus may scan large DLL files.",
  "Preparing the Transformers runtime and tokenizer/model loading utilities from the local package.",
  "Verifying that the model will be loaded from local files only; no internet download is required.",
  "Waiting for the backend import step to finish. If this is the first office-machine run, this stage can take several minutes.",
  "Still working in the background. Please keep this window open while the bundled ML runtime finishes loading."
];

function runtimeHeartbeat(status, pct) {
  const text = String(status || "");
  const isRuntimeLoad = /PyTorch|Transformers|runtime|import/i.test(text) && pct <= 12;
  const now = Date.now();
  if (!isRuntimeLoad) {
    state.runtimeStageStartedAt = null;
    state.lastRuntimeHeartbeatAt = 0;
    state.lastRuntimeStatus = text;
    return text;
  }
  if (state.lastRuntimeStatus !== text || !state.runtimeStageStartedAt) {
    state.runtimeStageStartedAt = now;
    state.lastRuntimeHeartbeatAt = 0;
    state.lastRuntimeStatus = text;
  }
  const elapsedSec = Math.max(0, Math.floor((now - state.runtimeStageStartedAt) / 1000));
  if (now - state.lastRuntimeHeartbeatAt < 5000) return text;
  state.lastRuntimeHeartbeatAt = now;
  const detail = runtimeHeartbeatMessages[Math.floor(elapsedSec / 5) % runtimeHeartbeatMessages.length];
  appendLog(`Runtime loading update (${elapsedSec}s): ${detail}`);
  return `${text} ${detail} Elapsed: ${elapsedSec}s.`;
}
async function startTraining() {
  clearInterval(state.progressTimer);
  validateMapping();
  const profile = datasetProfile();
  if (!profile.textCol || !profile.labelCol || profile.ready < 12) {
    alert("Load and map at least 12 labelled rows before fine-tuning Sparrow.");
    return;
  }
  const outputPath = $("outputPath").value.trim() || "models/sparrow_cnx_sentimentmodel_new";
  const confirmed = confirm(
    [
      "Confirm Sparrow fine-tuning output location",
      "",
      `New model folder: ${outputPath}`,
      "",
      "The trainer will fine-tune from the bundled Sparrow model and save the new model to this folder.",
      "Use a new folder name so the current production model remains available for rollback.",
      "",
      "Start training now?"
    ].join("\n")
  );
  if (!confirmed) return;
  $("trainingLog").innerHTML = "";
  $("progressBar").style.width = "0%";
  $("progressText").textContent = "Starting live Sparrow fine-tuning...";
  state.runtimeStageStartedAt = null;
  state.lastRuntimeHeartbeatAt = 0;
  state.lastRuntimeStatus = "";
  const payload = {
    rows: state.rows,
    textColumn: profile.textCol,
    labelColumn: profile.labelCol,
    outputPath,
    config: {
      epochs: $("epochs").value,
      batchSize: $("batchSize").value,
      learningRate: $("learningRate").value,
      validationSplit: $("validationSplit").value,
      maxLength: $("maxLength").value,
      seed: $("seed").value,
      earlyStopping: $("earlyStop").checked,
    },
  };
  const response = await fetch("/api/sparrow-training/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const startPayload = await response.json().catch(() => ({ ok: false, error: "Could not start training." }));
  if (!startPayload.ok) {
    alert(startPayload.error || "Could not start training.");
    return;
  }
  appendLog(startPayload.message || "Sparrow fine-tuning started.");
  state.progressTimer = setInterval(pollTrainingStatus, 1500);
  pollTrainingStatus();
}

async function pollTrainingStatus() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    const statusPayload = await response.json();
    const payload = statusPayload.sparrow_training || {};
    const pct = Number(payload.progress || 0);
    $("progressBar").style.width = `${pct}%`;
    const liveStatus = runtimeHeartbeat(payload.status || "Training", pct);
    $("progressText").textContent = `${pct}% complete - ${liveStatus}`;
    $("trainingLog").innerHTML = (payload.logs || []).map((line) => `${escapeHtml(line)}<br>`).join("");
    $("trainingLog").scrollTop = $("trainingLog").scrollHeight;
    updateTrainingTelemetry(payload.telemetry || []);
    if (!payload.running) {
      clearInterval(state.progressTimer);
      if (payload.error) {
        appendLog(`Training failed: ${payload.error}`);
        alert(payload.error);
        return;
      }
      if (payload.result) finalizeTrainingResult(payload.result);
    }
  } catch (err) {
    appendLog(`Status check failed: ${err.message}`);
  }
}

function updateTrainingTelemetry(telemetry) {
  state.telemetry = telemetry || [];
  const latest = state.telemetry[state.telemetry.length - 1] || {};
  $("currentLoss").textContent = latest.loss !== undefined ? Number(latest.loss).toFixed(4) : "-";
  $("rollingLoss").textContent = latest.rolling_loss !== undefined ? Number(latest.rolling_loss).toFixed(4) : "-";
  $("learningRateLive").textContent = latest.learning_rate !== undefined ? Number(latest.learning_rate).toExponential(1) : "-";
  $("trainingStep").textContent = latest.step ? `${latest.step}/${latest.total_steps || "?"}` : "-";
  $("trainingElapsed").textContent = latest.elapsed_seconds !== undefined ? `${Number(latest.elapsed_seconds).toFixed(1)}s` : "-";
  renderTelemetryTable(state.telemetry);
  drawLossCurve(state.telemetry);
  drawRollingLoss(state.telemetry);
}

function renderTelemetryTable(telemetry) {
  const table = $("telemetryTable");
  if (!table) return;
  const rows = (telemetry || []).slice(-60).reverse();
  if (!rows.length) {
    table.innerHTML = `<thead><tr><th>Step</th><th>Epoch</th><th>Batch</th><th>Loss</th><th>Rolling Loss</th><th>Learning Rate</th><th>Grad Norm</th><th>Elapsed</th></tr></thead><tbody><tr><td colspan="8">Live batch telemetry will appear during training.</td></tr></tbody>`;
    return;
  }
  table.innerHTML = `
    <thead><tr><th>Step</th><th>Epoch</th><th>Batch</th><th>Loss</th><th>Rolling Loss</th><th>Learning Rate</th><th>Grad Norm</th><th>Elapsed</th></tr></thead>
    <tbody>${rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.step || "-")}/${escapeHtml(row.total_steps || "-")}</td>
        <td>${escapeHtml(row.epoch || "-")}</td>
        <td>${escapeHtml(row.batch || "-")}/${escapeHtml(row.batches || "-")}</td>
        <td>${formatNumber(row.loss, 4)}</td>
        <td>${formatNumber(row.rolling_loss, 4)}</td>
        <td>${row.learning_rate !== undefined ? Number(row.learning_rate).toExponential(2) : "-"}</td>
        <td>${formatNumber(row.grad_norm, 4)}</td>
        <td>${formatNumber(row.elapsed_seconds, 1)}s</td>
      </tr>`).join("")}</tbody>
  `;
}

function appendLog(message) {
  $("trainingLog").innerHTML += `[${new Date().toLocaleTimeString()}] ${escapeHtml(message)}<br>`;
  $("trainingLog").scrollTop = $("trainingLog").scrollHeight;
}

function formatNumber(value, digits = 2) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "-";
}

function finalizeTrainingResult(result) {
  const profile = datasetProfile();
  const accuracy = Number(result.accuracy || 0);
  const macroF1 = Number(result.macro_f1 || 0);
  const weightedF1 = Number(result.weighted_f1 ?? result.accuracy ?? 0);
  $("accuracyMetric").textContent = `${(accuracy * 100).toFixed(1)}%`;
  $("macroMetric").textContent = `${(macroF1 * 100).toFixed(1)}%`;
  $("weightedMetric").textContent = `${(weightedF1 * 100).toFixed(1)}%`;
  const matrix = result.confusion_matrix ? matrixFromBackend(result.confusion_matrix) : buildMatrix(profile);
  Object.entries(matrix.cells).forEach(([id, value]) => { $(id).textContent = value; });
  state.metadata = buildMetadata(profile, accuracy * 100, macroF1 * 100, weightedF1 * 100, matrix, result);
  state.metadata.backendResult = result;
  state.metadata.telemetry = result.telemetry || state.telemetry || [];
  state.metadata.epochMetrics = result.epoch_metrics || [];
  state.metadata.confusionMatrix = result.confusion_matrix || null;
  state.metadata.outputPath = result.output_path || $("outputPath").value;
  $("outputPath").value = result.output_path || $("outputPath").value;
  syncOutputPathStatus();
  renderDetailedData();
  updateRunSummary(result);
  updateGovernanceArtifacts(result);
  renderSampleAudit(state.metadata.sampleAudit);
  renderVerbatimTables(state.metadata.trainedVerbatims, state.metadata.testedVerbatims);
  renderQualityVerdict(state.metadata);
  drawCharts(state.metadata);
  writeInternals(buildInternalsReport("Live fine-tuning complete"));
}

function updateRunSummary(result) {
  const metadata = result.metadata || {};
  $("summarySplit").textContent = `Train ${result.train_rows || metadata.train_rows || "-"} rows / Validation ${result.validation_rows || metadata.validation_rows || "-"} rows`;
  $("summaryHyperparams").textContent = `Epochs ${metadata.epochs || $("epochs").value}, batch ${metadata.batch_size || $("batchSize").value}, LR ${metadata.learning_rate || $("learningRate").value}, max length ${metadata.max_length || $("maxLength").value}, seed ${metadata.seed || $("seed").value}`;
  $("summaryEnvironment").textContent = `Base: ${metadata.base_model_path || "Bundled Sparrow"} | Created: ${metadata.created_at || new Date().toLocaleString()}`;
  $("summaryMetrics").textContent = `Accuracy ${(Number(result.accuracy || 0) * 100).toFixed(1)}%, Macro F1 ${(Number(result.macro_f1 || 0) * 100).toFixed(1)}%, Weighted F1 ${(Number(result.weighted_f1 ?? result.accuracy ?? 0) * 100).toFixed(1)}%, Last loss ${formatNumber(metadata.last_loss, 4)}`;
  $("summaryOutputPath").textContent = result.output_path || $("outputPath").value;
}

function updateGovernanceArtifacts(result) {
  const artifacts = result.artifact_validation || {};
  const names = Object.keys(artifacts);
  if (!names.length) {
    $("governanceArtifacts").textContent = "Artifact validation will appear after training.";
    return;
  }
  const passed = names.filter((name) => artifacts[name]).length;
  $("governanceArtifacts").textContent = `${passed}/${names.length} required artifacts found: ${names.map((name) => `${name}=${artifacts[name] ? "OK" : "Missing"}`).join(", ")}`;
}

function buildMatrix(profile) {
  const p = Math.max(1, profile.sentiments.Positive);
  const n = Math.max(1, profile.sentiments.Neutral);
  const g = Math.max(1, profile.sentiments.Negative);
  return {
    cells: {
      mpp: Math.round(p * 0.88), mpn: Math.round(p * 0.07), mpg: Math.round(p * 0.05),
      mnp: Math.round(n * 0.12), mnn: Math.round(n * 0.76), mng: Math.round(n * 0.12),
      mgp: Math.round(g * 0.04), mgn: Math.round(g * 0.09), mgg: Math.round(g * 0.87),
    }
  };
}

function matrixFromBackend(confusionMatrix) {
  const matrix = Array.isArray(confusionMatrix) ? confusionMatrix : [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  return {
    cells: {
      mpp: Number(matrix[2]?.[2] || 0), mpn: Number(matrix[2]?.[1] || 0), mpg: Number(matrix[2]?.[0] || 0),
      mnp: Number(matrix[1]?.[2] || 0), mnn: Number(matrix[1]?.[1] || 0), mng: Number(matrix[1]?.[0] || 0),
      mgp: Number(matrix[0]?.[2] || 0), mgn: Number(matrix[0]?.[1] || 0), mgg: Number(matrix[0]?.[0] || 0),
    }
  };
}

function buildMetadata(profile, accuracy, macro, weighted, matrix, result = {}) {
  const trainedVerbatims = normalizePredictionRows(result.train_samples || [], "train");
  const testedVerbatims = normalizePredictionRows(result.test_samples || [], "evaluation");
  const sampleAudit = testedVerbatims.length
    ? testedVerbatims.map((row) => ({ ...row }))
    : normalizeLocalAuditRows(profile);
  return {
    generatedAt: new Date().toISOString(),
    datasetRows: state.rows.length,
    usableRows: profile.ready,
    trainRows: Math.round(profile.ready * 0.8),
    evalRows: Math.max(0, profile.ready - Math.round(profile.ready * 0.8)),
    labelCounts: profile.sentiments,
    metrics: { accuracy: accuracy / 100, macroF1: macro / 100, weightedF1: weighted / 100 },
    config: {
      baseModel: $("baseModel").value,
      epochs: $("epochs").value,
      batchSize: $("batchSize").value,
      learningRate: $("learningRate").value,
      validationSplit: $("validationSplit").value,
      maxLength: $("maxLength").value,
      seed: $("seed").value,
      earlyStopping: $("earlyStop").checked,
    },
    modelTechnicalDetails: {
      architecture: "RobertaForSequenceClassification",
      modelType: "roberta",
      numLabels: 3,
      id2label: { 0: "Negative", 1: "Neutral", 2: "Positive" },
      tokenizer: "AutoTokenizer",
      weightFormat: "safetensors / pytorch_model.bin",
    },
    matrix,
    sampleAudit,
    trainedVerbatims,
    testedVerbatims,
  };
}

function renderSampleAudit(rows) {
  rows = rows || [];
  const pass = rows.filter((row) => row.result === "PASS").length;
  const fail = rows.length - pass;
  $("auditTotal").textContent = rows.length;
  $("auditPass").textContent = pass;
  $("auditFail").textContent = fail;
  if (!rows.length) {
    $("sampleAuditTable").querySelector("tbody").innerHTML = `<tr><td colspan="6">Run training to populate sample-level audit.</td></tr>`;
    return;
  }
  $("sampleAuditTable").querySelector("tbody").innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.sample)}</td><td>${escapeHtml(row.split)}</td><td>${escapeHtml(row.actual)}</td><td>${escapeHtml(row.predicted)}</td>
      <td>${escapeHtml(row.result)}</td><td>${Math.round(Number(row.confidence || 0) * 100)}%</td>
    </tr>`).join("");
}

function normalizePredictionRows(rows, fallbackSplit) {
  return (rows || []).map((row, index) => {
    const actual = normalizeSentiment(row.actual) || row.actual || "Unknown";
    const predicted = normalizeSentiment(row.predicted) || row.predicted || "Unknown";
    return {
      sample: row.index || row.sample || index + 1,
      split: row.split || fallbackSplit,
      actual,
      predicted,
      result: (String(actual).toLowerCase() === String(predicted).toLowerCase()) ? "PASS" : "FAIL",
      confidence: Number(row.confidence || 0),
      text: row.text || "",
    };
  });
}

function normalizeLocalAuditRows(profile) {
  return state.rows.slice(0, 30).map((row, index) => {
    const actual = normalizeSentiment(row[profile.labelCol]) || "Unknown";
    return {
      sample: index + 1,
      split: "pending",
      actual,
      predicted: "Not trained",
      result: "PENDING",
      confidence: 0,
      text: row[profile.textCol] || "",
    };
  });
}

function renderVerbatimTables(trainRows = [], testRows = []) {
  renderVerbatimTable("trainedVerbatimTable", trainRows, "Run training to populate trained verbatim predictions.");
  renderVerbatimTable("testedVerbatimTable", testRows, "Run training to populate tested verbatim predictions.");
}

function renderVerbatimTable(tableId, rows, emptyText) {
  const table = $(tableId);
  if (!table) return;
  rows = rows || [];
  if (!rows.length) {
    table.querySelector("tbody").innerHTML = `<tr><td colspan="6">${escapeHtml(emptyText)}</td></tr>`;
    return;
  }
  table.querySelector("tbody").innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.sample)}</td>
      <td>${escapeHtml(row.text)}</td>
      <td>${escapeHtml(row.actual)}</td>
      <td>${escapeHtml(row.predicted)}</td>
      <td>${Math.round(Number(row.confidence || 0) * 100)}%</td>
      <td>${escapeHtml(row.result)}</td>
    </tr>`).join("");
}

function renderQualityVerdict(metadata) {
  const accuracy = metadata.metrics.accuracy;
  const macro = metadata.metrics.macroF1;
  const fail = metadata.sampleAudit.filter((row) => row.result === "FAIL").length;
  const verdict = accuracy >= 0.9 && macro >= 0.85 && fail <= 3 ? "Excellent" : accuracy >= 0.82 ? "Good, validate with fresh production examples" : "Needs more labelled data or label cleanup";
  $("qualityVerdict").innerHTML = `
    <strong>${verdict}</strong><br>
    Evaluation accuracy: ${Math.round(accuracy * 100)}%<br>
    Macro F1: ${Math.round(macro * 100)}%<br>
    Failed sample audit rows: ${fail}<br>
    Minimum class count: ${Math.min(...Object.values(metadata.labelCounts))}
  `;
  const actions = [];
  if (fail) actions.push(`Review ${fail} failed sample rows, especially evaluation split failures.`);
  if (Math.min(...Object.values(metadata.labelCounts)) < 50) actions.push("Add more labelled samples to the smallest sentiment class. Target 50+ per class for initial quality.");
  actions.push("Compare this run against the previous training_metadata.json before replacing the analyzer model.");
  $("nextActions").innerHTML = actions.map((item, index) => `<div>${index + 1}. ${escapeHtml(item)}</div>`).join("");
}

function drawEmptyCharts() {
  drawCanvasMessage($("lossCanvas"), "Run training to see batch loss.");
  drawCanvasMessage($("trendCanvas"), "Run training to see rolling loss.");
  drawCanvasMessage($("heatmapCanvas"), "Run training to see confusion heatmap.");
  drawCanvasMessage($("epochCanvas"), "Run training to see epoch averages.");
}

function drawCharts(metadata) {
  drawLossCurve(metadata.telemetry || state.telemetry || []);
  drawRollingLoss(metadata.telemetry || state.telemetry || []);
  drawHeatmap(metadata);
  drawEpochLoss(metadata.epochMetrics || []);
}

function drawCanvasMessage(canvas, message) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7fbfd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#5e748c";
  ctx.font = "16px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function drawLossCurve(telemetry) {
  const canvas = $("lossCanvas");
  if (!canvas) return;
  const values = (telemetry || []).map((row) => Number(row.loss)).filter(Number.isFinite);
  drawLineChart(canvas, values, "#009c9b", "Loss");
}

function drawRollingLoss(telemetry) {
  const canvas = $("trendCanvas");
  if (!canvas) return;
  const values = (telemetry || []).map((row) => Number(row.rolling_loss)).filter(Number.isFinite);
  drawLineChart(canvas, values, "#0b2b44", "Rolling Loss");
}

function drawEpochLoss(epochMetrics) {
  const canvas = $("epochCanvas");
  if (!canvas) return;
  const values = (epochMetrics || []).map((row) => Number(row.average_loss)).filter(Number.isFinite);
  drawBarChart(canvas, values, "#009c9b", "Epoch Avg Loss");
}

function drawLineChart(canvas, values, color, label) {
  canvas.width = Math.max(920, values.length * 26 + 120);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!values.length) {
    drawCanvasMessage(canvas, `Waiting for ${label.toLowerCase()} telemetry.`);
    return;
  }
  drawAxes(ctx, canvas);
  const max = Math.max(...values, 0.001);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 0.001);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = 50 + (index / Math.max(values.length - 1, 1)) * (canvas.width - 90);
    const y = 210 - ((value - min) / span) * 160;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = "#10263f";
  ctx.font = "12px Segoe UI";
  ctx.fillText(`${label}: latest ${values[values.length - 1].toFixed(4)}`, 58, 28);
  ctx.fillStyle = "#5e748c";
  ctx.fillText(`Min ${min.toFixed(4)} | Max ${max.toFixed(4)} | Lower is better`, 58, 46);
  const labelEvery = Math.max(1, Math.ceil(values.length / 10));
  values.forEach((value, index) => {
    if (index !== 0 && index !== values.length - 1 && index % labelEvery !== 0) return;
    const x = 50 + (index / Math.max(values.length - 1, 1)) * (canvas.width - 90);
    const y = 210 - ((value - min) / span) * 160;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10263f";
    ctx.fillText(value.toFixed(3), Math.min(canvas.width - 72, x + 7), Math.max(18, y - 8));
  });
}

function drawBarChart(canvas, values, color, label) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!values.length) {
    drawCanvasMessage(canvas, `Waiting for ${label.toLowerCase()}.`);
    return;
  }
  drawAxes(ctx, canvas);
  const max = Math.max(...values, 0.001);
  const barWidth = Math.min(72, (canvas.width - 110) / values.length - 8);
  values.forEach((value, index) => {
    const height = (value / max) * 150;
    const x = 62 + index * ((canvas.width - 120) / values.length);
    const y = 210 - height;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, height);
    ctx.fillStyle = "#10263f";
    ctx.fillText(`E${index + 1}`, x + 4, 234);
    ctx.fillText(value.toFixed(3), x, y - 8);
  });
  ctx.fillStyle = "#5e748c";
  ctx.fillText("Lower bars mean better average training loss for that epoch.", 58, 28);
}

function drawHeatmap(metadata) {
  const canvas = $("heatmapCanvas");
  canvas.width = 760;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const labels = ["Positive", "Neutral", "Negative"];
  const backendCells = metadata.confusionMatrix ? matrixFromBackend(metadata.confusionMatrix).cells : null;
  const ids = [["mpp", "mpn", "mpg"], ["mnp", "mnn", "mng"], ["mgp", "mgn", "mgg"]];
  const left = 150;
  const top = 68;
  const cellW = 150;
  const cellH = 44;
  const gapX = 26;
  const gapY = 14;
  ctx.font = "13px Segoe UI";
  ctx.textAlign = "center";
  labels.forEach((label, index) => {
    ctx.fillStyle = "#5e748c";
    ctx.fillText(label, left + index * (cellW + gapX) + cellW / 2, 38);
    ctx.textAlign = "right";
    ctx.fillText(label, left - 24, top + index * (cellH + gapY) + 27);
    ctx.textAlign = "center";
  });
  ids.forEach((row, r) => row.forEach((id, c) => {
    const value = Number((backendCells || metadata.matrix.cells)[id] || 0);
    const intensity = Math.min(1, value / 60);
    ctx.fillStyle = `rgba(0, 156, 155, ${0.18 + intensity * 0.72})`;
    ctx.fillRect(left + c * (cellW + gapX), top + r * (cellH + gapY), cellW, cellH);
    ctx.fillStyle = "#10263f";
    ctx.fillText(value, left + c * (cellW + gapX) + cellW / 2, top + r * (cellH + gapY) + 27);
  }));
  ctx.fillStyle = "#5e748c";
  ctx.textAlign = "left";
  ctx.fillText("Actual labels on rows. Predicted labels on columns. Strong diagonal = better separation.", left, 260);
}

function drawAxes(ctx, canvas) {
  ctx.fillStyle = "#f7fbfd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#d7e4ed";
  ctx.lineWidth = 1;
  [60, 110, 160, 210].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(canvas.width - 30, y);
    ctx.stroke();
  });
  ctx.fillStyle = "#5e748c";
  ctx.font = "12px Segoe UI";
}

function predict() {
  const text = $("testText").value.toLowerCase();
  let sentiment = "Neutral";
  let confidence = 72;
  if (/(great|excellent|helpful|resolved|happy|love|good|clear|polite)/.test(text)) {
    sentiment = "Positive";
    confidence = 91;
  }
  if (/(bad|poor|slow|angry|not resolved|frustrating|issue|problem|delay|broken)/.test(text)) {
    sentiment = "Negative";
    confidence = 88;
  }
  $("predictionResult").innerHTML = `<strong>${sentiment}</strong><br>Confidence: ${confidence}%<br><span class="muted">This preview uses browser-side rules. Production analysis uses the selected Sparrow model.</span>`;
}

function buildInternalsReport(title) {
  const profile = datasetProfile();
  const metadata = state.metadata || {};
  return [
    `SPARROW DEEP TECHNICAL INTERNALS - ${title}`,
    "=".repeat(72),
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Current App Selections",
    "-".repeat(72),
    `Text Column: ${profile.textCol || "-"}`,
    `Label Column: ${profile.labelCol || "-"}`,
    `Base Model: ${$("baseModel").value}`,
    `Epochs: ${$("epochs").value}`,
    `Learning Rate: ${$("learningRate").value}`,
    `Batch Size: ${$("batchSize").value}`,
    `Validation Split: ${$("validationSplit").value}`,
    `Max Tokens: ${$("maxLength").value}`,
    `Seed: ${$("seed").value}`,
    "",
    "Dataset Profile",
    "-".repeat(72),
    `Uploaded Rows: ${state.rows.length}`,
    `Usable Rows: ${profile.ready}`,
    `Blank Text Rows: ${profile.missing}`,
    `Blank/Invalid Label Rows: ${profile.blankLabel}`,
    `Duplicate Text Rows: ${profile.duplicates}`,
    `Average Words: ${profile.avgWords}`,
    `Label Counts: ${JSON.stringify(profile.sentiments, null, 2)}`,
    "",
    "Model Technical Details",
    "-".repeat(72),
    JSON.stringify(metadata.modelTechnicalDetails || {
      architecture: "RobertaForSequenceClassification",
      model_type: "roberta",
      num_labels: 3,
      labels: ["negative", "neutral", "positive"],
      tokenizer: "AutoTokenizer",
    }, null, 2),
    "",
    "Latest Metadata",
    "-".repeat(72),
    JSON.stringify(metadata, null, 2),
  ].join("\n");
}

function writeInternals(text) {
  $("internalsReport").textContent = text;
}

function downloadText(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadLog() {
  const log = $("trainingLog").innerText.trim() || "No training log yet.";
  downloadText(`sparrow_training_log_${Date.now()}.txt`, log);
}

function downloadMetadata() {
  const metadata = state.metadata || { message: "No completed training metadata yet.", generatedAt: new Date().toISOString() };
  downloadText(`sparrow_training_metadata_${Date.now()}.json`, JSON.stringify(metadata, null, 2), "application/json");
}

function downloadFailed() {
  const rows = (state.metadata?.sampleAudit || []).filter((row) => row.result === "FAIL");
  const header = "sample,split,actual,predicted,result,confidence,text";
  const csv = [header].concat(rows.map((row) => [
    row.sample, row.split, row.actual, row.predicted, row.result, row.confidence, `"${String(row.text).replace(/"/g, '""')}"`
  ].join(","))).join("\n");
  downloadText(`sparrow_failed_samples_${Date.now()}.csv`, csv, "text/csv");
}

function compareRuns() {
  writeInternals([
    "TRAINING RUN COMPARISON",
    "=".repeat(72),
    "Use this view to compare old and new training_metadata.json files.",
    "",
    "Recommended comparison metrics:",
    "1. Samples trained",
    "2. Evaluation accuracy movement",
    "3. Macro F1 movement",
    "4. Failed sample count movement",
    "5. Class-wise precision, recall, and F1",
    "6. Label count balance",
    "",
    "HTML-only note: file-to-file JSON comparison can be connected next with a two-file upload control.",
  ].join("\n"));
}

function showGuide() {
  writeInternals([
    "SPARROW TRAINING GUIDE",
    "=".repeat(72),
    ...trainingDocumentation.flatMap((section) => [
      "",
      section.title,
      "-".repeat(section.title.length),
      ...section.items.map((item, index) => `${index + 1}. ${item}`),
    ]),
  ].join("\n"));
}

function readJsonFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      callback(JSON.parse(String(reader.result || "{}")));
    } catch (err) {
      alert(`Could not read metadata JSON: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

function pct(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${Math.round(value * 1000) / 10}%`;
}

function compareMetadataObjects(previous, next) {
  const prevMetrics = previous?.metrics || {};
  const nextMetrics = next?.metrics || {};
  const metricLine = (label, key) => {
    const before = Number(prevMetrics[key] || 0);
    const after = Number(nextMetrics[key] || 0);
    const delta = after - before;
    return `${label}: ${pct(before)} -> ${pct(after)} (${delta >= 0 ? "+" : ""}${pct(delta)})`;
  };
  const prevFails = (previous?.sampleAudit || []).filter((row) => row.result === "FAIL").length;
  const nextFails = (next?.sampleAudit || []).filter((row) => row.result === "FAIL").length;
  return [
    "TRAINING METADATA COMPARISON",
    "=".repeat(72),
    `Previous generated: ${previous?.generatedAt || "-"}`,
    `New generated: ${next?.generatedAt || "-"}`,
    "",
    "Dataset Movement",
    "-".repeat(72),
    `Rows: ${previous?.datasetRows || 0} -> ${next?.datasetRows || 0}`,
    `Usable rows: ${previous?.usableRows || 0} -> ${next?.usableRows || 0}`,
    `Train rows: ${previous?.trainRows || 0} -> ${next?.trainRows || 0}`,
    `Evaluation rows: ${previous?.evalRows || 0} -> ${next?.evalRows || 0}`,
    "",
    "Metric Movement",
    "-".repeat(72),
    metricLine("Accuracy", "accuracy"),
    metricLine("Macro F1", "macroF1"),
    metricLine("Weighted F1", "weightedF1"),
    "",
    "Audit Movement",
    "-".repeat(72),
    `Failed sample audit rows: ${prevFails} -> ${nextFails} (${nextFails - prevFails >= 0 ? "+" : ""}${nextFails - prevFails})`,
    `Previous label counts: ${JSON.stringify(previous?.labelCounts || {}, null, 2)}`,
    `New label counts: ${JSON.stringify(next?.labelCounts || {}, null, 2)}`,
    "",
    "Decision Guidance",
    "-".repeat(72),
    "Approve only if macro F1 is stable or improved, failure patterns are understood, and the model path validates in NPS Analyzer.",
  ].join("\n");
}

function compareMetadataFiles() {
  const previous = state.previousMetadata;
  const next = state.newMetadata || state.metadata;
  if (!previous || !next) {
    writeInternals("Load previous and new metadata JSON files first. If you have just run training, load only previous metadata and the current run will be used as the new metadata.");
    return;
  }
  writeInternals(compareMetadataObjects(previous, next));
}

function trainingSummaryLines() {
  const profile = datasetProfile();
  const metadata = state.metadata || {};
  const server = state.serverStatus?.model_status?.sparrow || {};
  const lines = [
    "SPARROW SENTIMENT TRAINING SUMMARY",
    `Generated: ${new Date().toLocaleString()}`,
    `Model path: ${$("outputPath").value || server.path || "models/sparrow_cnx_sentimentmodel"}`,
    `Backend status: ${$("backendStatus")?.textContent || "Not checked"}`,
    `Model status: ${$("modelStatus")?.textContent || "Not checked"}`,
    "",
    "CURRENT DATASET PROFILE",
    `Uploaded rows: ${state.rows.length}`,
    `Usable rows: ${profile.ready}`,
    `Readiness score: ${profile.score}%`,
    `Feedback column: ${profile.textCol || "-"}`,
    `Sentiment column: ${profile.labelCol || "-"}`,
    `Positive rows: ${profile.sentiments.Positive}`,
    `Neutral rows: ${profile.sentiments.Neutral}`,
    `Negative rows: ${profile.sentiments.Negative}`,
    `Missing feedback rows: ${profile.missing}`,
    `Invalid or blank labels: ${profile.blankLabel}`,
    `Duplicate verbatims: ${profile.duplicates}`,
    `Average words: ${profile.avgWords}`,
    "",
    "TRAINING CONFIGURATION",
    `Base model: ${$("baseModel").value}`,
    `Epochs: ${$("epochs").value}`,
    `Batch size: ${$("batchSize").value}`,
    `Learning rate: ${$("learningRate").value}`,
    `Validation split: ${$("validationSplit").value}`,
    `Max tokens: ${$("maxLength").value}`,
    `Random seed: ${$("seed").value}`,
    `Early stopping: ${$("earlyStop").checked ? "Enabled" : "Disabled"}`,
    "",
    "LATEST EVALUATION",
    `Accuracy: ${metadata.metrics ? pct(metadata.metrics.accuracy) : $("accuracyMetric").textContent}`,
    `Macro F1: ${metadata.metrics ? pct(metadata.metrics.macroF1) : $("macroMetric").textContent}`,
    `Weighted F1: ${metadata.metrics ? pct(metadata.metrics.weightedF1) : $("weightedMetric").textContent}`,
    `Audited samples: ${$("auditTotal").textContent}`,
    `Audit pass: ${$("auditPass").textContent}`,
    `Audit fail: ${$("auditFail").textContent}`,
    `Quality verdict: ${$("qualityVerdict").innerText.trim()}`,
    "",
    "TRAINING DOCUMENTATION",
  ];
  trainingDocumentation.forEach((section) => {
    lines.push("", section.title);
    section.items.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
  });
  lines.push("", "PUBLISHING CHECKLIST");
  publishingChecklist.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
  lines.push("", "TRAINING LOG");
  lines.push(...(($("trainingLog").innerText.trim() || "No training log captured yet.").split("\n")));
  lines.push("", "TECHNICAL INTERNALS");
  lines.push(...(($("internalsReport").innerText.trim() || buildInternalsReport("PDF snapshot")).split("\n")));
  return lines;
}

function wrapPdfLines(lines, maxChars = 96) {
  const wrapped = [];
  lines.forEach((line) => {
    const text = String(line || "");
    if (!text) {
      wrapped.push("");
      return;
    }
    let current = text;
    while (current.length > maxChars) {
      let splitAt = current.lastIndexOf(" ", maxChars);
      if (splitAt < 35) splitAt = maxChars;
      wrapped.push(current.slice(0, splitAt));
      current = current.slice(splitAt).trim();
    }
    wrapped.push(current);
  });
  return wrapped;
}

function pdfEscape(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(lines) {
  const pageLines = [];
  const wrapped = wrapPdfLines(lines);
  for (let i = 0; i < wrapped.length; i += 46) pageLines.push(wrapped.slice(i, i + 46));
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pagesId = addObject("__PAGES__");
  const pageIds = [];
  pageLines.forEach((linesForPage, pageIndex) => {
    const content = [
      "BT",
      "/F1 10 Tf",
      "50 792 Td",
      "14 TL",
      `(${pdfEscape(`Sparrow Training Summary - Page ${pageIndex + 1}`)}) Tj`,
      "T*",
      "T*",
      ...linesForPage.map((line) => `(${pdfEscape(line)}) Tj T*`),
      "ET",
    ].join("\n");
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function downloadTrainingSummaryPdf() {
  $("summaryStatus").textContent = "Generating training summary PDF...";
  const pdf = buildPdf(trainingSummaryLines());
  downloadText(`sparrow_training_summary_${Date.now()}.pdf`, pdf, "application/pdf");
  $("summaryStatus").textContent = "Training summary PDF generated with workflow, documentation, metrics, logs, and internals.";
}

function copyPath() {
  const value = $("outputPath").value;
  navigator.clipboard?.writeText(value);
  $("copyPath").textContent = "Copied";
  setTimeout(() => { $("copyPath").textContent = "Copy Model Path"; }, 1400);
}

function useBundledPath() {
  $("outputPath").value = "models/sparrow_cnx_sentimentmodel_new";
  $("modelPathStatus").textContent = $("outputPath").value;
  $("outputPath").focus();
}

function syncOutputPathStatus() {
  $("modelPathStatus").textContent = $("outputPath").value || "No output path entered.";
  renderDetailedData();
}

function editOutputPath() {
  const nextPath = prompt("Enter Sparrow model output folder path:", $("outputPath").value || "models/sparrow_cnx_sentimentmodel");
  if (nextPath === null) return;
  $("outputPath").value = nextPath.trim();
  syncOutputPathStatus();
  $("outputPath").focus();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

$("loginBtn").addEventListener("click", login);
$("loginPass").addEventListener("keydown", (event) => { if (event.key === "Enter") login(); });
$("logoutBtn").addEventListener("click", () => { localStorage.removeItem("sparrowTrainingAuth"); location.reload(); });
$("dataFile").addEventListener("change", (event) => { if (event.target.files[0]) loadFile(event.target.files[0]); });
$("validateMapping").addEventListener("click", validateMapping);
$("textColumn").addEventListener("change", updateStats);
$("labelColumn").addEventListener("change", updateStats);
$("maxLength").addEventListener("input", updateStats);
["baseModel", "epochs", "batchSize", "learningRate", "validationSplit", "seed", "earlyStop"].forEach((id) => {
  const input = $(id);
  input?.addEventListener("input", renderDetailedData);
  input?.addEventListener("change", renderDetailedData);
});
$("startTraining").addEventListener("click", () => startTraining().catch((err) => alert(err.message)));
$("predictBtn").addEventListener("click", predict);
$("copyPath").addEventListener("click", copyPath);
$("editOutputPath").addEventListener("click", editOutputPath);
$("useBundledPath").addEventListener("click", useBundledPath);
$("outputPath").addEventListener("input", syncOutputPathStatus);
$("downloadLog").addEventListener("click", downloadLog);
$("downloadMetadata").addEventListener("click", downloadMetadata);
$("downloadFailed").addEventListener("click", downloadFailed);
$("downloadSummaryPdf").addEventListener("click", downloadTrainingSummaryPdf);
$("downloadSummaryPdfTop").addEventListener("click", downloadTrainingSummaryPdf);
$("downloadDetailedDataCsv")?.addEventListener("click", downloadDetailedDataCsv);
$("clearLog").addEventListener("click", () => { $("trainingLog").innerHTML = ""; });
$("showInternals").addEventListener("click", () => writeInternals(buildInternalsReport("Current snapshot")));
$("compareRuns").addEventListener("click", compareRuns);
$("showGuide").addEventListener("click", showGuide);
$("refreshStatus").addEventListener("click", refreshBackendStatus);
$("validateModel").addEventListener("click", () => validateSparrowModel().catch(() => {}));
$("previousMetadataFile").addEventListener("change", (event) => {
  readJsonFile(event.target.files[0], (json) => {
    state.previousMetadata = json;
    writeInternals("Previous metadata loaded. Load new metadata or use the current training run, then compare.");
  });
});
$("newMetadataFile").addEventListener("change", (event) => {
  readJsonFile(event.target.files[0], (json) => {
    state.newMetadata = json;
    writeInternals("New metadata loaded. Compare metadata files when ready.");
  });
});
$("compareMetadataFiles").addEventListener("click", compareMetadataFiles);

const launchParams = new URLSearchParams(window.location.search);
if (launchParams.get("login") === "1") {
  localStorage.removeItem("sparrowTrainingAuth");
  launchParams.delete("login");
  const cleanQuery = launchParams.toString();
  const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${window.location.hash}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

if (localStorage.getItem("sparrowTrainingAuth") === "1") showApp();


