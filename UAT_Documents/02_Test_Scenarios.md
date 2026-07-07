# CX Intelligence Suite - UAT Test Scenarios

Use these scenarios for each UAT account. Mark each scenario as Pass, Fail, Blocked, or Not Applicable in the tracker workbook.

## Scenario 1 - Launch Local Workspace

Objective: Confirm the Version 24.6 tool starts locally.

Steps:

1. Open `NPS Analyzer.exe` from the Version 24.6 folder.
2. Confirm the launcher window opens as CX Intelligence Suite.
3. Confirm the local home page opens in the browser.
4. Confirm the app is reachable at `http://127.0.0.1:8765/`.
5. Stop and restart the toolkit once.

Expected result:

- Local server starts.
- Home page opens.
- No installed Python prompt appears.
- Tester can restart the toolkit.

Evidence to capture:

- Screenshot of launcher or home page.
- Any error from `logs\server.log`.

## Scenario 2 - Upload Base File

Objective: Confirm the account survey workbook is accepted.

Steps:

1. Open the NPS or CSAT analyzer flow.
2. Choose the account base survey workbook.
3. Wait for file profiling.
4. Review row count, sheet count, detected columns, blanks, and warnings.

Expected result:

- Workbook loads without failure.
- Data Set Summary inputs look plausible.
- The app shows the next step after upload.

Evidence to capture:

- Row count shown by tool.
- Any warnings.

## Scenario 3 - Optional Lookup File

Objective: Confirm enrichment works when account attributes are in another file.

Steps:

1. When asked whether the base file already contains all required fields, choose No if lookup is needed.
2. Upload lookup file.
3. Select the matching key column in both files.
4. Continue to mapping.

Expected result:

- Lookup file is accepted.
- Key mapping is clear.
- Enriched fields are available for mapping.

Use Not Applicable if the base file already contains all required fields.

## Scenario 4 - Column Mapping

Objective: Confirm required and optional fields map correctly.

Steps:

1. Verify the mapped feedback/comment column.
2. Verify the score/NPS/CSAT column.
3. Verify date, agent, and manager columns if available.
4. Verify optional business attributes such as channel, LOB, site, wave, tenure, and region.
5. Correct any wrong dropdown suggestions.
6. Confirm mapping.

Expected result:

- Feedback plus score is mapped.
- Date enables trend analysis.
- Agent and manager enable people analysis.
- Optional attributes are preserved for richer analysis.

## Scenario 5 - Business Rules

Objective: Confirm account rules can be set correctly.

Steps for NPS:

1. Enter official NPS target.
2. Confirm score scale.
3. Confirm Promoter starts at 9.
4. Confirm Passive starts at 7.
5. Confirm minimum sample for ranking, default 10 unless UAT lead advises otherwise.

Steps for CSAT:

1. Enter official CSAT target.
2. Confirm score scale.
3. Confirm Satisfied and Neutral thresholds.
4. Confirm minimum sample for ranking.

Expected result:

- Business rules are understandable and match account reality.

## Scenario 6 - Optional Intelligence Engines

Objective: Confirm optional model settings are clear.

Steps:

1. If approved for the account, enable Sparrow sentiment.
2. Verify the Sparrow model path.
3. If approved for the account, enable Owl themes.
4. Start analysis.

Expected result:

- Analysis starts with selected engines.
- If engines are not selected, local rules still allow analysis to complete.

## Scenario 7 - Run Analysis

Objective: Confirm processing completes.

Steps:

1. Start analysis.
2. Keep browser page open.
3. Observe live stage, rows processed, elapsed time, and progress.
4. Wait until analysis completes.

Expected result:

- Analysis completes without crash.
- Completion screen shows Results, Score Briefing, Sentiment Briefing, Insights Readout, Board Room HTML, Download Excel, and dashboard handoff.

## Scenario 8 - Validate Results Tab

Objective: Confirm the direct Q&A output is useful.

Steps:

1. Open Results.
2. Review several score leadership questions.
3. Double-click a row to inspect method, logic, statistics, guardrail, and evidence.
4. Confirm answers are clear and not misleading.

Expected result:

- Answers are understandable.
- Evidence status and recommended action make sense.
- Guardrails prevent over-claiming.

## Scenario 9 - Validate Score Briefing

Objective: Confirm statistical evidence is business usable.

Steps:

