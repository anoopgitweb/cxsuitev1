# CX Intelligence Suite - Detailed Training Guide

Version 24.6

## Clickable Index
- 1. Product Overview
- 2. Suite Map: What Is Included
- 3. Who Should Use This Guide
- 4. Launching the Tool
- 5. Home Workspace
- 6. Data Inputs and File Preparation
- 7. NPS Analyzer: End-to-End Flow
- 8. CSAT Analyzer: End-to-End Flow
- 9. Sentiment Analyzer
- 10. Column Mapping
- 11. Lookup File and Enrichment
- 12. Business Rules and Thresholds
- 13. AI Engines: Sparrow and Owl
- 14. Custom Dimensions
- 15. Running Analysis
- 16. Analysis Completion and Guided Insights
- 17. Leadership Questions
- 18. Evidence and Result Details
- 19. Intelligence Hub Navigation
- 20. Executive Dashboard
- 21. Custom Dashboards and Summary Builder
- 22. Executive Lens and Role-Based Summaries
- 23. Agent and Manager Dashboards
- 24. Master Lens
- 25. Moving Averages
- 26. Quartile Intelligence
- 27. Statistics and Custom Statistics
- 28. Sentiment Intelligence in the Hub
- 29. Theme Intelligence and Owl Classification
- 30. Wave, Tenure, and Custom Dimension Intelligence
- 31. Word Cloud Intelligence
- 32. Promoter DNA / Satisfied DNA
- 33. Compare and Date Range Analysis
- 34. Export and Reporting Features
- 35. Review and Override
- 36. Sparrow Training Workspace
- 37. Owl Training Workspace
- 38. Security, Data Handling, and Audit Logging
- 39. UAT Testing Expectations
- 40. Troubleshooting
- 41. Best Practices
- 42. Glossary

## 1. Product Overview
CX Intelligence Suite is a local customer experience analytics workspace for NPS, CSAT, and sentiment analysis. It helps teams upload account survey data, map fields, apply business rules, run analysis, review leadership-ready insights, and export reports for action planning.
The suite combines score intelligence, sentiment intelligence, theme and driver analysis, manager and agent views, custom dimensions, evidence tables, and board-room style exports. During UAT, the package is shared as a ZIP file; once cloud implementation is complete, users are expected to access the tool through a secure hosted link.

## 2. Suite Map: What Is Included
The home workspace gives access to three main analysis workspaces: NPS Analyzer, CSAT Analyzer, and Sentiment Analyzer. It also provides training workspaces for Sparrow sentiment model training and Owl theme model training where approved users can manage model quality.
After analysis, NPS and CSAT open into their respective Intelligence Hubs. These hubs include executive dashboards, agent and manager dashboards, master lens, moving averages, quartile intelligence, statistics, sentiment intelligence, theme intelligence, wave and tenure intelligence, word cloud intelligence, promoter or satisfied DNA, comparison analysis, and export/reporting tools.

## 3. Who Should Use This Guide
This guide is intended for UAT testers, account leaders, analysts, operations managers, quality teams, and tool support users. Testers should use it with the instruction PDF and UAT tracker. Analysts and leaders can use it as a training reference after rollout.
The guide explains what each feature does, when to use it, what inputs are required, and what users should check before trusting an output.

## 4. Launching the Tool
For UAT, extract the application ZIP to a local folder and run the launcher executable. The launcher starts the local toolkit and opens the browser workspace. Users should confirm that the launcher title and home page refer to CX Intelligence Suite.
If the browser does not open automatically, use the local address shown in the tester instructions. Keep the launcher running while using the tool, and use Stop Toolkit only after testing is complete.

## 5. Home Workspace
The home workspace is the secure starting point for the suite. It presents the available analyzers and setup options. Users can open NPS Analyzer, CSAT Analyzer, Sentiment Analyzer, Train Sparrow, and related workspaces from here.
The home page also reinforces that the UAT build is a local analytics workspace with audit logging. Users should start from the home page when moving between analysis modules.

## 6. Data Inputs and File Preparation
The main input is the Base File. This should contain one row per survey response and should include a feedback/comment field, score or rating field, response date where available, and people or business fields such as agent, manager, site, LOB, wave, tenure, or channel.
A Lookup File is optional. Use it when the base survey file does not contain required business fields. The lookup file must share a common key with the base file, such as employee ID, agent ID, case ID, or interaction ID.
Before upload, close the files in Excel, confirm the data is approved for UAT, remove unnecessary protected sheets, and validate that dates and scores are usable.

