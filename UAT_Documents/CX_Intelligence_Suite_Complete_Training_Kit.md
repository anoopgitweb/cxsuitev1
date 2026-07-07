# CX Intelligence Suite - Complete Training Kit

## 1. Training Kit Purpose
This training kit is designed to help users learn the CX Intelligence Suite from first launch through final report export. It is written for UAT testers, analysts, account leaders, operations managers, quality teams, and support users.
The goal is not only to show where to click. The goal is to explain what each module does, why it matters, what data it needs, what users should validate, and what mistakes to avoid.
The suite is a customer experience intelligence workspace. It converts NPS, CSAT, and customer verbatim data into score intelligence, sentiment intelligence, theme intelligence, manager and agent views, leadership question responses, and exportable leadership reports.

## 2. Learning Paths and Outcomes
Different users need different depth. A tester should complete the full training kit. A leader may focus on dashboards, leadership questions, exports, and interpretation. A support user should focus on launch, data setup, troubleshooting, logs, and package structure.
The recommended training format is: first read the overview, then watch or demonstrate launch and upload, then complete one guided NPS or CSAT run, then review the Intelligence Hub tabs, then complete practice exercises and UAT tracker entries.

## 3. Package, Launch, and Folder Rules
For UAT, the tool is shared as a local application package. Users should copy or extract the full Version 24.6 folder and launch the application using NPS Analyzer.exe.
The application starts a local server and opens the browser at 127.0.0.1:8765. Even though the executable name still says NPS Analyzer, the launcher and workspace are branded as CX Intelligence Suite.
Keep the folder structure unchanged. The EXE expects supporting folders to remain beside it. The portable_python folder is especially important because the launcher checks for portable_python\python.exe.
Use Stop Toolkit only after testing is complete. Do not close the launcher while analysis is running.

## 4. Data Readiness and File Preparation
The Base File is the main survey file. It should contain one row per customer response. A strong Base File includes feedback/comment text, score/rating, date, agent, manager/TL, and useful business fields.
The Lookup File is optional. Use it when the survey file does not contain manager, site, LOB, tenure, wave, channel, region, or other business attributes needed for analysis.
Before upload, close the workbook in Excel, confirm it is approved for UAT, confirm it has usable headers, and check that score and date fields are not corrupted.
A good rule: if the account expects a dashboard, trend, people view, or segment view, the data field needed for that output must either exist in the Base File or be added through Lookup.

## 5. Home Workspace
The Home Workspace is the starting point. It presents three intelligence workspaces: NPS Analyzer, CSAT Analyzer, and Sentiment Analyzer.
Use NPS Analyzer for Net Promoter Score surveys. Use CSAT Analyzer for customer satisfaction surveys. Use Sentiment Analyzer when the requirement is standalone verbatim sentiment and language analysis.
Users should return to the Home Workspace when switching between modules. It is the simplest way to avoid opening old tabs or stale browser states.

## 6. NPS Analyzer Complete Walkthrough
The NPS Analyzer is a guided workflow for NPS survey data. The left-side steps move users from upload to analysis and results.
Step 1 - Base File: upload the survey workbook. Confirm row count and columns look correct. If the wrong file is uploaded, stop and restart with the correct file.
Step 2 - File Ready: confirm the upload has completed and the file can be read.
Step 3 - Coverage / Lookup Decision: choose whether the Base File has all fields or whether a Lookup File is needed. Use lookup only when enrichment is necessary.
Step 4 - Mapping: map Verbatim Feedback, NPS score, NPS Category if present, Agent Name, Manager/TL, Feedback Date, Wave, Tenure, Base Join Key, and Lookup Join Key.
Step 5 - NPS Score Classification: if NPS Category is not mapped, choose score scale and thresholds. On a standard 0-10 NPS scale, Promoter usually starts at 9, Passive starts at 7, and Detractor is below Passive.
Step 6 - Sentiment Engine: choose Local Rules or Sparrow Model only as approved for the UAT environment.
Step 7 - Theme Engine: choose Local Rules or Owl Model only as approved.
Step 8 - Custom Dimensions: add optional report cuts such as site, queue, LOB, channel, product, language, wave, tenure, or region.
Step 9 - Analyze Feedback: run analysis, wait for completion, review guided insights, then open dashboards or exports.

