from __future__ import annotations

import argparse
import json
from pathlib import Path
import pickle
import sys
import time


ROOT = Path(__file__).resolve().parents[1]
APPS = ROOT / "apps"
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(APPS / "nps-analyzer" / "backend"))

from analysis_engine import add_owl_classification_outputs, build_analysis_with_local_model  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", choices=["sparrow", "theme", "owl"], required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--feedback-col", default="Verbatim Feedback")
    parser.add_argument("--score-col", default="")
    parser.add_argument("--agent-col", default="")
    parser.add_argument("--date-col", default="")
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--progress", default="")
    args = parser.parse_args()

    last_progress_write = 0.0

    def report_progress(done: int, total: int, message: str | None = None) -> None:
        nonlocal last_progress_write
        if not args.progress:
            return
        now = time.time()
        if done < total and now - last_progress_write < 0.5:
            return
        last_progress_write = now
        payload = {
            "done": int(done),
            "total": int(total or 0),
            "message": message or "",
            "updated_at": now,
        }
        progress_path = Path(args.progress)
        temp_path = progress_path.with_suffix(progress_path.suffix + ".tmp")
        temp_path.write_text(json.dumps(payload), encoding="utf-8")
        temp_path.replace(progress_path)

    with open(args.input, "rb") as handle:
        df = pickle.load(handle)

    if args.task == "sparrow":
        result = build_analysis_with_local_model(
            df,
            args.feedback_col,
            args.score_col or None,
            args.agent_col or None,
            args.date_col or None,
            model_path=args.model_path,
            progress_callback=report_progress,
        )
    else:
        result = add_owl_classification_outputs(
            df,
            feedback_col=args.feedback_col,
            model_path=args.model_path,
            progress_callback=report_progress,
        )

    with open(args.output, "wb") as handle:
        pickle.dump(result, handle, protocol=pickle.HIGHEST_PROTOCOL)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
