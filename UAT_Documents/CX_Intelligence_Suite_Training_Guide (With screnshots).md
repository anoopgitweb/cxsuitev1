# CX Intelligence Suite - Detailed Training Guide (With screenshots)

## 1. How to Use This Training Guide
This guide is meant to train a user end to end. It explains what the suite does, how to move through the setup flow, what each major tab is for, and how to interpret outputs after analysis.
For UAT, use this guide with the tester instruction PDF and the UAT tracker. The tracker is where testers record pass/fail status, defects, feedback, and leadership question review ratings.
The screenshots show the Version 24.6 local application. Some advanced screens may require sign-in or completed analysis before all tables and charts are populated.

## 2. Package and Launch Basics
For UAT, the tool is shared as a local ZIP package. Extract the full folder, keep the folder structure unchanged, and launch using NPS Analyzer.exe from the main Version 24.6 folder.
The launcher starts the local backend server and opens the browser workspace. The application runs locally at 127.0.0.1:8765. Keep the launcher open while using the tool.
Do not move, rename, or delete backend, frontend, apps, models, security, python_packages, logs, outputs, temp, or portable_python. These folders are part of the working package.

## 3. Home Workspace
The home workspace is the starting screen for the suite. It gives users access to NPS Analyzer, CSAT Analyzer, and Sentiment Analyzer. It is also the safest place to return to when switching modules.
Use NPS Analyzer when the survey is Net Promoter Score based. Use CSAT Analyzer when the survey is satisfaction based. Use Sentiment Analyzer when the goal is verbatim sentiment analysis without running the full score analyzer flow.
The setup area may also expose Sparrow training for approved users. Model training workspaces are not required for ordinary analysis users.

## 4. NPS Analyzer: Setup Tabs
The NPS Analyzer walks the user through a guided setup. The left navigation shows the broad steps: Base File, File Ready, Coverage, Mapping, Business Rules, Analysis, and Results.
Start by uploading the Base File. This should contain one row per customer response. The most useful file includes NPS score, customer comment, date, agent, manager, and business dimensions such as site, queue, wave, tenure, LOB, or channel.
If the Base File does not already contain required business attributes, choose the lookup-file path. The lookup file must have a common key that can be matched with the Base File.
In Mapping, assign the fields carefully. Map verbatim feedback, NPS score, NPS category if available, agent name, manager/TL, feedback date, wave, tenure, base join key, and lookup join key where relevant.
In Business Rules, confirm NPS target, score scale, promoter threshold, passive threshold, detractor logic, minimum sample, sentiment method, and theme method. Use account-approved definitions, not guesswork.
Click Analyze Feedback only after file upload, lookup decision, mapping, rules, AI engines, and custom dimensions are correct. Once analysis completes, review insights and open the Intelligence Hub.

## 5. CSAT Analyzer: Setup Tabs
The CSAT Analyzer follows the same guided structure as NPS, but the score logic is satisfaction based. It is used when the account survey measures customer satisfaction rather than recommendation likelihood.
Upload the CSAT Base File, decide whether a lookup file is needed, map the required fields, and configure CSAT thresholds. If a satisfaction category already exists, map it. If not, use score bands to classify each response.
Business Rules for CSAT should include target, score scale, satisfied threshold, neutral threshold, dissatisfied logic, minimum sample, sentiment method, and theme method.
After analysis, the CSAT Intelligence Hub provides equivalent tabs to NPS, but labels and interpretation use CSAT terms such as Satisfied DNA, Dissatisfied recovery, and CSAT movement.

## 6. Sentiment Analyzer
The Sentiment Analyzer is a standalone workspace for verbatim sentiment review. It is useful when the user wants to analyze customer comments without running the full NPS or CSAT analyzer flow.
The top navigation includes Upload, Setup, Dashboard, Word Cloud, and Data. Start with Upload, then map columns in Setup, run analysis, review charts in Dashboard, explore terms in Word Cloud, and inspect row-level results in Data.
Column Mapping includes Verbatim / Feedback Field, Agent, Manager / TL, and Date. Agent, manager, and date are optional but enable owner and trend views.
Analysis Mode lets users choose Local Sparrow, OpenAI API, or Claude API depending on what is approved. For UAT, use only the approved method.
Dashboard outputs include Sentiment Mix, Confidence Distribution, Sentiment by Owner, Sentiment Trend, and Verbatim Sentiment Results. Word Cloud outputs include Interactive Word Cloud, Top Terms, Negative Language Signals, Language by Sentiment, and Term Evidence Table.
Use Export PDF or Export CSV to share sentiment outputs. Open exported files before distribution to confirm content is complete.

## 7. Intelligence Hub Access
The NPS and CSAT Intelligence Hubs are the main post-analysis workspaces. They may show a secure sign-in screen before users can access dashboard content.
Authorized users should sign in using approved credentials. Do not share credentials. If a tester cannot access the hub, record it as a UAT access issue and attach a screenshot.
Once inside, the left navigation groups the tool into Data Setup, Dashboard Suite, Performance Lens, Sentiment Engine, Theme Intelligence, Dimension Studio, Experience Signals, Compare, Work In Progress, and Export/Document tools.