## 7. CSAT Analyzer Complete Walkthrough
The CSAT Analyzer uses the same guided structure as NPS but applies satisfaction logic. Use it for customer satisfaction surveys rather than recommendation surveys.
Step 1 - Base File: upload the CSAT survey workbook. Confirm it has the correct score/rating and feedback fields.
Step 2 - Lookup Decision: decide whether enrichment is needed for manager, agent, site, wave, tenure, or other business fields.
Step 3 - Mapping: map Verbatim Feedback, CSAT score, Satisfaction Level / CSAT Category, Agent Name, Manager/TL, Feedback Date, Wave, Tenure, and join keys where relevant.
Step 4 - Score-to-CSAT Bands: if Satisfaction Level is not mapped, configure Satisfied and Neutral thresholds. Dissatisfied is any valid score below the Neutral threshold.
Step 5 - Sentiment and Theme Engines: choose Local Rules, Sparrow, or Owl options only as approved.
Step 6 - Custom Dimensions and Analysis: add useful business cuts, run analysis, review insights, and open the CSAT Intelligence Hub.

## 8. Sentiment Analyzer Complete Walkthrough
The Sentiment Analyzer is for standalone verbatim analysis. It is useful when the user wants to analyze customer comments without running a full score analyzer.
Upload tab: load the file containing customer comments. Supported file types include common spreadsheet and text formats.
Setup tab: map Verbatim / Feedback Field. Optionally map Agent, Manager/TL, and Date to unlock owner and trend analysis.
Analysis Mode: choose the approved sentiment engine. Local Sparrow is used when local model support is available and approved. API-based modes require approved keys and governance.
Dashboard tab: review Sentiment Mix, Confidence Distribution, Sentiment by Owner, Sentiment Trend, and Verbatim Sentiment Results.
Word Cloud tab: review Interactive Word Cloud, Top Terms, Negative Language Signals, Language by Sentiment, and Term Evidence Table.
Data tab: inspect row-level sentiment results, clear filters, and export PDF or CSV outputs.

## 9. Intelligence Hub Access and Navigation
The NPS and CSAT Intelligence Hubs are post-analysis workspaces. They may require secure sign-in before dashboard content appears.
After sign-in, the left navigation groups features into Data Setup, Dashboard Suite, Performance Lens, Sentiment Engine, Theme Intelligence, Dimension Studio, Experience Signals, Compare, WIP modules, and Exports.
If a tester cannot sign in, record the issue in the UAT tracker with a screenshot. Do not share credentials.

## 10. Data Setup and Column Explorer
Setup is the audit view of how the analysis was configured. Use it to verify uploaded file, lookup choice, mapped fields, business rules, sentiment/theme method, and custom dimensions.
Column Explorer is the data dictionary. It shows base sheet columns, lookup sheet columns, mapped fields, output fields, and analysis-ready columns.
Column Explorer filters help users narrow by source, type, and role. Use this when a dashboard is blank or a question response says not available.
If a field is not present in Column Explorer or was not mapped, downstream dashboards cannot use it.

## 11. Dashboard Suite
Executive Dashboard is the headline view. It shows score trend, score gauge, sentiment mix, score composition, response volume trend, sentiment trend, top drivers, executive insights, and analysis snapshot.
Agent Dashboard is for agent-level reads. It should be used only when the agent field is mapped and sample size is meaningful.
Manager Dashboard is for manager/TL-level reads. It can show selected manager performance and agents under the selected manager.
Custom Dashboards allow users to build custom tables by source rows, group-by field, optional column cut, measure, value field, sorting, and row count.
Executive Lens includes QA Lens, Team Manager Lens, Account Manager Lens, and VP Lens. Choose the lens based on meeting audience.

## 12. Performance Lens
Master Lens combines performance, sentiment, themes, agents, managers, quartiles, correlations, and action priorities into a broad leadership readout.
Moving Averages smooth daily, weekly, and monthly score movement. Use it to reduce noise and understand direction, volatility, confidence, volume, strongest period, and weakest period.
Quartile Intelligence shows Q1-Q4 distribution, average score by quartile, game changers, spread, and movement.
Statistics gives standard statistical reads such as weekly trend, driver summary, correlation, and distribution.
Custom Statistics allows single-column, dual-column, and multi-column analysis. Use it when trained analysts need deeper ad hoc statistical exploration.