1. Open Score Briefing.
2. Review trend, overall score, manager, agent, target, distribution, volatility, and reliability questions.
3. Validate rankings against known account expectations where possible.
4. Note any ambiguous text.

Expected result:

- Rankings and changes are supported by sample thresholds and evidence.
- Low-volume entities are not over-ranked.

## Scenario 10 - Validate Sentiment Briefing

Objective: Confirm sentiment output is useful and properly worded.

Steps:

1. Open Sentiment Briefing.
2. Review positive, neutral, negative, net sentiment, confidence, agent, manager, period, and score-alignment questions.
3. Confirm NPS wording uses Promoter, Passive, Detractor.
4. Confirm CSAT wording uses Satisfied, Neutral, Dissatisfied.

Expected result:

- Sentiment is presented as evidence from verbatim text.
- Score alignment is described as validation signal, not causal proof.

## Scenario 11 - Validate Insights Readout

Objective: Confirm role-based summaries are useful.

Steps:

1. Open Insights Readout.
2. Review executive, operations, agent, manager, and priority sections where available.
3. Confirm the readout can be used for leadership review.

Expected result:

- Insights are concise, explainable, and action-oriented.

## Scenario 12 - Dashboard Handoff

Objective: Confirm dashboard navigation works.

Steps:

1. Click Go to Dashboard.
2. Review executive view.
3. Review agent and manager views where data exists.
4. Test filters or dashboard interactions relevant to the account.

Expected result:

- Dashboard opens in the correct intelligence hub.
- Data matches completed analysis.

## Scenario 13 - Board Room HTML

Objective: Confirm leadership-ready report opens.

Steps:

1. Click Board Room HTML.
2. Confirm report opens in a new tab/window.
3. Review report index, detailed question sections, methods, guardrails, and evidence.
4. Try Download PDF or browser print if needed.

Expected result:

- Report opens and is readable.
- Pop-up blockers are handled if needed.

## Scenario 14 - Download Excel

Objective: Confirm evidence workbook exports.

Steps:

1. Click Download Excel.
2. Open the workbook.
3. Confirm it includes setup, results, score calculations, sentiment calculations, evidence, analyzed data, and relevant summary sheets.

Expected result:

- Export downloads successfully.
- Workbook is usable for audit and review.

## Scenario 15 - Logs and Audit

Objective: Confirm local traceability exists.

Steps:

1. After analysis, open `logs\server.log`.
2. Check `logs\audit`.
3. If logged in as admin, review in-app Admin Logs panel.

Expected result:

- Launch, upload, analysis, and export events are logged locally.

## Scenario 16 - Restart and Reopen Completed Analysis

Objective: Confirm recovery behavior is acceptable.

Steps:

1. Complete one analysis.
2. Close the browser.
3. Stop toolkit.
4. Relaunch the tool.
5. Confirm whether completed analysis can be restored or whether a new analysis starts cleanly.

Expected result:

- Tool behavior is understandable.
- No broken or stale state confuses the tester.

## Scenario 17 - Validate 100 Leadership Question Responses

Objective: Confirm the app answers the 50 score questions and 50 sentiment questions well enough for account leadership use.

Steps:

1. After analysis completes, open Results, Score Briefing, and Sentiment Briefing.
2. Review each generated leadership question answer.
3. For each question, judge whether the response is clear, accurate, complete, statistically sensible, and actionable.
4. Double-click rows where the answer is unclear or surprising and inspect the supporting evidence shown by the app.
5. Record the result in the Question Review sheet of the tracker workbook.

Expected result:

- Each answer should directly answer the question.
- The wording should be easy for account leaders to understand.
- The answer should not overclaim where data is insufficient.
- Statistical guardrails should explain low sample, not available, directional, monitor, or review-required outputs.
- Sentiment-to-score alignment should be treated as validation evidence, not causal proof.

Recommended scoring:

- Good: response is ready for UAT sign-off.
- Minor wording issue: meaning is correct but text can be clearer.
- Ambiguous: tester cannot confidently interpret the response.
- Statistically questionable: answer appears unsupported by sample, trend, p-value, confidence interval, or guardrail.
- Incorrect: answer conflicts with the data or expected calculation.
- Not applicable: account data does not support that question.

Evidence to capture:

- Question number.
- Generated answer text or screenshot.
- Why the answer is unclear or wrong.
- Expected wording or expected result, if known.
