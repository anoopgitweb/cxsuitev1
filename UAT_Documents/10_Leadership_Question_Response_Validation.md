# CX Intelligence Suite - Leadership Question Response Validation Guide

The 100 leadership questions are the core UAT asset. Each account should validate whether the app's generated answers are good enough for leadership use.

The tracker workbook includes:

- Question Bank: all 100 questions from the Version 24.6 NPS analyzer, shown without internal logic or statistics so testers focus on answer quality.
- Question Review: account-by-account review rows for every question.

## What Testers Should Judge

For each generated answer, testers should assess:

| Dimension | What Good Looks Like |
|---|---|
| Directness | The response answers the question asked, not a nearby question. |
| Clarity | The wording is understandable for an account leader. |
| Data Fit | The answer reflects the uploaded account data and mapping. |
| Statistical Sense | Sample size, confidence interval, p-value, trend, or guardrail language is used appropriately. |
| Actionability | Status such as Monitor, Review required, No action required, or No evidence makes business sense. |
| Evidence | Double-click evidence supports the answer where evidence is available. |
| No Overclaiming | The app does not imply causality or certainty where data is weak. |

## Review Ratings

Use one of these ratings in the tracker:

| Rating | Meaning |
|---|---|
| Good | Ready for UAT sign-off. |
| Minor wording issue | Meaning is right, but wording can be improved. |
| Ambiguous | Tester cannot confidently understand the answer. |
| Statistically questionable | The answer may not be supported by sample, trend, p-value, confidence interval, or guardrail. |
| Incorrect | The answer appears wrong compared with the account data. |
| Not applicable | The account data does not support the question. |

## Required Notes for Non-Good Ratings

For any rating other than Good or Not applicable, capture:

- Generated answer text or screenshot reference.
- Why the answer is unclear, questionable, or wrong.
- Expected answer or better wording, if known.
- Whether this is a wording issue, data issue, calculation issue, or business interpretation issue.

## Special Attention Areas

Pay extra attention to these areas because they are likely to drive leadership confidence:

- Questions returning "not available" or "0 reliable" results.
- Manager and agent rankings.
- Improved/declined questions.
- Low sample and confidence interval guardrails.
- Sentiment-to-NPS-band alignment.
- Sentiment-to-CSAT-classification alignment if CSAT is tested.
- Board Room HTML wording for the same questions.
- Excel export evidence for the same questions.

## Sign-Off Rule

An account should not give clean sign-off if high-impact leadership questions are unclear, unsupported, or statistically questionable.

Suggested rule:

- Clean sign-off: no critical/high question-response concerns.
- Conditional sign-off: concerns exist, but are accepted for UAT with documented caveats.
- Rejected: leadership question responses are not usable for account review.