## 13. Sentiment Engine
Sentiment Intelligence summarizes customer tone after NPS or CSAT analysis. It includes sentiment snapshot, Sparrow sentiment mix, categorized sentiment table, sentiment engine status, and export options.
Sentiment Comparison shows week-over-week positive and negative sentiment movement. It uses completed analysis output and does not rerun classification.
Custom Theme Sentiment lets users choose themes and view sentiment movement by theme. Build Theme Classification first when theme-specific sentiment is needed.
Use sentiment as context and evidence. Do not claim sentiment caused score movement unless supported by score, theme, and business evidence.

## 14. Theme Intelligence
Theme Intelligence explains what customers are talking about. It may use Local Rules or Owl model outputs depending on configuration.
Theme Classification shows row-level Owl output such as primary, secondary, and tertiary drivers; people/process/tech sentiment; issue type; impact; and resolution status.
Build Theme Classification includes Discover Themes, Build Classification, and Export CSV. Use the one-verbatim test before building full classification.
Theme Comparison compares current and previous windows to show fastest rising and most reduced themes.

## 15. Dimension Studio
Dimension Studio supports segment-level analysis. Standard tabs include Wave Intelligence and Tenure Intelligence. Custom Dimensions are created from optional fields selected during setup.
Wave Intelligence is useful for training wave, onboarding batch, or cohort comparisons.
Tenure Intelligence helps identify whether new or experienced employees show different CX patterns.
Custom Dimensions can be used for site, LOB, channel, region, language, product, queue, or other account-specific fields.

## 16. Experience Signals
Experience Signals focus on customer language patterns and advocacy signals.
Word Cloud Intelligence shows repeated terms, two-word phrases, term impact trend, severity ranking, agent concentration, manager concentration, recovery opportunity, and phrase-pair root cause views.
Promoter DNA is used for NPS and highlights language associated with promoters. Satisfied DNA is used for CSAT and highlights language associated with satisfied customers.
Alert Badges show risk flags and watch items.

## 17. Compare and Movement Analysis
Compare lets users select two date ranges and analyze movement across score, response mix, sentiment shift, manager movement, agent movement, and volatility.
Use equal windows wherever possible. A current period with 2,000 responses should not be casually compared with a previous period of 50 responses.
Compare is best for before/after reviews, month-over-month reviews, campaign checks, and sustained improvement/decline validation.

## 18. Exports, Reports, and Board Room Outputs
Export features help users package analysis for leadership discussions and downstream review.
Download Excel Output provides detailed tables and evidence. Executive PDF Summary provides a concise leadership read. FAQ PDF supports common question handling. Export GenAI JSON is for structured downstream use.
Selected PDF, selected PPT, and selected data sheets allow users to choose specific dashboard tabs.
Board Room PDF is the formal leadership-ready report. Users can set header title, account name, prepared for, footer note, images, and selected report content. Create Interactive HTML when a shareable interactive report is needed.

## 19. Leadership Question Responses
The leadership question capability is the core of the tool. It turns analysis into direct answers to business questions.
For UAT, each account validates 100 leadership question responses: 50 score questions and 50 sentiment questions.
Review each answer for directness, clarity, business usefulness, statistical sense, evidence support, and actionability.
Not available can be correct when the required field is missing. 0 reliable managers or agents can be correct when sample size thresholds are not met.
Do not ask testers to validate hidden internal formulas. They should validate the quality of what a leader sees.

## 20. Review and Override
Review and Override lets authorized users inspect and adjust classifications such as sentiment, bucket category, primary reason, Owl drivers, people/process/tech sentiment, issue type, customer impact, resolution status, and override notes.
Overrides should be used sparingly and documented. They are for clear misclassification or approved account-specific context.
Do not override outputs simply to force a preferred narrative.

## 21. Sparrow Training Workspace
Sparrow Training is a governed sentiment model fine-tuning workspace. It is for approved model owners, not ordinary business users.
Users sign in, upload labelled sentiment training data, map feedback and sentiment columns, validate mapping, configure training, check system readiness, start training, review evaluation, inspect failed samples, and manage model output.
Important training settings include base model, epochs, batch size, learning rate, validation split, max length, random seed, and early stopping.
After training, review metrics, loss curves, confusion heatmap, failed samples, quality verdict, metadata, and publishing checklist before using a model path in analysis.