## 8. Data Setup Tabs
Data Setup contains the setup review and Column Explorer. Use these tabs when you need to understand what data was loaded, what fields were mapped, and what fields exist for dashboards.
Setup shows uploaded file context, mapping choices, score rules, sentiment/theme method selections, and custom dimensions. Use it to confirm the analysis was configured correctly.
Column Explorer is a data dictionary. It helps users review base sheet columns, lookup sheet columns, mapped fields, generated output fields, and analysis-ready columns. Filters can narrow by source, type, role, or mapped field.
If a dashboard or leadership answer is missing, check Column Explorer first. The required field may not have existed or may not have been mapped.

## 9. Dashboard Suite Tabs
Dashboard Suite is where most business users will spend time after analysis. It includes Executive Dashboard, Agent Dashboard, Manager Dashboard, Custom Dashboards, and role-based leadership summaries.
Executive Dashboard is the primary leadership page. It shows overall score, trend, gauge, composition, response volume, sentiment mix, top drivers, executive insights, and the analysis snapshot.
Agent Dashboard shows score trend, gauge, sentiment mix, and composition for selected agents when agent data is mapped. Use it for coaching signals, not as a standalone performance verdict.
Manager Dashboard shows the selected manager/TL view and agents under that manager. Use it to understand team-level strengths, risks, and coaching opportunities.
Custom Dashboards and Summary Builder allow users to build account-specific tables. Select source rows, group-by field, optional column cut, measure, value field, sort direction, and row count. Preview before adding to dashboard.
Role-based summaries include QA Lens, Team Manager Lens, Account Manager Lens, and VP Lens. Choose the lens that matches the review audience.

## 10. Performance Lens Tabs
Performance Lens helps users move beyond headline score and inspect movement, stability, distribution, and statistical relationships.
Master Lens is a leadership intelligence readout that brings together performance, sentiment, themes, agents, managers, quartiles, correlations, and action priorities.
Moving Averages smooth daily, weekly, and monthly movement. Use this when raw period movement is noisy or leaders need a clearer direction of travel.
Quartile Intelligence shows score distribution across Q1 to Q4 groups. Use it to understand concentration, spread, and whether issues are isolated or widespread.
Statistics provides standard statistical reads, correlation readouts, weekly trends, and driver summaries. Custom Statistics lets users run single-column, dual-column, and multi-column analysis.
Custom Statistics should be used by trained analysts. Choose the data source and analysis type, then interpret the result in business language.

## 11. Sentiment Engine Tabs
The Sentiment Engine inside the hub uses the completed analysis output. It is different from the standalone Sentiment Analyzer because it is connected to the NPS or CSAT run.
Sentiment Intelligence shows sentiment snapshot, Sparrow sentiment mix, categorized sentiment table, sentiment engine status, and export options.
Sentiment Comparison shows week-over-week positive and negative movement. It does not rerun sentiment classification; it compares movement from the completed analysis output.
Custom Theme Sentiment lets users choose built themes and view sentiment movement by theme. Build Theme Classification first if theme-specific sentiment is needed.
Use sentiment as context and evidence. It helps explain customer tone, but it should not be treated as proof that sentiment caused score movement unless supported by other evidence.

## 12. Theme Intelligence Tabs
Theme Intelligence helps users understand what customers are talking about. It may use Local Rules or Owl model output depending on setup.
Theme Classification shows row-level Owl output such as primary, secondary, and tertiary drivers; people, process, and tech sentiment; issue type; impact; and resolution status.
Build Theme Classification has three steps: Discover Themes, Build Classification, and Export CSV. Use Discover Themes to suggest categories, Test one verbatim to validate classification logic, then build the full output.
Theme Comparison compares themes across two periods. Use date field, current start/end, and previous start/end to identify fastest rising and most reduced themes.
Themes should be read with examples. A theme label alone is not enough; use evidence and verbatims to understand what customers actually said.

## 13. Dimension Studio Tabs
Dimension Studio gives segment-level analysis. Standard tabs include Wave Intelligence and Tenure Intelligence. Custom Dimensions appear when the user adds optional fields during setup.
Wave Intelligence can show score ranking, response mix, negative share, and passive or neutral risk by wave. Use it for onboarding, batch, or training-wave analysis.
Tenure Intelligence can show score ranking, response mix, negative share, and risk by tenure group. Use it to understand whether newer or longer-tenured employees show different CX outcomes.
Custom Dimensions should be used for account-specific fields such as site, LOB, channel, language, product, queue, or region. Add only dimensions that are meaningful and actionable.

## 14. Experience Signal Tabs
Experience Signals focus on customer language and advocacy patterns. They help users understand what customers repeatedly mention and what strong experiences look like.
Word Cloud Intelligence includes single-word and two-word clouds, top language signals, term impact trend, severity ranking, agent concentration, manager concentration, recovery opportunity, and phrase-pair root cause views.
Promoter DNA is used in NPS. Satisfied DNA is used in CSAT. These views identify positive language patterns, advocacy words, phrase patterns, agents or managers associated with positive mentions, and replication opportunities.
Alert Badges are operational flags or watch items. Use them to quickly identify signals that may need follow-up.