## 7. NPS Analyzer: End-to-End Flow
The NPS Analyzer is used when the account survey uses Net Promoter Score. It guides the user through base file upload, optional lookup upload, column mapping, NPS classification rules, optional sentiment and theme engines, custom dimensions, and analysis execution.
The NPS score logic classifies responses as Promoter, Passive, or Detractor. If an NPS category is already present, users can map it. If not, users select the score scale and thresholds so the tool can classify responses from the score column.

## 8. CSAT Analyzer: End-to-End Flow
The CSAT Analyzer mirrors the NPS flow but uses satisfaction logic. It supports base file upload, lookup enrichment, column mapping, score-to-CSAT bands, optional Sparrow sentiment, optional Owl themes, custom dimensions, and analysis execution.
CSAT responses are grouped as Satisfied, Neutral, or Dissatisfied based on mapped category or configured score thresholds. Users should confirm account-approved thresholds before running analysis.

## 9. Sentiment Analyzer
The standalone Sentiment Analyzer converts verbatim feedback into sentiment intelligence. Users upload feedback data, map the verbatim field, optionally map agent, manager, and date, then choose the sentiment engine and run analysis.
Outputs include sentiment mix, confidence distribution, sentiment by owner, sentiment trend, row-level sentiment results, holistic verbatim intelligence, interactive word cloud, top terms, negative language signals, language by sentiment, and a term evidence table. Users can export PDF and CSV outputs.

## 10. Column Mapping
Column mapping tells the tool which fields to use for analysis. The most important fields are feedback/verbatim, score/rating, score category if available, agent, manager/TL, feedback date, wave, tenure, base join key, and lookup join key.
Users should map only fields that truly match the requested role. Incorrect mapping is one of the most common causes of misleading outputs. If a required field is missing, the related output may show not available or may be excluded from analysis.

## 11. Lookup File and Enrichment
Lookup enrichment adds workforce or business context to the base survey data. It is useful when manager, tenure, wave, site, region, or LOB is stored outside the survey file.
The user must choose a Base Join Key and Lookup Join Key that refer to the same business identifier. After enrichment, mapped lookup columns can feed dashboards, custom dimensions, manager views, and agent views.

## 12. Business Rules and Thresholds
Business rules define how scores become classifications and how outputs should be interpreted. For NPS, confirm score scale, promoter threshold, passive threshold, detractor logic, target, and minimum sample. For CSAT, confirm score scale, satisfied threshold, neutral threshold, dissatisfied logic, target, and minimum sample.
Targets should come from account-approved definitions. Do not assume default values are correct. Minimum sample thresholds protect users from overreading low-volume managers, agents, or periods.

## 13. AI Engines: Sparrow and Owl
Sparrow is the sentiment intelligence layer. It can support feedback interpretation, sentiment classification, theme support, and insight generation from customer comments. In the app, users may see Local Rules or Sparrow Model options depending on setup and model availability.
Owl is the theme intelligence layer. It supports structured theme, driver, issue, impact, and resolution classification. Users may choose Local Rules or Owl Model options where available. Model-based options should be used only when approved for the UAT environment.

## 14. Custom Dimensions
Custom Dimensions allow users to add optional report cuts such as site, wave, tenure, LOB, channel, region, product, queue, language, or any other relevant business field. These dimensions can later feed dashboards, filters, custom summaries, and segment-level analysis.
Use custom dimensions when leaders need to compare performance across account-specific groups. Avoid adding fields that are noisy, sparse, or not meaningful for action planning.

## 15. Running Analysis
Once file upload, lookup decision, mapping, rules, AI engine selections, and custom dimensions are complete, click Run Analysis. Keep the browser and launcher open while the analysis is running.
The tool should show progress and eventually confirm analysis completion. If analysis fails, capture the error, note the account and file used, check logs, and record the issue in the UAT tracker.

## 16. Analysis Completion and Guided Insights
After analysis completes, the tool provides a brief guided insight experience. Users can view key outputs, move through insights, deep dive, and choose recommended paths such as Overall Health, Recovery Gap, Target Watch, Sustainability Check, Trend and Movement, and People Performance.
This stage helps users understand the first story before opening dashboards. It is useful for users who want a quick executive read before going into detailed tabs.

## 17. Leadership Questions
The suite generates leadership-ready question responses after analysis. For UAT, testers validate 100 questions per account: 50 score questions and 50 sentiment questions. These questions cover performance, trends, classifications, manager and agent views, movement, reliability, sentiment, themes, and action areas.
Users should judge whether each answer is clear, direct, statistically sensible, supported by visible evidence, and useful for account leadership. Internal framework logic is not shown to testers in the UAT tracker.

## 18. Evidence and Result Details
Many outputs include supporting evidence, detail modals, or evidence tables. These help users understand why the tool generated a particular response. Evidence may include sample size, score movement, sentiment mix, grouped performance, or related comment signals.
If an answer is surprising, users should look for the evidence behind it before marking it incorrect. If evidence is missing, unclear, or contradictory, log feedback or a defect.

