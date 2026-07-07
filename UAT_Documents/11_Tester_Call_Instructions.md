# CX Intelligence Suite - UAT Tester Instructions

This document explains exactly how testers should complete UAT for CX Intelligence Suite Version 24.6.

## 1. Purpose of This UAT

The objective of this UAT is to confirm whether the tool produces outputs that are usable for account leadership.

Testers should validate three things:

1. The tool works end to end for the account data across the 50 feature checks listed in the Excel tracker.
2. The generated outputs are clear, accurate, and useful.
3. The 100 leadership question responses are good enough for account-level review.

Each account has two UAT responsibilities:

- Complete 50 feature / workflow checks in the Test Execution sheet.
- Review the 100 leadership question responses in the Question Review sheet.

The 50 feature checks cover launch, upload, lookup, mapping, business rules, analysis, score outputs, sentiment outputs, people views, filters, exports, edge cases, performance, and sign-off.

The most important review area is still the 100 leadership questions:

- 50 score questions covering NPS or CSAT results, trends, agents, managers, targets, reliability, and movement.
- 50 sentiment questions covering customer sentiment, agent and manager sentiment, trends, and sentiment-to-score alignment.

## 2. Files Testers Will Use

Testers should use the UAT documents provided in the `UAT_Documents` folder.

Primary file to complete:

- `CX_Intelligence_Suite_UAT_Tracker_Tester_Version.xlsx`

Reference files:

- `CX_Intelligence_Suite_Tester_Call_Instructions.pdf`
- `06_Quick_Start_Tester_Guide.md`
- `05_Known_Issues_Limitations.md`
- `03_Sample_Data_Requirements.md`

## 3. Before Starting the Test

Confirm the following before launching the tool:

- You are using `Feedback Intelligence Suite (Version 24.6)`.
- You have the approved account survey file.
- You know whether the account file is NPS, CSAT, or sentiment-only.
- You know the official account target and scoring thresholds.
- You have a lookup file if manager, agent, site, region, tenure, channel, or other business fields are missing from the base file.
- The base file and lookup file are closed in Excel before upload.
- You have permission to use the data for UAT.

## 4. Launching the Tool

1. Open the Version 24.6 folder.
2. Double-click `NPS Analyzer.exe`.
3. Wait for the CX Intelligence Suite launcher to start.
4. Confirm the browser opens the local tool.
5. If the browser does not open, use `http://127.0.0.1:8765/`.

Expected result:

- The local workspace opens successfully.
- No installed Python or package setup is requested.
- The toolkit runs from the Version 24.6 folder.

If launch fails:

- Capture a screenshot.
- Check `logs\server.log`.
- Record the issue in the Defect Log sheet.

## 5. Uploading the Base File

1. Select the correct analyzer flow for the account.
2. Click Choose Base File.
3. Upload the approved account survey workbook.
4. Wait for the file profile to complete.
5. Review the row count, detected columns, blank fields, and warnings.

Check carefully:

- Does the row count look correct?
- Does the tool detect the expected columns?
- Are any warnings important?
- Is the file accepted without error?

Record any issue in the UAT tracker.

## 6. Using a Lookup File

Use a lookup file only when useful business attributes are not present in the base file.

Examples:

- Manager/TL
- Agent ID or employee ID
- Site
- Region
- LOB or stream
- Tenure
- Wave
- Channel

If using a lookup file:

1. Upload the lookup file.
2. Select the key column in the base file.
3. Select the matching key column in the lookup file.
4. Continue only if the key selection is clear.

If the lookup does not match correctly, record it as a defect or data issue.

## 7. Column Mapping Checks

Mapping is one of the most important UAT steps. Wrong mapping can make correct calculations look wrong.

Check these fields:

- Feedback/comment/verbatim column
- NPS, CSAT, score, or rating column
- Date or response date
- Agent name or agent ID
- Manager/TL or supervisor
- Site, region, LOB, channel, tenure, wave, or other business fields if available

Pass condition:

- Required score and feedback fields are mapped correctly.
- Date is mapped if trend or improved/declined questions need to be tested.
- Agent and manager fields are mapped if people analysis needs to be tested.

## 8. Business Rules Checks

For NPS testing, confirm:

- NPS target
- Score scale
- Promoter threshold
- Passive threshold
- Minimum sample for ranking

For CSAT testing, confirm:

- CSAT target
- Score scale
- Satisfied threshold
- Neutral threshold
- Minimum sample for ranking

Important:

- Use account-approved thresholds.
- Do not assume the default values are correct for every account.
- If a threshold is unclear, record it in the Feedback Log.

## 9. Running the Analysis

1. Click Start Analysis.
2. Keep the browser open.
3. Do not refresh the page while analysis is running.
4. Monitor progress, row count, elapsed time, and current stage.
5. Wait for analysis completion.

Pass condition:

- Analysis completes without crash.
- Results become available.
- The tool provides output tabs and export options.

If analysis fails:

- Capture the error message.
- Note the account, file name, and step.
- Check `logs\server.log`.
- Record a defect.

