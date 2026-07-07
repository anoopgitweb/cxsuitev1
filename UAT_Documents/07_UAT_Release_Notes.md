# CX Intelligence Suite - UAT Release Notes

Build folder: `C:\Users\manju\Documents\Feedback Intelligence Suite (Version 24.6)`

## 1. UAT Build Summary

This UAT build is a local CX Intelligence Suite package with guided survey analysis workflows, local processing, local audit logs, and exportable leadership outputs.

## 2. Available Modules

- NPS Analyzer
- NPS Intelligence Hub
- CSAT Analyzer
- CSAT Intelligence Hub
- Sentiment Analysis
- Sparrow Training Tool
- Owl Training Tool

## 3. Main Workflow Validated for UAT

- Base file upload
- Optional lookup file enrichment
- Column mapping
- Business rules
- Analysis progress
- Results
- Score Briefing
- Sentiment Briefing
- Insights Readout
- Dashboard handoff
- Board Room HTML
- Excel export

## 4. NPS-Specific UAT Coverage

The NPS analyzer includes a 50-question score framework and a 50-question sentiment framework.

Key areas:

- Overall NPS
- Promoter, Passive, Detractor split
- Agent and manager rankings
- Trend and period comparison
- Reliability and confidence interval guardrails
- Detractor and promoter concentration
- Sentiment-to-NPS-band alignment

## 5. CSAT-Specific UAT Coverage

The CSAT analyzer includes score and sentiment leadership questions.

Key areas:

- Overall CSAT
- Satisfied, Neutral, Dissatisfied classification
- Agent and manager rankings
- Trend and period comparison
- Reliability and confidence interval guardrails
- Sentiment-to-CSAT-classification alignment

## 6. Recent Wording Clarifications Included

The UAT build includes clarified wording for sentiment-to-score alignment:

- NPS uses Promoter, Passive, and Detractor.
- CSAT uses Satisfied, Neutral, and Dissatisfied.
- Alignment is described as validation evidence, not causal proof.

## 7. Local Processing and Logging

The package processes data locally on the machine.

Logs are written locally under:

- `logs\server.log`
- `logs\audit`
- `logs\user_logs`

## 8. UAT Watch Items

Ask testers to pay close attention to:

- Whether mapping suggestions are correct for each account.
- Whether score thresholds match account definitions.
- Whether result wording is clear.
- Whether low-volume or not available outputs are understandable.
- Whether Board Room HTML and Excel export meet leadership needs.
- Whether large files complete in acceptable time.

## 9. Leadership Question Response Validation

The UAT tracker includes a dedicated 100-question review sheet.

Testers should validate:

- Does each answer directly answer the question?
- Is the response wording clear for account leadership?
- Is the answer supported by the visible app evidence and account context?
- Are low-volume or not available results explained well enough?
- Are NPS answers using Promoter, Passive, and Detractor language correctly?
- Are CSAT answers using Satisfied, Neutral, and Dissatisfied language correctly?
- Are sentiment-to-score alignment answers positioned as validation evidence, not causal proof?