## 19. Intelligence Hub Navigation
The NPS and CSAT Intelligence Hubs organize outputs into navigation groups: Data Setup, Dashboard Suite, Performance Lens, Sentiment Engine, Theme Intelligence, Dimension Studio, Experience Signals, Compare, Work in Progress, and Export/Document tools.
Users should treat the hub as the main post-analysis workspace. Each section uses the analyzed data and should be reviewed in relation to the mapped fields and available account data.

## 20. Executive Dashboard
The Executive Dashboard gives the headline performance view. It includes trend charts, score gauge, sentiment mix, score composition, response volume trend, sentiment trend over time, top drivers, executive insights, and an analysis snapshot.
Use this dashboard for quick leadership review. Confirm that the score, target gap, response volume, sentiment mix, and trend direction are consistent with the uploaded data and selected time period.

## 21. Custom Dashboards and Summary Builder
The Summary Builder lets users create dynamic dashboard tables from the current analysis data. Users can choose a title, table style, source rows, group-by field, optional column cut, measure, value field, sort direction, and number of rows to show.
This is useful when an account wants a specific recurring view, such as performance by site, LOB, tenure, manager, queue, or channel. Preview before adding to the dashboard.

## 22. Executive Lens and Role-Based Summaries
Executive Lens provides role-based summaries for QA, Team Manager, Account Manager, and VP audiences. These lenses translate analysis into the language of the user group: quality defects, coaching signals, process friction, capacity risk, loyalty movement, and strategic priorities.
Use the lens that matches the review meeting. A QA review may need verbatim and defect themes, while a VP review may need business risk, target gap, and account priorities.

## 23. Agent and Manager Dashboards
Agent Dashboard and Manager Dashboard provide people-level performance views when agent and manager fields are mapped. They include score trends, score gauges, sentiment mix, score composition, and lists of agents under selected managers.
Use these views for coaching, performance review, and operational follow-up. Always consider sample size and reliability before making people-level conclusions.

## 24. Master Lens
Master Lens is a leadership intelligence view covering performance, sentiment, themes, agents, managers, quartiles, correlations, and action priorities. It is designed to answer multiple leadership questions from one evidence-based readout.
Use Master Lens when leaders need a broad read across the account rather than a single dashboard metric.

## 25. Moving Averages
Moving Averages smooth daily, weekly, and monthly score movement. The view helps reduce noise and show direction, volatility, confidence, volume, strongest periods, weakest periods, and supporting evidence.
Use this when raw period-by-period movement is noisy or when leaders need to understand whether performance is genuinely improving or declining.

## 26. Quartile Intelligence
Quartile Intelligence shows where performance concentrates across Q1 to Q4 groups. It can highlight average score by quartile, game changers, quartile spread, and four-week movement.
Use quartiles to understand distribution, not only top and bottom performers. This is helpful for separating widespread performance issues from isolated pockets.

## 27. Statistics and Custom Statistics
Statistics provides standard statistical reads, weekly trends, driver summaries, correlation readouts, and distribution views. Custom Statistics lets users run single-column, dual-column, and multi-column analysis on analyzed data, dashboard summaries, and dimensions.
Use Statistics when leaders ask whether patterns are meaningful, how variables relate, or how performance is distributed. Interpret results with sample size and business context.

## 28. Sentiment Intelligence in the Hub
Sentiment Intelligence summarizes customer tone after analysis. It includes sentiment snapshot, Sparrow sentiment mix, categorized sentiment table, week-over-week positive and negative movement, custom theme sentiment, and export options.
Sentiment should be used as evidence and context. It should not be treated as proof of causation unless supported by broader analysis.

## 29. Theme Intelligence and Owl Classification
Theme Intelligence uses row-level theme output, including primary, secondary, and tertiary drivers, people/process/tech sentiment, issue type, customer impact, and resolution status where available.
The Custom Theme Builder supports theme discovery, classification setup, one-verbatim testing, full classification output, and CSV export. Theme Comparison can compare current and previous periods to identify fastest rising and most reduced themes.

## 30. Wave, Tenure, and Custom Dimension Intelligence
Wave Intelligence and Tenure Intelligence show score ranking, response mix, negative share, and risk views by wave or tenure. Custom Dimensions create similar dashboards for account-specific fields selected during setup.
Use these views to identify onboarding issues, tenure-related friction, site differences, queue variation, or other segment-level signals.