## 22. Owl Training Workspace
Owl Training is a governed theme intelligence training workspace. It supports theme, driver, sentiment override, resolution, impact, and risk classification.
Users sign in, upload labelled theme training data, map target columns, validate taxonomy, review dataset quality, configure model training, start training, evaluate by output head, and test classification.
Owl is useful when accounts need structured business themes and drivers beyond simple sentiment.

## 23. UAT Training Exercises
These exercises help testers learn the tool and complete UAT consistently.
Exercise 1: Launch the tool, open Home Workspace, and confirm NPS, CSAT, and Sentiment Analyzer options are visible.
Exercise 2: Upload an NPS or CSAT Base File, decide whether lookup is needed, and complete column mapping.
Exercise 3: Configure business rules using account-approved targets and thresholds.
Exercise 4: Run analysis and confirm results, dashboards, and exports are available.
Exercise 5: Review the Executive Dashboard and identify three leadership points.
Exercise 6: Review agent and manager views and note any sample-size caveats.
Exercise 7: Review sentiment and theme outputs and identify top risks or opportunities.
Exercise 8: Complete 10 sample leadership question reviews before completing the full 100-question review.
Exercise 9: Export an Excel output and one leadership report. Open both files and verify content.
Exercise 10: Log at least one feedback item even if no defect is found, so improvement ideas are captured.

## 24. Quality Checks and Sign-Off Readiness
Before sign-off, confirm the tool launches, upload works, lookup works where needed, mapping is clear, business rules are correct, analysis completes, dashboards populate, leadership question responses are usable, and exports open correctly.
A sign-off decision should consider both technical readiness and business usefulness. A tool can technically run but still need wording or interpretation improvements.
Use Conditional Sign-Off when the tool is usable but has caveats. Use Blocked when testing could not be completed. Use Rejected only when outputs are not acceptable for account use.

## 25. Troubleshooting Playbook
Launch issue: confirm folder structure, portable_python, security restrictions, and logs/server.log.
Browser issue: confirm local server is running and use 127.0.0.1:8765.
Upload issue: confirm file type, workbook closure, usable headers, and no corrupted/protected content.
Mapping issue: confirm the selected column truly represents the requested field.
Analysis issue: capture screenshot, account, file name, step, timestamp, and log reference.
Blank output: check mapping, sample size, date coverage, and whether analysis completed.
Export issue: confirm selected report sections and rerun export after analysis completes.

## 26. FAQ
Q: Can I use the tool without installed Python? A: Yes, the package uses bundled portable Python when the folder structure is intact.
Q: Why does a result say not available? A: Usually because the required field is missing, not mapped, or has insufficient data.
Q: Is 0 reliable managers a defect? A: Not necessarily. It can be statistically correct if no manager meets minimum sample or equal-window requirements.
Q: Should testers see internal statistical logic? A: No. For UAT, testers validate answer quality, clarity, usefulness, and evidence.
Q: Can I compare any two periods? A: You can, but equal and meaningful windows are preferred.
Q: Should I share exported reports without checking them? A: No. Always open exports first.
Q: Who should use Sparrow or Owl training? A: Only approved model owners or authorized users.

## 27. Glossary
NPS: Net Promoter Score based on promoter and detractor share. CSAT: Customer Satisfaction score based on satisfied, neutral, and dissatisfied logic. Verbatim: customer comment text.
Base File: primary survey workbook. Lookup File: optional enrichment file. Mapping: linking file columns to tool roles. Custom Dimension: optional business field used for dashboard cuts.
Sparrow: custom-trained sentiment intelligence model/layer. Owl: theme and driver intelligence model/layer. Evidence Table: supporting detail behind an answer. Board Room PDF: leadership-ready report export.

## 28. Quick Reference Tables
Use these quick references when training users or supporting UAT calls.

## 29. Final Trainer Checklist
Use this closing checklist at the end of a training session or UAT enablement call. The intent is to confirm that users are not just aware of the screens, but can actually operate the tool and explain the outputs.
A user is training-ready when they can launch the suite, choose the correct analyzer, upload and map files, configure rules, run analysis, interpret dashboards, review leadership question responses, export outputs, and log UAT feedback correctly.
