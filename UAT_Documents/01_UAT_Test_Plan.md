# CX Intelligence Suite - UAT Test Plan

Version under test: Feedback Intelligence Suite (Version 24.6)

Prepared for: 12-account UAT

## 1. Purpose

This UAT validates that CX Intelligence Suite can be launched locally, process account survey files, produce NPS/CSAT/sentiment outputs, and generate usable leadership evidence for account teams.

The plan is based on the Version 24.6 package contents and app flow:

- Local launcher: `NPS Analyzer.exe`
- Local server: `http://127.0.0.1:8765/`
- Analyzer modules: NPS Analyzer, CSAT Analyzer, Sentiment Analysis
- Dashboards: NPS Intelligence Hub, CSAT Intelligence Hub
- Optional local models: Sparrow sentiment and Owl theme classification
- Outputs: Data Set Summary, Results, Score Briefing, Sentiment Briefing, Insights Readout, Board Room HTML, Download Excel
- Logs and audit: `logs\server.log`, `logs\audit`, `logs\user_logs`

## 2. Participating Accounts

| Zone | Account |
|---|---|
| North | Macys |
| North | Home Protect |
| Domestic | Oppo |
| East Zone | Sainsbury |
| East Zone | Expedia |
| West and G8 | DELL |
| West and G8 | HP |
| South | Adobe |
| South | Toronto Star |
| South | Walmart |
| South | Energy Australia |
| South | HSBC |

## 3. UAT Objectives

- Confirm the launcher starts the local workspace successfully.
- Confirm account files upload and profile correctly.
- Confirm required and optional mappings are clear and correct.
- Confirm NPS and/or CSAT business rules can be configured for each account.
- Confirm analysis completes without failure for realistic account data.
- Confirm the generated outputs are accurate, explainable, and usable.
- Confirm leadership questions show method, logic, statistics, guardrails, and evidence.
- Confirm the 100 leadership question responses are clear, accurate, statistically sensible, and useful for account leadership.
- Confirm sentiment and theme outputs are available when enabled.
- Confirm Excel and Board Room HTML exports work.
- Capture usability feedback, ambiguous wording, defects, and account-specific gaps.

## 4. In Scope

- NPS guided analysis flow.
- CSAT guided analysis flow where account data is CSAT-based.
- Data Set Summary.
- Results tab.
- Score Briefing.
- Sentiment Briefing.
- Insights Readout.
- Dashboard handoff to NPS/CSAT Intelligence Hub.
- Board Room HTML export.
- Excel export.
- Local audit logs and server logs.
- User management basics if admin access is used during UAT.

## 5. Out of Scope Unless Specifically Requested

- Production deployment.
- Multi-user server hosting.
- External cloud storage or internet-based processing.
- Account-specific model retraining.
- Changes to client data definitions during UAT.
- Benchmarking against systems outside the submitted account data.

## 6. Entry Criteria

- Version 24.6 folder is available to testers.
- Tester machine can run `NPS Analyzer.exe`.
- Test data is approved for local UAT use.
- Required data columns are available or a lookup file is provided.
- Each account has named UAT owner, tester, and data contact.
- Known limitations document has been shared.

## 7. Exit Criteria

- All 12 accounts complete the agreed priority test scenarios.
- Critical and high defects are resolved or formally accepted.
- Each account submits sign-off, conditional sign-off, or rejection with reason.
- UAT issue log and feedback log are reviewed.
- Final UAT summary is approved by the tool owner.

## 8. Roles

| Role | Responsibility |
|---|---|
| UAT Lead | Own schedule, issue triage, sign-off collection |
| Account Tester | Execute scenarios and record results |
| Account Data Owner | Provide approved base/lookup files and clarify fields |
| Tool Owner | Clarify expected behavior and approve fixes |
| Technical Support | Investigate launch, logs, exports, and processing issues |
| Business Reviewer | Validate whether outputs are usable for leadership decisions |

## 9. Priority Definitions

| Priority | Meaning |
|---|---|
| P1 Critical | Blocks launch, analysis, or output generation for an account |
| P2 High | Major workflow or result issue with no acceptable workaround |
| P3 Medium | Usability, wording, mapping, or output issue with workaround |
| P4 Low | Cosmetic, enhancement, or future improvement |

## 10. UAT Deliverables

- Completed account participation matrix.
- Completed test execution tracker.
- Defect log.
- Feedback log.
- Completed 100-question response validation review for each tested account.
- Account sign-off sheet.
- Final UAT summary.
