# CX Intelligence Suite - Known Issues and UAT Limitations

This document prevents repeated issue logging for behavior that is expected or already known during UAT.

## 1. Local-Only Runtime

The tool runs locally from the Version 24.6 folder and starts a local server at `http://127.0.0.1:8765/`.

Expected behavior:

- No internet upload is required for analysis.
- Data, outputs, and logs stay under the local folder.
- The folder structure must remain intact.

## 2. Do Not Move Internal Folders

Do not move or delete:

- `portable_python`
- `backend`
- `frontend`
- `apps`
- `models`
- `security`
- `logs`

The launcher depends on these folders.

## 3. Admin Password Must Be Changed Before Formal UAT

The audit readme states first launch creates `admin / admin123`.

Expected UAT action:

- Change the default admin password before sharing with testers.
- Record who has admin access.

## 4. Leadership Answers Are Evidence-Based, Not Causal Claims

Leadership questions include method, logic, statistics, and guardrail text.

Expected behavior:

- The app may say Monitor, Review required, No action required, or No evidence.
- Statistical outputs should be interpreted as signals, not proof of root cause.
- Sentiment-to-score alignment is a validation signal, not causal proof.

## 5. Low-Volume Entities May Show as Not Available

Manager or agent comparisons may return not available when sample thresholds are not met.

Examples:

- Manager rankings require minimum sample.
- Improved/declined comparisons require enough responses in both comparison windows.
- Trend questions require dated records.

This is statistically conservative, not necessarily a tool failure.

## 6. Equal-Window Comparisons Need Date Quality

Improved/declined questions depend on valid dates and comparable prior/current windows.

Known limitation:

- If dates are missing, invalid, or highly uneven, movement questions may be directional or unavailable.

## 7. Optional Models Are Optional

Sparrow sentiment and Owl theme classification are optional local engines.

Expected behavior:

- If not enabled, the app can use local rules where available.
- If model folders are missing or paths are wrong, model-based output may not run.

## 8. Pop-Up Blocking Can Affect Board Room HTML

Board Room HTML opens in a new browser tab/window.

Expected workaround:

- Allow pop-ups for the local app if the report is blocked.

## 9. Large Files May Take Longer

Larger account workbooks can take longer during upload, profiling, sentiment, theme generation, and export.

Expected tester action:

- Keep the browser open.
- Do not refresh during analysis.
- Capture elapsed time in the tracker.

## 10. Browser State Can Affect Testing

If the browser restores prior tabs or cached state, testers may see a completed analysis restore or a previous page.

Expected action:

- Use Start a new analysis when needed.
- Restart the toolkit if the state looks stale.