## 15. Compare Tab
Compare is used for date-range movement analysis. Users select two periods and analyze movement across score, response mix, sentiment, managers, agents, and volatility.
Use Compare for before/after reviews, campaign impact checks, month-over-month movement, or equal-window performance comparisons.
Choose comparable periods wherever possible. If the two periods have very different response volume, interpret movement carefully.
Outputs include comparison summary, manager movement, agent movement, sentiment movement, consistency and volatility, and help/formulas.

## 16. Export and Board Room Tabs
Export tools let users package outputs for analysis, leadership review, and downstream use. Available exports include Download Excel Output, Executive PDF Summary, FAQ PDF, Export GenAI JSON, selected dashboard PDF, selected PPT, selected data sheets, Board Room PDF, and Interactive HTML.
Select Content For Document lets users choose dashboard tabs and create selected reports. Use Select All for a broad pack or choose only the sections relevant to the meeting.
Board Room PDF is intended for leadership-ready reporting. Users can set header title, account name, prepared for, footer note, home page image, separator images, and whether header/footer should appear.
Use Recommended content when the audience needs a standard executive pack. Use manual selection when the audience needs a narrower report.

## 17. Review and Override
Review and Override is used when a human reviewer needs to inspect or correct classifications. It may include sentiment, bucket category, primary reason, Owl primary/secondary/tertiary driver, people/process/tech sentiment, issue type, customer impact, resolution status, and override notes.
Use overrides sparingly. They should correct clear classification issues or apply account-specific context. They should not be used to force the data to match a preferred story.
When overriding, add notes. A future reviewer should understand what changed and why.

## 18. Sparrow Training Workspace
Sparrow Training is a governed model fine-tuning workspace for approved users. Ordinary UAT testers do not need to train Sparrow to run the analyzer.
The sign-in screen protects the training workspace. Users should sign in only with approved credentials and should use approved labelled training data only.
Training Console includes Training Data, Column Mapping, Dataset Intelligence, Training Configuration, System Readiness, Model Technical Details, Training Run, Evaluation, Training Charts and Diagnostics, Sample Audit, Trained and Tested Verbatims, Quality Verdict, Model Output, Governance, Test Prediction, Technical Internals, Compare Training Runs, Documentation, Publishing Checklist, Training Summary PDF, and Fine-Tuning Parameters.
Use Validate Mapping before training. Review dataset quality, class balance, validation split, learning rate, epochs, batch size, max length, random seed, and early stopping. After training, review evaluation metrics and failed samples before publishing a model path.

## 19. Owl Training Workspace
Owl Training is a governed theme intelligence training workspace for approved users. It supports multi-output theme, driver, sentiment, resolution, and impact classification.
The workspace starts with secure sign-in. After sign-in, users upload historical feedback with labelled driver and theme columns.
Column Mapping includes Feedback / Verbatim, Primary Theme / Driver, Secondary Theme, Sentiment Override, Resolution Status, and Impact / Risk. Validate mapping before training.
Training Configuration includes base model, epochs, batch size, learning rate, validation split, max length, output heads, and class weighting for imbalanced labels.
Evaluation by Output Head helps users confirm whether each classification head is performing acceptably. Test Classification lets users try a sample verbatim before using the model in analysis.

## 20. UAT Usage Guidance
For this UAT, testers should complete 50 feature/workflow checks per account and review 100 leadership question responses per account. Across 12 accounts, that creates 1,800 structured UAT checks.
Use the Test Execution sheet for feature checks, Question Review for leadership answer quality, Defect Log for tool issues, Feedback Log for wording/usability ideas, and Sign-Off for final account decision.
When reviewing the 100 leadership questions, focus on clarity, usefulness, correctness, ambiguity, statistical sense, evidence support, and actionability. Do not require testers to validate hidden internal formulas.

## 21. Troubleshooting and Checks
If the app does not launch, confirm the ZIP was extracted, portable_python is present beside the EXE, and no folder names were changed. Then check logs/server.log.
If upload fails, confirm file type, file closure, sheet structure, and whether the file has protected or unusual content. Try a clean copy of the workbook if needed.
If outputs are blank, check mapping first. The required field may not exist or may not have been mapped. Also check whether the selected segment has enough sample size.
If an output says not available or 0 reliable managers/agents, that may be statistically correct when fields are missing or sample size is too low. Log it as a defect only if the wording is unclear or the data should have supported the output.
If export fails, capture the selected export type, screenshot, account, timestamp, and log reference.

## 22. Glossary
NPS: Net Promoter Score. CSAT: Customer Satisfaction. Verbatim: customer comment text. Base File: primary survey input. Lookup File: optional enrichment file. Mapping: assigning file columns to tool roles.
Sparrow: custom-trained sentiment intelligence model/layer. Owl: theme and driver intelligence model/layer. Custom Dimension: optional business field used for cuts and dashboards. Evidence Table: supporting data behind an answer. Board Room PDF: leadership-ready report export.
