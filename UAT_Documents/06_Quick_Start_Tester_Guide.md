# CX Intelligence Suite - Quick Start Tester Guide

Use this guide for UAT execution.

## 1. Start the Tool

1. Go to `C:\Users\manju\Documents\Feedback Intelligence Suite (Version 24.6)`.
2. Double-click `NPS Analyzer.exe`.
3. Confirm the launcher opens as CX Intelligence Suite.
4. Wait for the browser page to open at `http://127.0.0.1:8765/`.

## 2. Choose the Analyzer

Use the correct analyzer for the account file:

- Use NPS Analyzer for NPS survey data.
- Use CSAT Analyzer for CSAT survey data.
- Use Sentiment Analysis where only verbatim sentiment review is being validated.

## 3. Upload Base File

1. Choose the base survey workbook.
2. Wait for the app to read the workbook locally.
3. Review row count, columns, and warnings.
4. Continue when the file is ready.

## 4. Add Lookup File If Needed

Choose No when the base file is missing important business fields such as manager, team, site, region, tenure, channel, or employee details.

Then:

1. Upload the lookup file.
2. Select the matching key in base and lookup files.
3. Continue to mapping.

## 5. Confirm Mapping

Check that the dropdowns point to the correct columns:

- Feedback/comment/verbatim
- Score/NPS/CSAT
- Date
- Agent
- Manager/TL
- Optional business attributes

Feedback plus score is required for meaningful analysis.

## 6. Confirm Business Rules

For NPS:

- Confirm target.
- Confirm score scale.
- Confirm Promoter starts at 9.
- Confirm Passive starts at 7.
- Confirm minimum sample for ranking.

For CSAT:

- Confirm target.
- Confirm score scale.
- Confirm Satisfied and Neutral thresholds.
- Confirm minimum sample for ranking.

## 7. Run Analysis

1. Click Start analysis.
2. Keep the browser open.
3. Watch live progress.
4. Wait for the completion screen.

## 8. Review Results

Review these tabs:

- Data Set Summary
- Results
- Score Briefing
- Sentiment Briefing
- Insights Readout

Double-click a result row to inspect:

- Statistical method
- Logic from framework
- Statistics used
- Interpretation guardrail
- Evidence

## 9. Review Dashboard

Click Go to Dashboard.

Validate:

- Executive view
- Agent view
- Manager view
- Filters and drill-downs relevant to the account

## 10. Export Outputs

Use:

- Board Room HTML for leadership-ready review
- Download Excel for detailed evidence and audit tables

If Board Room HTML does not open, allow browser pop-ups for the local app.

## 11. Capture UAT Results

Update the tracker workbook with:

- Scenario pass/fail
- Defects
- Usability feedback
- Screenshots or log file references
- Final account sign-off

## 12. Where to Find Logs

Use logs only when a tester sees an error.

- Server log: `logs\server.log`
- Audit logs: `logs\audit`
- User logs: `logs\user_logs`

