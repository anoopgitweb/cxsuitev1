# CX Intelligence Suite - Data Validation Checklist

Use this before each account test run.

## Account Details

| Item | Value |
|---|---|
| Account |  |
| Zone |  |
| Tester |  |
| Data owner |  |
| Base file name |  |
| Lookup file name, if any |  |
| UAT date |  |

## File Readiness

| Check | Pass/Fail/NA | Notes |
|---|---|---|
| File opens in Excel |  |  |
| File is not password protected |  |  |
| Header row is clear |  |  |
| No merged header cells |  |  |
| One row represents one response |  |  |
| File is closed before upload |  |  |

## Required Column Checks

| Check | Pass/Fail/NA | Notes |
|---|---|---|
| Feedback/comment/verbatim column exists |  |  |
| NPS or CSAT score column exists |  |  |
| Score values are within expected scale |  |  |
| Feedback has usable text |  |  |
| Blank feedback rate is acceptable |  |  |
| Blank score rate is acceptable |  |  |

## Recommended Column Checks

| Check | Pass/Fail/NA | Notes |
|---|---|---|
| Date column exists |  |  |
| Date values parse correctly |  |  |
| Agent column exists |  |  |
| Manager/TL column exists |  |  |
| LOB/site/channel/region fields exist where needed |  |  |
| Case ID or Survey ID exists |  |  |

## Lookup File Checks

| Check | Pass/Fail/NA | Notes |
|---|---|---|
| Lookup needed |  |  |
| Lookup file opens |  |  |
| Base key column exists |  |  |
| Lookup key column exists |  |  |
| Key values match between files |  |  |
| Lookup duplicates are acceptable |  |  |
| Lookup blanks are acceptable |  |  |

## Rule Confirmation

| Rule | Value |
|---|---|
| NPS or CSAT |  |
| Score scale |  |
| Target |  |
| Promoter/Satisfied threshold |  |
| Passive/Neutral threshold |  |
| Minimum sample for ranking |  |
| Sparrow sentiment enabled |  |
| Owl themes enabled |  |

## Final Readiness Decision

| Decision | Notes |
|---|---|
| Ready for UAT |  |
| Ready with caveats |  |
| Not ready |  |