## 10. Outputs to Review

After analysis completes, review these areas:

1. Data Set Summary
   - Confirms row count, columns, data coverage, and readiness.

2. Results
   - Shows leadership questions and direct answers.

3. Score Briefing
   - Shows NPS/CSAT score questions, rankings, movement, reliability, and targets.

4. Sentiment Briefing
   - Shows sentiment distribution, trend, agent and manager sentiment, and sentiment-to-score alignment.

5. Insights Readout
   - Provides role-based interpretation for leadership review.

6. Go to Dashboard
   - Opens the interactive NPS or CSAT Intelligence Hub.

7. Board Room HTML
   - Opens a leadership-ready report.

8. Download Excel
   - Exports the detailed evidence workbook.

## 11. How to Review the 100 Leadership Questions

Use the `Question Review` sheet in `CX_Intelligence_Suite_UAT_Tracker_Tester_Version.xlsx`.

For each question, review the answer generated by the tool and rate it. There are 100 question response checks per account.

Do not validate internal formulas. Focus on the quality of the answer shown to the user.

Check:

- Does the answer directly answer the question?
- Is the wording clear?
- Would an account leader understand it?
- Does it match the account data and known business context?
- Is the recommended action reasonable?
- Does it avoid overclaiming?
- Does it explain low sample, not available, or 0 reliable results clearly?
- If the answer is surprising, is there enough visible evidence to explain it?

## 12. Rating the Question Responses

Use these ratings in the Question Review sheet:

| Rating | Use When |
|---|---|
| Good | The response is clear, accurate, and usable. |
| Minor wording issue | The response is mostly correct but wording can be improved. |
| Ambiguous | The tester cannot confidently understand what the answer means. |
| Statistically questionable | The response appears unsupported by sample size, date coverage, evidence, or reliability. |
| Incorrect | The response appears wrong compared with the account data. |
| Not applicable | The account data does not support that question. |

For any rating other than Good or Not applicable, add notes.

Useful notes include:

- What answer appeared in the tool.
- Why the answer is unclear or questionable.
- What the tester expected instead.
- Screenshot reference, if available.
- Defect ID, if a formal defect is logged.

## 13. Special Guidance for Common Outputs

### Not available

This may be valid when required data is missing.

Examples:

- No date column for trend analysis.
- No manager column for manager questions.
- No agent column for agent questions.
- Not enough survey responses.

Log as a defect only if the wording is confusing or if the data should have supported the answer.

### 0 reliable managers or agents

This can be valid when no manager or agent meets the minimum sample requirement.

For improved/declined questions, the entity usually needs enough responses in both comparison windows.

Log as feedback if the result needs clearer wording.

### Low sample warning

Low sample warnings are expected and should not automatically be treated as defects.

Log a concern only if:

- The warning is unclear.
- A ranking appears despite weak data.
- The answer seems too confident.

### Sentiment-to-score alignment

This is validation evidence only.

It should not be interpreted as proof that sentiment caused the NPS or CSAT result.

## 14. How to Complete the Excel Tracker

Use these sheets:

| Sheet | What to Fill |
|---|---|
| Participation Matrix | Tester, owner, dates, status, notes. |
| Test Execution | Pass/fail status for 50 feature / workflow checks per account. |
| Defect Log | Tool errors, broken workflows, wrong outputs. |
| Feedback Log | Wording, usability, output clarity, improvement ideas. |
| Sign-Off | Account-level decision and caveats. |
| Question Bank | Reference list of 100 questions only. |
| Question Review | Ratings and notes for question responses. |

## 15. Defect Severity Guide

| Severity | Meaning |
|---|---|
| Critical | Tool cannot launch, upload, analyze, or export for the account. |
| High | Major result or workflow issue with no practical workaround. |
| Medium | Issue affects clarity, usability, or confidence but has a workaround. |
| Low | Minor wording, cosmetic, or enhancement request. |

## 16. What Not to Do

- Do not edit app files.
- Do not move internal folders.
- Do not rename or delete `backend`, `frontend`, `apps`, `portable_python`, `models`, `security`, or `logs`.
- Do not use unapproved customer data.
- Do not refresh the browser during analysis.
- Do not mark statistically conservative outputs as defects unless the result is unclear or wrong.

## 17. Account Sign-Off

Each account should choose one sign-off decision:

- Signed Off: account testing is complete and no blocking concerns remain.
- Conditional Sign-Off: acceptable for UAT, but caveats or open issues remain.
- Rejected: outputs are not acceptable for account use.
- Blocked: testing could not be completed.

Add notes for any conditional sign-off, rejection, or blocked status.

## 18. Final Submission Checklist

Before submitting UAT feedback, confirm:

- Participation Matrix is updated.
- Test Execution sheet is updated for all 50 feature / workflow checks.
- Question Review sheet is completed for the 100 leadership question responses.
- Defects are logged with enough detail.
- Feedback is logged separately from defects.
- Sign-Off sheet is completed.
- Screenshots or log references are included where needed.

