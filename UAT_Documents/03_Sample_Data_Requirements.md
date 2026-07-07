# CX Intelligence Suite - Sample Data Requirements

These requirements are based on the Version 24.6 guided analyzer flow and available mapping logic.

## 1. File Format

Preferred:

- `.xlsx`
- One row per customer response
- One header row
- No password protection
- No merged headers
- No blank header names

Acceptable for UAT if the tool reads it successfully:

- Multi-sheet Excel workbook where the intended sheet is clear
- Base file plus lookup file

## 2. Required Fields

| Field | Required | Purpose |
|---|---:|---|
| Feedback/comment/verbatim | Yes | Sentiment, themes, evidence review |
| NPS or CSAT score/result | Yes | Score classification and leadership statistics |

The app requires feedback plus either score/NPS/CSAT to run meaningful analysis.

## 3. Strongly Recommended Fields

| Field | Why It Matters |
|---|---|
| Feedback Date or Response Date | Enables trend, period comparison, improved/declined questions |
| Agent Name or Agent ID | Enables agent scorecard and agent leadership questions |
| Manager/TL or Supervisor | Enables manager dashboard and manager leadership questions |
| Case ID or Survey ID | Helps trace records and join lookup data |
| LOB, Stream, Process, Queue, Channel, Site, Region | Enables richer slicing and dashboard validation |
| Tenure, Wave, Batch, Training Group | Enables workforce context where available |

## 4. NPS Scoring Requirements

Recommended NPS setup:

- Score scale: 0 to 10 or 1 to 10, based on account source data
- Promoter starts at: 9
- Passive starts at: 7
- Detractor: below Passive threshold
- Target: account official NPS target
- Minimum sample for ranking: default 10 unless UAT lead sets account-specific threshold

UAT testers must confirm thresholds during Business Rules.

## 5. CSAT Scoring Requirements

Recommended CSAT setup:

- Score scale: account official survey scale
- Satisfied threshold: account-defined
- Neutral threshold: account-defined
- Dissatisfied: below Neutral threshold
- Target: account official CSAT target
- Minimum sample for ranking: default 10 unless UAT lead sets account-specific threshold

## 6. Lookup File Requirements

Use a lookup file only when the base file does not contain needed business attributes.

Lookup file should include:

- A key also present in the base file, such as Case ID, Agent ID, Employee ID, or Survey ID
- Low blanks in the key column
- Low duplicates when a one-to-one join is expected
- Manager, LOB, site, region, tenure, wave, or other enrichment fields

## 7. Data Quality Checks Before UAT

Check before uploading:

- Score column contains valid numeric or recognizable score values.
- Feedback column has real customer text where sentiment is expected.
- Date column is parseable as a date.
- Agent and manager values are populated for people analysis.
- Account test file does not contain unnecessary sensitive fields.
- Lookup key values match between base and lookup file.
- File is closed before upload.

## 8. Minimum Recommended Sample

Use this as a practical guide, not a hard blocker:

| Analysis Type | Recommended Minimum |
|---|---:|
| Overall NPS/CSAT | 30+ responses |
| Agent or manager ranking | 10+ responses per entity |
| Improved/declined comparison | 10+ responses in both comparison windows |
| Trend analysis | 2+ dated periods; 3+ is better |
| Sentiment readout | Meaningful verbatim coverage |
| Sentiment-to-score alignment | Both score and classified sentiment present |

## 9. Account Submission Checklist

Each account should provide:

- Base survey workbook
- Lookup workbook, if needed
- Official score target
- Official NPS/CSAT thresholds
- Data dictionary if column names are not obvious
- Known caveats about survey design
- Expected high-level business readout, if available for comparison

