from __future__ import annotations

import cgi
import datetime as dt
import io
import json
import math
import mimetypes
import platform
import re
import time
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import sys

APP_ROOT_FOR_PACKAGES = Path(__file__).resolve().parent
SUITE_ROOT_FOR_PACKAGES = APP_ROOT_FOR_PACKAGES.parents[1] if len(APP_ROOT_FOR_PACKAGES.parents) > 1 else APP_ROOT_FOR_PACKAGES.parent
PYTHON_PACKAGES_FOR_APP = SUITE_ROOT_FOR_PACKAGES / "python_packages"
if PYTHON_PACKAGES_FOR_APP.exists():
    sys.path.insert(0, str(PYTHON_PACKAGES_FOR_APP))
from urllib.parse import urlparse

import joblib
import pandas as pd
import sklearn
import sentence_transformers
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parent
SUITE_ROOT = ROOT.parents[1] if len(ROOT.parents) > 1 and (ROOT.parents[1] / "models").exists() else ROOT.parent
MODEL_BUNDLE_DIR = SUITE_ROOT / "models" / "theme_acpt_resolution_model"
MODEL_PATH = MODEL_BUNDLE_DIR / "all-MiniLM-L6-v2"
TRAINED_DIR = MODEL_BUNDLE_DIR
TRAINED_MODEL_PATH = TRAINED_DIR / "theme_classifier.joblib"
MODEL_MANIFEST_PATH = TRAINED_DIR / "models.json"
HOST = "127.0.0.1"
PORT = 8766
EMBEDDER_CACHE: dict[str, SentenceTransformer] = {}


def clean_text(value: Any) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return " ".join(str(value).strip().split())


def json_safe(value: Any) -> Any:
    if value is None or value is pd.NA or value is pd.NaT:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    if isinstance(value, (pd.Timestamp, dt.datetime, dt.date)):
        return value.isoformat(sep=" ") if isinstance(value, dt.datetime) else value.isoformat()
    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [json_safe(v) for v in value]
    if hasattr(value, "item"):
        try:
            return json_safe(value.item())
        except Exception:
            pass
    return value


def records_from_upload(filename: str, data: bytes) -> pd.DataFrame:
    suffix = Path(filename).suffix.lower()
    if suffix in {".xlsx", ".xlsm", ".xls"}:
        return pd.read_excel(io.BytesIO(data))
    if suffix in {".csv", ".txt"}:
        return pd.read_csv(io.BytesIO(data))
    raise ValueError("Upload a CSV or Excel file.")


def infer_feedback_column(columns: list[str]) -> str:
    preferred = ["verbatim", "feedback", "comment", "comments", "description", "summary", "narrative", "text"]
    lowered = {column.lower(): column for column in columns}
    for hint in preferred:
        for lower, original in lowered.items():
            if hint in lower:
                return original
    return columns[0] if columns else ""