## 31. Word Cloud Intelligence
Word Cloud Intelligence highlights repeated customer language signals. It includes single-word and two-word clouds, term impact trend, severity ranking, agent concentration, manager concentration, recovery opportunity, and phrase-pair root cause views.
Use this to understand what customers are saying in their own words. High-frequency words should still be interpreted with context and evidence tables.

## 32. Promoter DNA / Satisfied DNA
For NPS, Promoter DNA highlights language and patterns associated with promoters. For CSAT, Satisfied DNA does the same for satisfied customers. It can show advocacy words, phrase patterns, agent advocacy makers, manager advocacy makers, momentum, top phrases, and replication playbooks.
Use this feature to understand what good experiences look like and how they can be replicated across the account.

## 33. Compare and Date Range Analysis
Compare lets users select two periods and analyze movement across score, response mix, sentiment shift, manager movement, agent movement, and consistency or volatility. It is useful for before/after reviews, campaign impact checks, or month-over-month movement.
Use equal and meaningful windows wherever possible. Avoid overinterpreting movement if response volume is very different across periods.

## 34. Export and Reporting Features
Export options include Download Excel Output, Executive PDF Summary, FAQ PDF, GenAI JSON, selected dashboard PDF, selected PPT, selected data sheets, Board Room PDF, and Interactive HTML. Availability may depend on the completed analysis and selected report content.
The Board Room PDF lets users choose report content, header title, account name, prepared-for name, footer note, home page image, separator images, and whether to show header/footer. Recommended content can be selected for a leadership-ready package.

## 35. Review and Override
Review and Override allows users to inspect and adjust sentiment, bucket category, primary reason, Owl drivers, people/process/tech sentiment, issue type, customer impact, resolution status, and override notes where the interface allows it.
Overrides should be used carefully and documented. They are useful when a human reviewer identifies a clear misclassification or wants to apply account-specific context.

## 36. Sparrow Training Workspace
Sparrow Training is a governed model fine-tuning workspace for approved users. It supports secure sign-in, training data upload, column mapping, dataset intelligence, training configuration, system readiness checks, training runs, evaluation, charts, diagnostics, sample audit, trained/tested verbatims, quality verdict, model output path, governance, test prediction, and training summary downloads.
Use this workspace only for authorized model training. Typical users of the analyzer do not need to train Sparrow during routine analysis.

## 37. Owl Training Workspace
Owl Training is a governed theme model training workspace. It supports upload of labelled historical feedback, mapping of feedback and theme fields, label taxonomy, dataset quality review, training configuration, class weighting, training runs, evaluation by output head, model output path, and test classification.
Use Owl Training only when approved users need to improve theme, driver, impact, or resolution classification models.

## 38. Security, Data Handling, and Audit Logging
During UAT, users should use approved data only and keep files within the agreed UAT handling process. The local package is intended for controlled testing. Do not rename internal folders, move application files, or use unapproved customer data.
The suite includes audit/logging concepts for traceability. Users may be asked to provide logs when reporting launch, upload, analysis, or export issues. Cloud implementation is being progressed with IT Security for future hosted access.

## 39. UAT Testing Expectations
For this UAT, each account should complete 50 feature/workflow checks and review 100 leadership question responses. Across 12 accounts, this provides 600 feature checks, 1,200 leadership question validations, and 1,800 structured UAT checks overall.
Record pass/fail status in Test Execution, defects in Defect Log, wording/usability suggestions in Feedback Log, leadership question ratings in Question Review, and final account decision in Sign-Off.

## 40. Troubleshooting
If the tool does not launch, confirm the ZIP was extracted, the launcher is running, and the local browser address is available. If upload fails, confirm file type, file closure, row structure, and required columns. If analysis fails, capture the error and check logs/server.log.
If an output says not available, confirm whether the required field was mapped and whether there is enough data. For low-sample people or period views, conservative wording may be statistically correct.

## 41. Best Practices
Start with clean, approved data. Map columns carefully. Use account-approved targets and thresholds. Add only meaningful custom dimensions. Review sample size before acting on people-level outputs. Use evidence tables before challenging an answer. Separate defects from improvement feedback.
For leadership reviews, begin with Executive Dashboard, then use Master Lens, sentiment, themes, people dashboards, comparison, and exports depending on the meeting objective.

## 42. Glossary
NPS: Net Promoter Score, calculated from promoter and detractor share. CSAT: Customer Satisfaction measure based on satisfied, neutral, and dissatisfied groupings. Verbatim: customer comment text. Sparrow: sentiment intelligence model/layer. Owl: theme and driver intelligence model/layer.
Base File: primary survey input file. Lookup File: optional enrichment file. Custom Dimension: additional business field selected for cuts and dashboards. Evidence Table: supporting data behind an insight. Board Room PDF: leadership-ready exported report.