def model_slug(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", clean_text(name).lower()).strip("-")
    return slug or "trained-theme-model"


def read_manifest() -> list[dict[str, Any]]:
    if not MODEL_MANIFEST_PATH.exists():
        return []
    try:
        data = json.loads(MODEL_MANIFEST_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def write_manifest(items: list[dict[str, Any]]) -> None:
    TRAINED_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_MANIFEST_PATH.write_text(json.dumps(items, indent=2), encoding="utf-8")


def upsert_manifest(item: dict[str, Any]) -> None:
    items = [existing for existing in read_manifest() if existing.get("id") != item.get("id")]
    items.append(item)
    items.sort(key=lambda row: str(row.get("name", "")).lower())
    write_manifest(items)


def resolve_portable_path(value: str | Path, default: Path | None = None) -> Path:
    text = clean_text(str(value or ""))
    if not text:
        return default or TRAINED_DIR
    path = Path(text).expanduser()
    if not path.is_absolute():
        path = SUITE_ROOT / path
    return path


def portable_model_path(path: Path) -> str:
    try:
        return path.resolve().relative_to(SUITE_ROOT.resolve()).as_posix()
    except Exception:
        return str(path)


def discover_model_files(folder: str = "") -> list[dict[str, Any]]:
    folder_path = resolve_portable_path(folder, TRAINED_DIR)
    if not folder_path.exists() or not folder_path.is_dir():
        raise ValueError(f"Model folder not found: {folder_path}")
    models = []
    for model_file in sorted(folder_path.glob("*.joblib"), key=lambda path: path.name.lower()):
        try:
            bundle = joblib.load(model_file)
            name = clean_text(bundle.get("modelName")) or model_file.stem
            labels = bundle.get("labels") or []
            outputs = ["Theme", *list((bundle.get("outputClassifiers") or {}).keys())]
        except Exception:
            name = model_file.stem
            labels = []
            outputs = []
        models.append(
            {
                "id": portable_model_path(model_file),
                "name": name,
                "path": portable_model_path(model_file),
                "bytes": model_file.stat().st_size,
                "modifiedAt": dt.datetime.fromtimestamp(model_file.stat().st_mtime).isoformat(timespec="seconds"),
                "labelCount": len(labels),
                "labels": labels,
                "outputs": outputs,
            }
        )
    return models


def get_embedder(model_path: Path) -> SentenceTransformer:
    cache_key = str(model_path.resolve())
    if cache_key not in EMBEDDER_CACHE:
        EMBEDDER_CACHE[cache_key] = SentenceTransformer(str(model_path))
    return EMBEDDER_CACHE[cache_key]


def predict_one_verbatim(model_path: str, text: str) -> dict[str, Any]:
    clean = clean_text(text)
    if len(clean.split()) < 3:
        raise ValueError("Enter at least 3 words to test a model.")
    path = resolve_portable_path(model_path)
    if not path.exists() or path.suffix.lower() != ".joblib":
        raise ValueError(f"Model file not found: {model_path}")
    bundle = joblib.load(path)
    classifier = bundle.get("classifier")
    if classifier is None:
        raise ValueError(f"Model file does not contain a classifier: {path.name}")
    embedder_path = Path(bundle.get("modelPath") or MODEL_PATH)
    embedder = get_embedder(embedder_path)
    vector = embedder.encode([clean], normalize_embeddings=True, show_progress_bar=False)
    probabilities = classifier.predict_proba(vector)[0]
    classes = list(classifier.classes_)
    ranked = sorted(zip(classes, probabilities), key=lambda item: item[1], reverse=True)
    top_label, top_probability = ranked[0]
    output_predictions = {}
    for output_name, output_bundle in (bundle.get("outputClassifiers") or {}).items():
        output_classifier = output_bundle.get("classifier")
        if output_classifier is None:
            continue
        output_probs = output_classifier.predict_proba(vector)[0]
        output_classes = list(output_classifier.classes_)
        output_ranked = sorted(zip(output_classes, output_probs), key=lambda item: item[1], reverse=True)
        output_predictions[output_name] = {
            "prediction": str(output_ranked[0][0]),
            "confidence": float(output_ranked[0][1]),
            "topProbabilities": [{"theme": str(label), "confidence": float(prob)} for label, prob in output_ranked[:5]],
        }
    return {
        "modelName": clean_text(bundle.get("modelName")) or path.stem,
        "modelPath": str(path.resolve()),
        "trainedAt": bundle.get("trainedAt", ""),
        "feedbackColumn": bundle.get("feedbackColumn", ""),
        "labelColumn": bundle.get("labelColumn", ""),
        "labelCount": len(classes),
        "prediction": str(top_label),
        "confidence": float(top_probability),
        "topProbabilities": [{"theme": str(label), "confidence": float(prob)} for label, prob in ranked[:5]],
        "outputs": output_predictions,
    }


def elapsed(start: float) -> float:
    return round(time.perf_counter() - start, 3)


def flatten_for_sheet(value: Any, prefix: str = "") -> list[dict[str, Any]]:
    rows = []
    if isinstance(value, dict):
        for key, nested in value.items():
            nested_key = f"{prefix}.{key}" if prefix else str(key)
            rows.extend(flatten_for_sheet(nested, nested_key))
    elif isinstance(value, list):
        rows.append({"Detail": prefix, "Value": ", ".join(str(item) for item in value)})
    else:
        rows.append({"Detail": prefix, "Value": value})
    return rows


def build_training_workbook(metrics: dict[str, Any]) -> bytes:
    output = io.BytesIO()
    report = metrics.get("report", {}) or {}
    tech = metrics.get("technicalDetails", {}) or {}
    labels = metrics.get("labels", []) or []
    label_counts = metrics.get("labelCounts", {}) or {}
    confusion = metrics.get("confusionMatrix", []) or []
    predictions = metrics.get("testPredictions", []) or []
    outputs = metrics.get("outputs", {}) or {}

    summary_rows = [
        {"Metric": "Model Name", "Value": metrics.get("modelName", "")},
        {"Metric": "Model ID", "Value": metrics.get("modelId", "")},
        {"Metric": "Training Rows Used", "Value": metrics.get("trainedRows", "")},
        {"Metric": "Train Rows", "Value": metrics.get("trainRows", "")},
        {"Metric": "Test Rows", "Value": metrics.get("testRows", "")},
        {"Metric": "Accuracy", "Value": metrics.get("accuracy", "")},
        {"Metric": "Macro F1", "Value": metrics.get("macroF1", "")},
        {"Metric": "Weighted F1", "Value": metrics.get("weightedF1", "")},
        {"Metric": "Exported At", "Value": dt.datetime.now().isoformat(timespec="seconds")},
    ]
    report_rows = []
    for label, values in report.items():
        if isinstance(values, dict):
            report_rows.append(
                {
                    "Theme": label,
                    "Precision": values.get("precision", ""),
                    "Recall": values.get("recall", ""),
                    "F1": values.get("f1-score", ""),
                    "Support": values.get("support", ""),
                }
            )
        else:
            report_rows.append({"Theme": label, "Precision": values, "Recall": "", "F1": "", "Support": ""})
    confusion_rows = []
    for idx, row in enumerate(confusion):
        row_data = {"Actual Theme": labels[idx] if idx < len(labels) else idx}
        for col_idx, value in enumerate(row):
            row_data[f"Predicted: {labels[col_idx] if col_idx < len(labels) else col_idx}"] = value
        confusion_rows.append(row_data)
    output_rows = []
    for output_name, output in outputs.items():
        output_rows.append(
            {
                "Output": output_name,
                "Trained": "Yes" if output.get("trained") else "No",
                "Column": output.get("column", ""),
                "Rows": output.get("rows", ""),
                "Train Rows": output.get("trainRows", ""),
                "Test Rows": output.get("testRows", ""),
                "Labels": ", ".join(str(label) for label in output.get("labels", [])),
                "Accuracy": output.get("accuracy", ""),
                "Macro F1": output.get("macroF1", ""),
                "Weighted F1": output.get("weightedF1", ""),
                "Reason": output.get("reason", ""),
            }
        )

    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        pd.DataFrame(summary_rows).to_excel(writer, sheet_name="Summary", index=False)
        pd.DataFrame(output_rows).to_excel(writer, sheet_name="Outputs", index=False)
        pd.DataFrame(flatten_for_sheet(tech)).to_excel(writer, sheet_name="Technical Details", index=False)
        pd.DataFrame([{"Theme": key, "Rows": value} for key, value in label_counts.items()]).to_excel(writer, sheet_name="Label Distribution", index=False)
        pd.DataFrame(report_rows).to_excel(writer, sheet_name="Performance", index=False)
        pd.DataFrame(confusion_rows).to_excel(writer, sheet_name="Confusion Matrix", index=False)
        pd.DataFrame(predictions).to_excel(writer, sheet_name="Test Predictions", index=False)
        for sheet in writer.sheets.values():
            sheet.freeze_panes(1, 0)
            sheet.set_column(0, 0, 28)
            sheet.set_column(1, 12, 18)
    return output.getvalue()


def train_model(
    df: pd.DataFrame,
    feedback_col: str,
    label_col: str,
    max_rows: int,
    model_name: str,
    acpt_col: str = "",
    resolution_col: str = "",
) -> dict[str, Any]:
    total_start = time.perf_counter()
    if not MODEL_PATH.exists():
        raise ValueError(f"Embedding model not found at {MODEL_PATH}.")
    rows = []
    skipped = Counter()
    scanned_rows = 0
    for _, row in df.iterrows():
        scanned_rows += 1
        text = clean_text(row.get(feedback_col))
        label = clean_text(row.get(label_col))
        words = len(text.split())
        if not text:
            skipped["blank_feedback"] += 1
        elif words < 3:
            skipped["short_feedback_under_3_words"] += 1
        elif not label:
            skipped["blank_label"] += 1
        else:
            rows.append((text, label))
        if max_rows > 0 and len(rows) >= max_rows:
            break
    if len(rows) < 20:
        raise ValueError("Need at least 20 labeled, meaningful feedback rows to train.")

    texts = [text for text, _ in rows]
    labels = [label for _, label in rows]
    counts = Counter(labels)
    if len(counts) < 2:
        raise ValueError("Need at least two theme labels to train a classifier.")

    stratify = labels if min(counts.values()) >= 2 and len(rows) >= 30 else None
    split_start = time.perf_counter()
    x_train, x_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=0.2 if len(rows) >= 50 else 0.25,
        random_state=42,
        stratify=stratify,
    )
    split_seconds = elapsed(split_start)

    embedding_start = time.perf_counter()
    embedder = SentenceTransformer(str(MODEL_PATH))
    train_vectors = embedder.encode(x_train, normalize_embeddings=True, show_progress_bar=False)
    test_vectors = embedder.encode(x_test, normalize_embeddings=True, show_progress_bar=False)
    embedding_seconds = elapsed(embedding_start)
    training_start = time.perf_counter()
    classifier = LogisticRegression(max_iter=1500, class_weight="balanced", n_jobs=1)
    classifier.fit(train_vectors, y_train)
    training_seconds = elapsed(training_start)
    evaluation_start = time.perf_counter()
    predictions = classifier.predict(test_vectors)
    evaluation_seconds = elapsed(evaluation_start)

    def train_optional_output(output_name: str, output_col: str) -> dict[str, Any] | None:
        if not output_col or output_col not in df.columns:
            return None
        output_rows = []
        for _, source_row in df.iterrows():
            text_value = clean_text(source_row.get(feedback_col))
            label_value = clean_text(source_row.get(output_col))
            if len(text_value.split()) >= 3 and label_value:
                output_rows.append((text_value, label_value))
            if max_rows > 0 and len(output_rows) >= max_rows:
                break
        output_counts = Counter(label for _, label in output_rows)
        if len(output_rows) < 20 or len(output_counts) < 2:
            return {
                "output": output_name,
                "trained": False,
                "reason": "Need at least 20 meaningful rows and at least two labels.",
                "rows": len(output_rows),
                "labels": sorted(output_counts),
            }
        output_texts = [text for text, _ in output_rows]
        output_labels = [label for _, label in output_rows]
        output_stratify = output_labels if min(output_counts.values()) >= 2 and len(output_rows) >= 30 else None
        out_train, out_test, label_train, label_test = train_test_split(
            output_texts,
            output_labels,
            test_size=0.2 if len(output_rows) >= 50 else 0.25,
            random_state=42,
            stratify=output_stratify,
        )
        out_train_vectors = embedder.encode(out_train, normalize_embeddings=True, show_progress_bar=False)
        out_test_vectors = embedder.encode(out_test, normalize_embeddings=True, show_progress_bar=False)
        out_classifier = LogisticRegression(max_iter=1500, class_weight="balanced", n_jobs=1)
        out_classifier.fit(out_train_vectors, label_train)
        out_predictions = out_classifier.predict(out_test_vectors)
        return {
            "output": output_name,
            "trained": True,
            "column": output_col,
            "classifier": out_classifier,
            "rows": len(output_rows),
            "trainRows": len(out_train),
            "testRows": len(out_test),
            "labels": sorted(output_counts),
            "labelCounts": dict(output_counts),
            "accuracy": accuracy_score(label_test, out_predictions),
            "macroF1": f1_score(label_test, out_predictions, average="macro", zero_division=0),
            "weightedF1": f1_score(label_test, out_predictions, average="weighted", zero_division=0),
            "report": classification_report(label_test, out_predictions, output_dict=True, zero_division=0),
        }

    TRAINED_DIR.mkdir(parents=True, exist_ok=True)
    clean_name = clean_text(model_name) or f"Theme Model {dt.datetime.now().strftime('%Y-%m-%d %H%M')}"
    slug = model_slug(clean_name)
    model_file = TRAINED_DIR / f"{slug}.joblib"
    bundle = {
        "classifier": classifier,
        "modelPath": str(MODEL_PATH),
        "modelName": clean_name,
        "modelId": slug,
        "feedbackColumn": feedback_col,
        "labelColumn": label_col,
        "trainedAt": dt.datetime.now().isoformat(timespec="seconds"),
        "labels": sorted(counts),
        "labelCounts": dict(counts),
    }
    optional_outputs = [
        train_optional_output("ACPT", acpt_col),
        train_optional_output("Resolution Status", resolution_col),
    ]
    trained_optional_outputs = [output for output in optional_outputs if output and output.get("trained")]
    skipped_optional_outputs = [output for output in optional_outputs if output and not output.get("trained")]
    if trained_optional_outputs:
        bundle["outputClassifiers"] = {
            output["output"]: {
                "classifier": output["classifier"],
                "column": output["column"],
                "labels": output["labels"],
                "labelCounts": output["labelCounts"],
            }
            for output in trained_optional_outputs
        }

    report = classification_report(y_test, predictions, output_dict=True, zero_division=0)
    ordered_labels = sorted(counts)
    train_counts = Counter(y_train)
    test_counts = Counter(y_test)
    prediction_counts = Counter(predictions)
    majority_label, majority_count = counts.most_common(1)[0]
    majority_baseline_accuracy = max(test_counts.values()) / len(y_test) if y_test else 0
    matrix = confusion_matrix(y_test, predictions, labels=ordered_labels).tolist()
    metrics = {
        "trainedRows": len(rows),
        "trainRows": len(x_train),
        "testRows": len(x_test),
        "labels": ordered_labels,
        "labelCounts": dict(counts),
        "accuracy": accuracy_score(y_test, predictions),
        "macroF1": f1_score(y_test, predictions, average="macro", zero_division=0),
        "weightedF1": f1_score(y_test, predictions, average="weighted", zero_division=0),
        "report": report,
        "confusionMatrix": matrix,
        "testPredictions": [
            {
                "Feedback": text,
                "Actual Theme": actual,
                "Predicted Theme": predicted,
                "Correct": actual == predicted,
            }
            for text, actual, predicted in zip(x_test, y_test, predictions)
        ],
        "modelName": clean_name,
        "modelId": slug,
        "modelPath": str(model_file),
        "outputs": {
            "Theme": {
                "trained": True,
                "column": label_col,
                "rows": len(rows),
                "trainRows": len(x_train),
                "testRows": len(x_test),
                "labels": ordered_labels,
                "accuracy": accuracy_score(y_test, predictions),
                "macroF1": f1_score(y_test, predictions, average="macro", zero_division=0),
                "weightedF1": f1_score(y_test, predictions, average="weighted", zero_division=0),
            },
            **{
                output["output"]: {
                    "trained": True,
                    "column": output["column"],
                    "rows": output["rows"],
                    "trainRows": output["trainRows"],
                    "testRows": output["testRows"],
                    "labels": output["labels"],
                    "accuracy": output["accuracy"],
                    "macroF1": output["macroF1"],
                    "weightedF1": output["weightedF1"],
                }
                for output in trained_optional_outputs
            },
            **{
                output["output"]: {
                    "trained": False,
                    "column": output.get("column", ""),
                    "rows": output.get("rows", 0),
                    "labels": output.get("labels", []),
                    "reason": output.get("reason", ""),
                }
                for output in skipped_optional_outputs
            },
        },
        "technicalDetails": {
            "input": {
                "sourceRowsScanned": scanned_rows,
                "originalRowsInFile": len(df),
                "usableRowsAfterFiltering": len(rows),
                "feedbackColumn": feedback_col,
                "labelColumn": label_col,
                "maxTrainingRows": max_rows,
                "minimumWordsRequired": 3,
                "skippedRows": dict(skipped),
                "uniqueLabels": len(counts),
                "majorityLabel": majority_label,
                "majorityLabelRows": majority_count,
                "minorityLabelRows": min(counts.values()),
            },
            "split": {
                "method": "scikit-learn train_test_split",
                "testSize": 0.2 if len(rows) >= 50 else 0.25,
                "randomState": 42,
                "stratified": bool(stratify),
                "trainRows": len(x_train),
                "testRows": len(x_test),
                "trainLabelDistribution": dict(train_counts),
                "testLabelDistribution": dict(test_counts),
            },
            "embedding": {
                "package": "sentence-transformers",
                "model": "all-MiniLM-L6-v2",
                "modelPath": str(MODEL_PATH),
                "embeddingStrategy": "Frozen base model; no MiniLM weight updates",
                "normalizeEmbeddings": True,
                "trainVectorShape": list(getattr(train_vectors, "shape", [])),
                "testVectorShape": list(getattr(test_vectors, "shape", [])),
                "embeddingDimensions": int(train_vectors.shape[1]) if len(getattr(train_vectors, "shape", [])) > 1 else 0,
            },
            "classifier": {
                "algorithm": "LogisticRegression",
                "trainingType": "Classifier trained on top of frozen MiniLM embeddings",
                "epochs": "Not applicable; Logistic Regression uses iterative optimization, not neural-network epochs",
                "maxIter": 1500,
                "iterationsUsedByClass": [int(value) for value in getattr(classifier, "n_iter_", [])],
                "classWeight": "balanced",
                "solver": classifier.solver,
                "penalty": classifier.penalty,
                "regularizationC": classifier.C,
                "tolerance": classifier.tol,
                "fitIntercept": classifier.fit_intercept,
                "classes": list(classifier.classes_),
                "coefficientShape": list(getattr(classifier.coef_, "shape", [])),
                "interceptShape": list(getattr(classifier.intercept_, "shape", [])),
            },
            "evaluation": {
                "metrics": ["accuracy", "macro F1", "weighted F1", "precision", "recall", "per-theme F1", "confusion matrix"],
                "validationSetRows": len(y_test),
                "correctPredictions": int(sum(1 for actual, predicted in zip(y_test, predictions) if actual == predicted)),
                "incorrectPredictions": int(sum(1 for actual, predicted in zip(y_test, predictions) if actual != predicted)),
                "majorityBaselineAccuracy": majority_baseline_accuracy,
                "predictionDistribution": dict(prediction_counts),
                "zeroDivision": 0,
            },
            "timingsSeconds": {
                "split": split_seconds,
                "embedding": embedding_seconds,
                "classifierFit": training_seconds,
                "evaluation": evaluation_seconds,
                "total": elapsed(total_start),
            },
            "environment": {
                "python": platform.python_version(),
                "platform": platform.platform(),
                "pandas": pd.__version__,
                "scikitLearn": sklearn.__version__,
                "sentenceTransformers": sentence_transformers.__version__,
                "joblib": joblib.__version__,
            },
            "artifacts": {
                "namedModelPath": str(model_file),
                "latestModelPath": str(TRAINED_MODEL_PATH),
                "manifestPath": str(MODEL_MANIFEST_PATH),
                "namedModelBytes": model_file.stat().st_size if model_file.exists() else 0,
                "latestModelBytes": TRAINED_MODEL_PATH.stat().st_size if TRAINED_MODEL_PATH.exists() else 0,
            },
            "outputs": {
                output_name: {
                    key: value
                    for key, value in output.items()
                    if key not in {"labels"}
                }
                for output_name, output in {
                    "Theme": {
                        "trained": True,
                        "column": label_col,
                        "rows": len(rows),
                        "trainRows": len(x_train),
                        "testRows": len(x_test),
                        "accuracy": accuracy_score(y_test, predictions),
                        "macroF1": f1_score(y_test, predictions, average="macro", zero_division=0),
                        "weightedF1": f1_score(y_test, predictions, average="weighted", zero_division=0),
                    },
                    **{
                        output["output"]: {
                            "trained": True,
                            "column": output["column"],
                            "rows": output["rows"],
                            "trainRows": output["trainRows"],
                            "testRows": output["testRows"],
                            "accuracy": output["accuracy"],
                            "macroF1": output["macroF1"],
                            "weightedF1": output["weightedF1"],
                        }
                        for output in trained_optional_outputs
                    },
                    **{
                        output["output"]: {
                            "trained": False,
                            "column": output.get("column", ""),
                            "rows": output.get("rows", 0),
                            "reason": output.get("reason", ""),
                        }
                        for output in skipped_optional_outputs
                    },
                }.items()
            },
        },
    }
    joblib.dump(bundle, model_file)
    joblib.dump(bundle, TRAINED_MODEL_PATH)
    metrics["technicalDetails"]["artifacts"]["namedModelBytes"] = model_file.stat().st_size if model_file.exists() else 0
    metrics["technicalDetails"]["artifacts"]["latestModelBytes"] = TRAINED_MODEL_PATH.stat().st_size if TRAINED_MODEL_PATH.exists() else 0
    upsert_manifest(
        {
            "id": slug,
            "name": clean_name,
            "path": portable_model_path(model_file),
            "trainedAt": bundle["trainedAt"],
            "trainedRows": len(rows),
            "labels": sorted(counts),
            "outputs": list(metrics.get("outputs", {}).keys()),
            "accuracy": metrics["accuracy"],
            "macroF1": metrics["macroF1"],
            "weightedF1": metrics["weightedF1"],
        }
    )
    return metrics


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        return

    def cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(json_safe(payload), ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_excel(self, body: bytes, filename: str) -> None:
        self.send_response(200)
        self.cors_headers()
        self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/":
            path = "/index.html"
        if path == "/api/health":
            self.send_json({"ok": True, "modelDownloaded": MODEL_PATH.exists(), "trainedModel": TRAINED_MODEL_PATH.exists(), "models": read_manifest()})
            return
        target = (ROOT / path.lstrip("/")).resolve()
        if not str(target).startswith(str(ROOT)) or not target.exists() or not target.is_file():
            self.send_error(404)
            return
        body = target.read_bytes()
        self.send_response(200)
        self.cors_headers()
        self.send_header("Content-Type", mimetypes.guess_type(str(target))[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/list-models":
            try:
                content_length = int(self.headers.get("Content-Length", "0") or 0)
                payload = json.loads(self.rfile.read(content_length).decode("utf-8") or "{}")
                folder = payload.get("folder") or str(TRAINED_DIR)
                self.send_json({"ok": True, "folder": str(Path(folder).expanduser()), "models": discover_model_files(folder)})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if path == "/api/test-models":
            try:
                content_length = int(self.headers.get("Content-Length", "0") or 0)
                payload = json.loads(self.rfile.read(content_length).decode("utf-8") or "{}")
                text = clean_text(payload.get("text"))
                model_paths = [clean_text(path) for path in payload.get("models", []) if clean_text(path)]
                if not model_paths:
                    raise ValueError("Select at least one model.")
                if len(model_paths) > 3:
                    raise ValueError("Select up to three models.")
                results = [predict_one_verbatim(model_path, text) for model_path in model_paths]
                self.send_json({"ok": True, "text": text, "results": results})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if path == "/api/export-training":
            try:
                content_length = int(self.headers.get("Content-Length", "0") or 0)
                payload = json.loads(self.rfile.read(content_length).decode("utf-8") or "{}")
                metrics = payload.get("metrics") or {}
                if not metrics:
                    raise ValueError("Train a model before exporting.")
                filename = f"theme_training_{model_slug(str(metrics.get('modelName', 'model')))}_{dt.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                self.send_excel(build_training_workbook(metrics), filename)
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if path not in {"/api/inspect", "/api/train"}:
            self.send_error(404)
            return
        try:
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={"REQUEST_METHOD": "POST"})
            upload = form["file"] if "file" in form else None
            if upload is None or not getattr(upload, "filename", ""):
                raise ValueError("Please upload a CSV or Excel file.")
            filename = Path(upload.filename).name
            df = records_from_upload(filename, upload.file.read())
            df.columns = [str(column) for column in df.columns]
            df = df.where(pd.notna(df), "")
            columns = list(df.columns)
            if path == "/api/inspect":
                self.send_json({"ok": True, "rows": len(df), "columns": columns, "feedbackColumn": infer_feedback_column(columns)})
                return
            feedback_col = form.getfirst("feedbackColumn", "") or infer_feedback_column(columns)
            label_col = form.getfirst("labelColumn", "") or ""
            acpt_col = form.getfirst("acptColumn", "") or ""
            resolution_col = form.getfirst("resolutionColumn", "") or ""
            max_rows = int(form.getfirst("maxRows", "5000") or 5000)
            model_name = form.getfirst("modelName", "") or ""
            if feedback_col not in df.columns:
                raise ValueError("Select a valid feedback column.")
            if label_col not in df.columns:
                raise ValueError("Select a valid human label column.")
            if acpt_col and acpt_col not in df.columns:
                raise ValueError("Select a valid ACPT column.")
            if resolution_col and resolution_col not in df.columns:
                raise ValueError("Select a valid resolution status column.")
            self.send_json({"ok": True, "metrics": train_model(df, feedback_col, label_col, max_rows, model_name, acpt_col, resolution_col)})
        except Exception as exc:
            self.send_json({"ok": False, "error": str(exc)}, 400)


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Theme Model Training App running at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
