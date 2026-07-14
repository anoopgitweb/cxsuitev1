(() => {
  const DEFINITIONS = [
    ["variation", "Which dimension shows the greatest performance variation?", "At least two eligible values are required within one selected dimension."],
    ["strongest", "Which eligible segment performs best?", "No Setup-selected segment met the minimum sample and scoring requirements."],
    ["risk", "Which eligible segment presents the highest risk?", "No Setup-selected segment met the minimum sample and scoring requirements."],
    ["negative-contribution", "Which segment contributes the largest negative-response volume?", "Negative-sentiment results were not available for eligible dimension values."],
    ["negative-rate", "Which segment has the highest negative-response rate?", "Negative-sentiment results were not available for eligible dimension values."],
    ["improvement", "Which segment has improved the most recently?", "A valid date field and two comparable periods meeting the minimum sample are required."],
    ["decline", "Which segment has declined the most recently?", "A valid date field and two comparable periods meeting the minimum sample are required."],
    ["consistency", "Which dimension demonstrates the greatest consistency?", "At least three eligible values are required to calculate dimension consistency."],
    ["alignment", "Where is the strongest score-and-sentiment misalignment?", "Eligible score and sentiment results were not available together."],
    ["relationship", "Which dimension has the strongest evidence-based relationship with the outcome?", "No selected dimension returned at least two eligible values and a measurable effect size."],
  ];

  const safe = (value) => typeof escapeHtml === "function" ? escapeHtml(String(value ?? "")) : String(value ?? "");
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

  function configuredColumns(analysis) {
    const browserColumns = typeof dashboardMakerSetupDimensionColumns === "function" ? dashboardMakerSetupDimensionColumns() : [];
    const payloadColumns = [
      ...(analysis.selectedDimensionColumns || []),
      ...(analysis.evidenceRelationship?.selectedDimensions || []),
      ...(analysis.dynamicDimensions || []).map((item) => typeof item === "string" ? item : item?.name),
    ];
    return Array.from(new Set([...browserColumns, ...payloadColumns].map((column) => String(column || "").trim()).filter(Boolean)));
  }

  function movementSignals(analysis, minimumSample, scopedColumns) {
    const sourceRows = resultAllRows(analysis);
    const metric = resultScoreName(analysis);
    const columns = Array.isArray(scopedColumns) && scopedColumns.length ? scopedColumns : configuredColumns(analysis);
    if (!sourceRows.length || !columns.length) return [];
    const dated = sourceRows.map((row) => ({ row, week: resultWeekKeyForDate(resultDateFromRow(row)) })).filter((item) => item.week);
    const weeks = Array.from(new Set(dated.map((item) => item.week))).sort();
    if (weeks.length < 2) return [];
    const windowSize = Math.min(4, Math.floor(weeks.length / 2));
    if (!windowSize) return [];
    const latestWeeks = new Set(weeks.slice(-windowSize));
    const priorWeeks = new Set(weeks.slice(-(windowSize * 2), -windowSize));
    const groups = new Map();
    dated.forEach(({ row, week }) => {
      const period = latestWeeks.has(week) ? "latest" : priorWeeks.has(week) ? "prior" : "";
      if (!period) return;
      const score = resultRawScore(row, metric);
      if (!Number.isFinite(score)) return;
      columns.forEach((column) => {
        const value = dimensionPivotCellValue(row, column);
        if (!value || value === "Unknown") return;
        const key = column + "|||" + value;
        const item = groups.get(key) || {
          dimension: resultDimensionDisplayName(column), value,
          latestSum: 0, latestCount: 0, priorSum: 0, priorCount: 0,
        };
        item[period + "Sum"] += score;
        item[period + "Count"] += 1;
        groups.set(key, item);
      });
    });
    return Array.from(groups.values())
      .filter((item) => item.latestCount >= minimumSample && item.priorCount >= minimumSample)
      .map((item) => ({
        ...item,
        latestScore: item.latestSum / item.latestCount,
        priorScore: item.priorSum / item.priorCount,
        change: (item.latestSum / item.latestCount) - (item.priorSum / item.priorCount),
        weeks: windowSize,
      }));
  }

  function evidenceLabel(volume) {
    return volume >= 100 ? "Strong evidence" : volume >= 30 ? "Moderate evidence" : "Directional evidence";
  }

  function rowArtifact(row, metric) {
    if (!row) return [];
    return [{
      Dimension: row.Dimension,
      Segment: row["Dimension Value"],
      Volume: row.Volume,
      [metric]: row[metric],
      "Negative Sentiment %": row["Negative Sentiment %"],
      "Gap to Overall": row["Gap to Overall"],
      Confidence: row.Confidence,
    }];
  }

  function matchesRow(row, answerRow) {
    return Boolean(row && answerRow
      && String(row.Dimension || "") === String(answerRow.Dimension || "")
      && String(row["Dimension Value"] || row.Segment || "") === String(answerRow["Dimension Value"] || answerRow.Segment || ""));
  }

  function segmentArtifacts(items, metric, answerRow, enrich) {
    return (items || []).map((row) => ({
      ...rowArtifact(row, metric)[0],
      ...(typeof enrich === "function" ? enrich(row) : {}),
      __answer: matchesRow(row, answerRow),
    }));
  }

  function supported(key, answer, evidence, method, formula, rows) {
    return { key, answer, evidence, method, formula, rows: rows || [], answered: true };
  }

  function questionModel(rows, analysis, scopeDimension) {
    const metric = resultScoreName(analysis);
    const minimumSample = Math.max(1, Number(analysis.evidenceRelationship?.minimumSample || document.getElementById("minimumSampleInput")?.value || 5));
    const allColumns = configuredColumns(analysis);
    const scope = String(scopeDimension || "").trim();
    const columns = scope ? allColumns.filter((column) => String(column) === scope || resultDimensionDisplayName(column) === scope) : allColumns;
    const selectedNames = new Set(columns.flatMap((column) => [String(column), resultDimensionDisplayName(column)]));
    const selectedRows = selectedNames.size ? rows.filter((row) => selectedNames.has(String(row.Dimension || ""))) : [];
    const eligible = selectedRows.filter((row) => Number(row.Volume) >= minimumSample
      && Number.isFinite(Number(row[metric]))
      && String(row["Dimension Value"] || "").trim()
      && !/^(unknown|not available|n\/a|-)$/.test(String(row["Dimension Value"]).trim().toLowerCase()));
    const byDimension = new Map();
    eligible.forEach((row) => {
      const name = String(row.Dimension || "Dimension");
      if (!byDimension.has(name)) byDimension.set(name, []);
      byDimension.get(name).push(row);
    });
    const summaries = Array.from(byDimension.entries()).map(([dimension, items]) => {
      const ordered = items.slice().sort((a, b) => Number(b[metric]) - Number(a[metric]));
      const scores = ordered.map((item) => Number(item[metric]));
      const volume = items.reduce((sum, item) => sum + Number(item.Volume || 0), 0);
      return {
        dimension, items, volume,
        best: ordered[0], risk: ordered[ordered.length - 1],
        spread: ordered.length >= 2 ? Number(ordered[0][metric]) - Number(ordered[ordered.length - 1][metric]) : NaN,
        volatility: scores.length >= 3 ? stdDev(scores) : NaN,
      };
    });
    const answers = new Map();
    const variation = summaries.filter((item) => Number.isFinite(item.spread)).sort((a, b) => b.spread - a.spread)[0];
    if (variation) answers.set("variation", supported(
      "variation",
      variation.dimension + " shows the greatest " + metric + " variation, with a " + formatDataPoint(variation.spread) + "-point difference between " + variation.best["Dimension Value"] + " (" + formatDataPoint(Number(variation.best[metric])) + ") and " + variation.risk["Dimension Value"] + " (" + formatDataPoint(Number(variation.risk[metric])) + ").",
      evidenceLabel(variation.volume),
      "Eligible values were ranked inside each selected dimension. The largest best-to-worst spread was retained.",
      "Performance spread = highest eligible " + metric + " - lowest eligible " + metric,
      summaries.filter((item) => Number.isFinite(item.spread)).sort((a, b) => b.spread - a.spread)
        .flatMap((item) => item.items.slice().sort((a, b) => Number(b[metric]) - Number(a[metric])).map((row) => ({
          ...rowArtifact(row, metric)[0],
          "Dimension Spread": item.spread,
          __answer: item.dimension === variation.dimension && (matchesRow(row, item.best) || matchesRow(row, item.risk)),
        })))
    ));
    const strongest = eligible.slice().sort((a, b) => Number(b[metric]) - Number(a[metric]) || Number(b.Volume) - Number(a.Volume))[0];
    if (strongest) answers.set("strongest", supported(
      "strongest",
      strongest["Dimension Value"] + " in " + strongest.Dimension + " records the strongest eligible " + metric + " at " + formatDataPoint(Number(strongest[metric])) + ", based on " + Number(strongest.Volume).toLocaleString() + " responses.",
      evidenceLabel(Number(strongest.Volume)),
      "All eligible selected-dimension values were sorted by outcome score, with volume used to resolve equal scores.",
      "Strongest segment = maximum eligible " + metric,
      segmentArtifacts(eligible.slice().sort((a, b) => Number(b[metric]) - Number(a[metric]) || Number(b.Volume) - Number(a.Volume)), metric, strongest)
    ));
    const risk = eligible.slice().sort((a, b) => Number(a[metric]) - Number(b[metric]) || Number(b.Volume) - Number(a.Volume))[0];
    if (risk) answers.set("risk", supported(
      "risk",
      risk["Dimension Value"] + " in " + risk.Dimension + " records the lowest eligible " + metric + " at " + formatDataPoint(Number(risk[metric])) + ", based on " + Number(risk.Volume).toLocaleString() + " responses.",
      evidenceLabel(Number(risk.Volume)),
      "All eligible selected-dimension values were sorted from lowest to highest outcome score.",
      "Highest-risk segment = minimum eligible " + metric,
      segmentArtifacts(eligible.slice().sort((a, b) => Number(a[metric]) - Number(b[metric]) || Number(b.Volume) - Number(a.Volume)), metric, risk)
    ));
    const negativeRows = eligible.filter((row) => Number.isFinite(Number(row["Negative Sentiment %"])));
    const negativeContributor = negativeRows.map((row) => ({ row, count: Number(row.Volume) * Number(row["Negative Sentiment %"]) / 100 })).sort((a, b) => b.count - a.count)[0];
    if (negativeContributor?.count > 0) answers.set("negative-contribution", supported(
      "negative-contribution",
      negativeContributor.row["Dimension Value"] + " in " + negativeContributor.row.Dimension + " contributes the largest estimated negative-sentiment volume: approximately " + Math.round(negativeContributor.count).toLocaleString() + " responses.",
      evidenceLabel(Number(negativeContributor.row.Volume)),
      "Estimated negative-response counts were calculated for every eligible segment and ranked from highest to lowest.",
      "Estimated negative responses = segment volume x negative sentiment % / 100",
      negativeRows.map((row) => ({ row, count: Number(row.Volume) * Number(row["Negative Sentiment %"]) / 100 }))
        .sort((a, b) => b.count - a.count)
        .map((item) => ({ ...rowArtifact(item.row, metric)[0], "Estimated Negative Responses": Math.round(item.count), __answer: matchesRow(item.row, negativeContributor.row) }))
    ));
    const negativeRate = negativeRows.slice().sort((a, b) => Number(b["Negative Sentiment %"]) - Number(a["Negative Sentiment %"]) || Number(b.Volume) - Number(a.Volume))[0];
    if (negativeRate) answers.set("negative-rate", supported(
      "negative-rate",
      negativeRate["Dimension Value"] + " in " + negativeRate.Dimension + " has the highest eligible negative-sentiment rate at " + formatDataPoint(Number(negativeRate["Negative Sentiment %"])) + "% across " + Number(negativeRate.Volume).toLocaleString() + " responses.",
      evidenceLabel(Number(negativeRate.Volume)),
      "Eligible segments were ranked directly by their negative-sentiment percentage.",
      "Negative rate = negative-sentiment responses / eligible segment responses x 100",
      segmentArtifacts(negativeRows.slice().sort((a, b) => Number(b["Negative Sentiment %"]) - Number(a["Negative Sentiment %"]) || Number(b.Volume) - Number(a.Volume)), metric, negativeRate)
    ));
    const movement = movementSignals(analysis, minimumSample, columns);
    const improvement = movement.filter((item) => item.change > 0).sort((a, b) => b.change - a.change)[0];
    if (improvement) answers.set("improvement", supported(
      "improvement",
      improvement.value + " in " + improvement.dimension + " improved by " + formatDataPoint(improvement.change) + " " + metric + " points in the latest " + improvement.weeks + "-week comparison.",
      evidenceLabel(improvement.latestCount + improvement.priorCount),
      "Up to four latest available weeks were compared with the immediately preceding equivalent period.",
      "Improvement = latest-period " + metric + " - prior-period " + metric,
      movement.slice().sort((a, b) => b.change - a.change).map((item) => ({ Dimension: item.dimension, Segment: item.value, "Prior Score": item.priorScore, "Latest Score": item.latestScore, Change: item.change, "Prior Volume": item.priorCount, "Latest Volume": item.latestCount, __answer: item === improvement }))
    ));
    const decline = movement.filter((item) => item.change < 0).sort((a, b) => a.change - b.change)[0];
    if (decline) answers.set("decline", supported(
      "decline",
      decline.value + " in " + decline.dimension + " declined by " + formatDataPoint(Math.abs(decline.change)) + " " + metric + " points in the latest " + decline.weeks + "-week comparison.",
      evidenceLabel(decline.latestCount + decline.priorCount),
      "Up to four latest available weeks were compared with the immediately preceding equivalent period.",
      "Decline = prior-period " + metric + " - latest-period " + metric,
      movement.slice().sort((a, b) => a.change - b.change).map((item) => ({ Dimension: item.dimension, Segment: item.value, "Prior Score": item.priorScore, "Latest Score": item.latestScore, Change: item.change, "Prior Volume": item.priorCount, "Latest Volume": item.latestCount, __answer: item === decline }))
    ));
    const consistent = summaries.filter((item) => Number.isFinite(item.volatility)).sort((a, b) => a.volatility - b.volatility)[0];
    if (consistent) answers.set("consistency", supported(
      "consistency",
      consistent.dimension + " shows the smallest score variation across eligible values, with a standard deviation of " + formatDataPoint(consistent.volatility) + " " + metric + " points across " + consistent.items.length + " segments.",
      evidenceLabel(consistent.volume),
      "Dimensions with at least three eligible values were compared by the standard deviation of their segment scores.",
      "Consistency indicator = lowest standard deviation across eligible segment scores",
      summaries.filter((item) => Number.isFinite(item.volatility)).sort((a, b) => a.volatility - b.volatility)
        .flatMap((item) => item.items.slice().sort((a, b) => Number(b[metric]) - Number(a[metric])).map((row) => ({
          ...rowArtifact(row, metric)[0],
          "Dimension Standard Deviation": item.volatility,
          "Dimension Spread": item.spread,
          __answer: item.dimension === consistent.dimension,
        })))
    ));
    const alignmentRows = negativeRows.map((row) => {
      const scoreExpectation = metric === "NPS" ? (Number(row[metric]) + 100) / 2 : Number(row[metric]);
      const sentimentPositive = 100 - Number(row["Negative Sentiment %"]);
      return { row, scoreExpectation, sentimentPositive, divergence: Math.abs(scoreExpectation - sentimentPositive) };
    }).filter((item) => Number.isFinite(item.divergence)).sort((a, b) => b.divergence - a.divergence);
    const alignment = alignmentRows[0];
    if (alignment && alignment.divergence >= 5) answers.set("alignment", supported(
      "alignment",
      alignment.row["Dimension Value"] + " in " + alignment.row.Dimension + " shows the largest score-and-sentiment divergence at " + formatDataPoint(alignment.divergence) + " points. Review the underlying verbatims before assigning cause.",
      evidenceLabel(Number(alignment.row.Volume)),
      "Outcome scores and positive-sentiment equivalents were placed on a comparable 0-100 scale before calculating the absolute difference.",
      metric === "NPS" ? "Divergence = absolute value of (((NPS + 100) / 2) - (100 - negative sentiment %))" : "Divergence = absolute value of (CSAT - (100 - negative sentiment %))",
      alignmentRows.map((item) => ({ ...rowArtifact(item.row, metric)[0], "Score Equivalent %": item.scoreExpectation, "Sentiment Positive %": item.sentimentPositive, Divergence: item.divergence, __answer: item === alignment }))
    ));
    const relationshipRows = Array.isArray(analysis.evidenceRelationship?.dimensions) ? analysis.evidenceRelationship.dimensions : [];
    const relationship = relationshipRows.filter((row) => selectedNames.has(String(row.Dimension || ""))
      && Number.isFinite(Number(row["Effect Size"])) && Number(row["Eligible Values"] || 0) >= 2)
      .sort((a, b) => Number(b["Effect Size"]) - Number(a["Effect Size"]))[0];
    if (relationship) {
      const effect = Number(relationship["Effect Size"]);
      const strength = relationship.Relationship || (effect >= 0.14 ? "Strong" : effect >= 0.06 ? "Moderate" : effect >= 0.01 ? "Weak" : "Minimal");
      answers.set("relationship", supported(
        "relationship",
        relationship.Dimension + " has the strongest measurable relationship with " + metric + " among the Setup-selected dimensions, with an effect size of " + effect.toFixed(4) + ". This is an association and does not establish causation.",
        strength + " relationship",
        "Categorical dimensions are compared using between-group effect size. At least two values must meet the minimum sample.",
        "Effect size = between-group outcome variance / total outcome variance",
        relationshipRows.filter((row) => selectedNames.has(String(row.Dimension || ""))
          && Number.isFinite(Number(row["Effect Size"])) && Number(row["Eligible Values"] || 0) >= 2)
          .sort((a, b) => Number(b["Effect Size"]) - Number(a["Effect Size"]))
          .map((row) => ({
            Dimension: row.Dimension,
            Relationship: row.Relationship || (Number(row["Effect Size"]) >= 0.14 ? "Strong" : Number(row["Effect Size"]) >= 0.06 ? "Moderate" : Number(row["Effect Size"]) >= 0.01 ? "Weak" : "Minimal"),
            "Effect Size": Number(row["Effect Size"]),
            "Eligible Values": row["Eligible Values"],
            Populated: row.Populated,
            "Score Spread": row["Score Spread"],
            __answer: String(row.Dimension || "") === String(relationship.Dimension || ""),
          }))
      ));
    }
    const scopedQuestions = scope ? {
      variation: "How widely does " + scope + " performance vary across eligible segments?",
      strongest: "Which " + scope + " segment performs best?",
      risk: "Which " + scope + " segment presents the highest risk?",
      "negative-contribution": "Which " + scope + " segment contributes the largest negative-response volume?",
      "negative-rate": "Which " + scope + " segment has the highest negative-response rate?",
      improvement: "Which " + scope + " segment has improved the most recently?",
      decline: "Which " + scope + " segment has declined the most recently?",
      consistency: "How consistent is performance across " + scope + " segments?",
      alignment: "Which " + scope + " segment has the strongest score-and-sentiment misalignment?",
      relationship: "How strong is the evidence-based relationship between " + scope + " and the outcome?",
    } : {};
    const questions = DEFINITIONS.map(([key, question, unavailable], index) => {
      const answer = answers.get(key);
      const displayedQuestion = scopedQuestions[key] || question;
      return answer ? { ...answer, number: index + 1, question: displayedQuestion }
        : {
          key, number: index + 1, question: displayedQuestion, answered: false,
          answer: "Insufficient evidence: " + unavailable,
          evidence: "Insufficient evidence",
          method: "The question was evaluated but the completed dataset did not satisfy the required fields, values or minimum sample.",
          formula: "No calculation was produced because the evidence guardrail was not met.",
          rows: [],
        };
    });
    return { questions, minimumSample, answeredCount: questions.filter((item) => item.answered).length, scope };
  }

  function artifactTable(rows) {
    if (!rows?.length) return '<div class="dimension-question-no-artifact">No supporting rows were produced because the evidence requirement was not met.</div>';
    const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row || {}))))
      .filter((column) => column !== "__answer" && rows.some((row) => row[column] !== undefined && row[column] !== null && row[column] !== ""));
    const display = (value) => typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
    return '<p class="dimension-artifact-guide"><span></span>Green row(s) support the displayed answer; all other eligible comparison segments are also shown.</p>'
      + '<div class="table-wrap fit-table compact-report-table"><table><thead><tr>' + columns.map((column) => '<th>' + safe(column) + '</th>').join("") + '</tr></thead><tbody>'
      + rows.map((row) => '<tr class="' + (row.__answer ? "dimension-artifact-answer" : "") + '">' + columns.map((column) => '<td>' + safe(display(row[column] ?? "")) + '</td>').join("") + '</tr>').join("")
      + '</tbody></table></div>';
  }

  function openDetail(item, minimumSample) {
    document.querySelector(".dimension-question-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.className = "dimension-question-overlay";
    overlay.innerHTML = '<section class="dimension-question-dialog" role="dialog" aria-modal="true">'
      + '<button class="dimension-question-close" type="button" aria-label="Close">x</button>'
      + '<p class="eyebrow">Dimension Intelligence - Question ' + item.number + '</p>'
      + '<h2>' + safe(item.question) + '</h2>'
      + '<div class="dimension-question-detail-answer"><span>Answer</span><p>' + safe(item.answer) + '</p><strong>' + safe(item.evidence) + '</strong></div>'
      + '<div class="dimension-question-method-grid"><article><span>Method</span><p>' + safe(item.method) + '</p></article><article><span>Calculation</span><p>' + safe(item.formula) + '</p></article><article><span>Eligibility rule</span><p>Setup-selected dimensions only; each value requires at least ' + minimumSample + ' eligible responses.</p></article></div>'
      + '<div class="dimension-question-artifact"><h3>Supporting artifact</h3>' + artifactTable(item.rows) + '</div>'
      + '<p class="dimension-question-caution">The calculation explains association and observed performance. Operational context is required before assigning cause or action.</p>'
      + '</section>';
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector(".dimension-question-close")?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
  }

  function dimensionGraphOverviewRows(rows, analysis) {
    const metric = resultScoreName(analysis);
    const minimumSample = Math.max(1, Number(analysis.evidenceRelationship?.minimumSample || document.getElementById("minimumSampleInput")?.value || 5));
    const groups = new Map();
    (rows || []).filter((row) => Number(row.Volume || 0) >= minimumSample).forEach((row) => {
      const dimension = String(row.Dimension || "").trim();
      if (!dimension) return;
      if (!groups.has(dimension)) groups.set(dimension, []);
      groups.get(dimension).push(row);
    });
    return Array.from(groups.entries()).map(([dimension, items]) => {
      const volumes = items.map((row) => Number(row.Volume || 0));
      const totalVolume = volumes.reduce((sum, value) => sum + value, 0);
      const scores = items.map((row) => Number(row[metric])).filter(Number.isFinite);
      const weighted = (field) => {
        let weightedTotal = 0;
        let weight = 0;
        items.forEach((row) => {
          const value = Number(row[field]);
          const volume = Number(row.Volume || 0);
          if (!Number.isFinite(value) || volume <= 0) return;
          weightedTotal += value * volume;
          weight += volume;
        });
        return weight ? weightedTotal / weight : null;
      };
      return {
        Dimension: dimension,
        "Dimension Value": dimension,
        [metric]: weighted(metric),
        "Performance Spread": scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : 0,
        Volume: totalVolume,
        "Negative Sentiment %": weighted("Negative Sentiment %"),
        "Opportunity Size": items.reduce((sum, row) => sum + (Number(row["Opportunity Size"]) || 0), 0),
        "Eligible Segments": items.length,
      };
    });
  }

  function dimensionGraphRows(rows, analysis, view) {
    if (view === "__overview__") return dimensionGraphOverviewRows(rows, analysis);
    return (rows || []).filter((row) => String(row.Dimension || "") === String(view));
  }

  function dimensionGraphNumericFields(rows) {
    const excluded = new Set(["Dimension", "Dimension Value", "Confidence"]);
    return Array.from(new Set((rows || []).flatMap((row) => Object.keys(row || {}))))
      .filter((field) => !excluded.has(field) && (rows || []).some((row) => row[field] !== "" && row[field] !== null && row[field] !== undefined && Number.isFinite(Number(row[field]))));
  }

  function dimensionGraphValue(value, field) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "N/A";
    if (/volume|responses|segments|count/i.test(field) && !/%|rate|score|size/i.test(field)) return Math.round(numeric).toLocaleString();
    return numeric.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + (/%/.test(field) ? "%" : "");
  }

  function renderDimensionCustomGraph(dialog, sourceRows, analysis) {
    const view = dialog.querySelector("#dimensionGraphView")?.value || "__overview__";
    const primary = dialog.querySelector("#dimensionGraphPrimary")?.value || resultScoreName(analysis);
    const secondary = dialog.querySelector("#dimensionGraphSecondary")?.value || "__none__";
    const sort = dialog.querySelector("#dimensionGraphSort")?.value || "primary-desc";
    const limitValue = dialog.querySelector("#dimensionGraphLimit")?.value || "10";
    const svg = dialog.querySelector("#dimensionCustomGraphSvg");
    const summary = dialog.querySelector("#dimensionCustomGraphSummary");
    if (!svg) return;
    let data = dimensionGraphRows(sourceRows, analysis, view)
      .filter((row) => String(row["Dimension Value"] || row.Dimension || "").trim() && Number.isFinite(Number(row[primary])));
    const label = (row) => String(row["Dimension Value"] || row.Dimension || "Segment");
    data.sort((a, b) => {
      if (sort === "primary-asc") return Number(a[primary]) - Number(b[primary]);
      if (sort === "secondary-desc") return Number(b[secondary] || 0) - Number(a[secondary] || 0);
      if (sort === "alpha") return label(a).localeCompare(label(b));
      return Number(b[primary]) - Number(a[primary]);
    });
    const availableRows = data.length;
    if (limitValue !== "all") data = data.slice(0, Math.max(1, Number(limitValue) || 10));
    if (!data.length) {
      svg.setAttribute("viewBox", "0 0 900 260");
      svg.style.height = "260px";
      svg.innerHTML = '<text x="450" y="125" text-anchor="middle" fill="#60778b" font-size="14">No eligible numeric data is available for this graph selection.</text>';
      if (summary) summary.textContent = "Choose another field or dimension.";
      return;
    }
    const primaryValues = data.map((row) => Number(row[primary]));
    const rawMin = Math.min(...primaryValues);
    const rawMax = Math.max(...primaryValues);
    let min = rawMin < 0 ? rawMin : 0;
    let max = rawMax > 0 ? rawMax : 0;
    if (min === max) max = min + 1;
    const primaryRange = max - min;
    min -= primaryRange * 0.04;
    max += primaryRange * 0.08;
    const secondaryValues = secondary === "__none__" ? [] : data.map((row) => Number(row[secondary])).filter(Number.isFinite);
    const secondaryMin = secondaryValues.length ? Math.min(...secondaryValues) : 0;
    const secondaryMax = secondaryValues.length ? Math.max(...secondaryValues) : 1;
    const width = 900;
    const left = 190;
    const plotWidth = 500;
    const top = 64;
    const rowHeight = 32;
    const height = Math.max(285, top + data.length * rowHeight + 62);
    const x = (value) => left + ((Number(value) - min) / (max - min)) * plotWidth;
    const zeroX = x(Math.max(min, Math.min(max, 0)));
    const secondaryX = (value) => secondaryMax === secondaryMin ? left + plotWidth / 2 : left + ((Number(value) - secondaryMin) / (secondaryMax - secondaryMin)) * plotWidth;
    const ticks = Array.from({ length: 5 }, (_, index) => min + ((max - min) * index / 4));
    const tickHtml = ticks.map((value) => '<g><line x1="' + x(value) + '" y1="' + (top - 18) + '" x2="' + x(value) + '" y2="' + (top + data.length * rowHeight) + '" stroke="#dce9ee" stroke-width="1"></line><text x="' + x(value) + '" y="' + (top - 25) + '" text-anchor="middle" fill="#6b8092" font-size="10">' + safe(dimensionGraphValue(value, primary)) + '</text></g>').join("");
    const rowsHtml = data.map((row, index) => {
      const value = Number(row[primary]);
      const endX = x(value);
      const barX = Math.min(zeroX, endX);
      const barWidth = Math.max(3, Math.abs(endX - zeroX));
      const y = top + index * rowHeight;
      const secondaryValue = secondary === "__none__" ? null : Number(row[secondary]);
      return '<g><title>' + safe(label(row) + ": " + primary + " " + dimensionGraphValue(value, primary) + (Number.isFinite(secondaryValue) ? ", " + secondary + " " + dimensionGraphValue(secondaryValue, secondary) : "")) + '</title>'
        + '<text x="12" y="' + (y + 15) + '" fill="#17324b" font-size="11">' + safe(label(row).slice(0, 29)) + '</text>'
        + '<rect x="' + barX + '" y="' + y + '" width="' + barWidth + '" height="16" rx="8" fill="#27b8b2" opacity="0.82"></rect>'
        + (Number.isFinite(secondaryValue) ? '<circle cx="' + secondaryX(secondaryValue) + '" cy="' + (y + 8) + '" r="5" fill="#e68a2e" stroke="#fff" stroke-width="2"></circle>' : '')
        + '<text x="710" y="' + (y + 14) + '" fill="#17324b" font-size="10">' + safe(dimensionGraphValue(value, primary)) + (Number.isFinite(secondaryValue) ? '  |  ' + safe(dimensionGraphValue(secondaryValue, secondary)) : '') + '</text></g>';
    }).join("");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.style.height = Math.min(640, Math.max(300, height)) + "px";
    svg.innerHTML = tickHtml
      + '<line x1="' + zeroX + '" y1="' + (top - 15) + '" x2="' + zeroX + '" y2="' + (top + data.length * rowHeight) + '" stroke="#67879a" stroke-width="1.2"></line>'
      + '<g><rect x="12" y="18" width="12" height="12" rx="4" fill="#27b8b2"></rect><text x="31" y="28" fill="#17324b" font-size="11">' + safe(primary) + '</text>'
      + (secondary !== "__none__" ? '<circle cx="220" cy="24" r="5" fill="#e68a2e"></circle><text x="232" y="28" fill="#17324b" font-size="11">' + safe(secondary) + ' (independent scale)</text>' : '') + '</g>'
      + rowsHtml;
    if (summary) summary.textContent = (view === "__overview__" ? "High-Level Summary" : view) + " · " + data.length + " of " + availableRows + " eligible rows shown · bars: " + primary + (secondary !== "__none__" ? " · dots: " + secondary : "");
  }

  function openDimensionCustomGraph(rows, analysis, initialView) {
    document.querySelector(".dimension-callout-graph-overlay")?.remove();
    const dimensions = Array.from(new Set((rows || []).map((row) => String(row.Dimension || "").trim()).filter(Boolean))).sort();
    if (!dimensions.length) return;
    const overlay = document.createElement("div");
    overlay.className = "dimension-callout-graph-overlay";
    overlay.innerHTML = '<section class="dimension-callout-graph-dialog" role="dialog" aria-modal="true" aria-label="Custom dimension graph">'
      + '<button class="dimension-callout-graph-close" type="button" aria-label="Close">x</button>'
      + '<div class="dimension-callout-graph-head"><div><p class="eyebrow">Dimension Intelligence</p><h2>Custom Graph</h2><p>Choose the view and fields relevant to your audience.</p></div></div>'
      + '<div class="dimension-callout-graph-controls">'
      + '<label>View<select id="dimensionGraphView"><option value="__overview__">High-Level Summary</option>' + dimensions.map((item) => '<option value="' + safe(item) + '">' + safe(item) + '</option>').join("") + '</select></label>'
      + '<label>Primary field<select id="dimensionGraphPrimary"></select></label>'
      + '<label>Comparison field<select id="dimensionGraphSecondary"></select></label>'
      + '<label>Order<select id="dimensionGraphSort"><option value="primary-desc">Primary: high to low</option><option value="primary-asc">Primary: low to high</option><option value="secondary-desc">Comparison: high to low</option><option value="alpha">Alphabetical</option></select></label>'
      + '<label>Rows<select id="dimensionGraphLimit"><option value="8">Top 8</option><option value="10" selected>Top 10</option><option value="15">Top 15</option><option value="20">Top 20</option><option value="all">All eligible</option></select></label>'
      + '</div><p id="dimensionCustomGraphSummary" class="dimension-callout-graph-summary"></p>'
      + '<div class="dimension-callout-graph-canvas"><svg id="dimensionCustomGraphSvg" role="img" aria-label="Custom dimension comparison graph"></svg></div>'
      + '<p class="dimension-callout-graph-note">Only eligible analyzed values are plotted. The comparison dots use an independent scale and should be interpreted with their data labels.</p>'
      + '</section>';
    document.body.appendChild(overlay);
    const dialog = overlay.querySelector(".dimension-callout-graph-dialog");
    const viewSelect = dialog.querySelector("#dimensionGraphView");
    const primarySelect = dialog.querySelector("#dimensionGraphPrimary");
    const secondarySelect = dialog.querySelector("#dimensionGraphSecondary");
    viewSelect.value = initialView && initialView !== "__summary__" && dimensions.includes(initialView) ? initialView : "__overview__";
    const refreshFields = () => {
      const graphRows = dimensionGraphRows(rows, analysis, viewSelect.value);
      const fields = dimensionGraphNumericFields(graphRows);
      const score = resultScoreName(analysis);
      const previousPrimary = primarySelect.value;
      const primary = fields.includes(previousPrimary) ? previousPrimary : fields.includes(score) ? score : fields[0] || "";
      primarySelect.innerHTML = fields.map((field) => '<option value="' + safe(field) + '">' + safe(field) + '</option>').join("");
      primarySelect.value = primary;
      const previousSecondary = secondarySelect.value;
      secondarySelect.innerHTML = '<option value="__none__">None</option>' + fields.filter((field) => field !== primary).map((field) => '<option value="' + safe(field) + '">' + safe(field) + '</option>').join("");
      secondarySelect.value = previousSecondary && Array.from(secondarySelect.options).some((option) => option.value === previousSecondary) ? previousSecondary : (fields.includes("Volume") && primary !== "Volume" ? "Volume" : "__none__");
      renderDimensionCustomGraph(dialog, rows, analysis);
    };
    viewSelect.addEventListener("change", refreshFields);
    primarySelect.addEventListener("change", refreshFields);
    [secondarySelect, dialog.querySelector("#dimensionGraphSort"), dialog.querySelector("#dimensionGraphLimit")].forEach((control) => control?.addEventListener("change", () => renderDimensionCustomGraph(dialog, rows, analysis)));
    const close = () => overlay.remove();
    overlay.querySelector(".dimension-callout-graph-close")?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
    refreshFields();
  }

  function renderQuestionCards(container, model) {
    if (!container) return;
    container.innerHTML = model.questions.map((item) => '<article class="dimension-callout-card dimension-question-card ' + (item.answered ? "answered" : "insufficient") + '" data-dimension-question="' + item.number + '" tabindex="0">'
      + '<div class="dimension-callout-card-head"><span class="dimension-callout-icon">' + String(item.number).padStart(2, "0") + '</span><h3>' + safe(item.question) + '</h3><span class="dimension-question-status">' + safe(item.evidence) + '</span></div>'
      + '<div class="dimension-question-answer"><span>Answer</span><p>' + safe(item.answer) + '</p></div>'
      + '</article>').join("");
    container.querySelectorAll("[data-dimension-question]").forEach((card) => {
      const item = model.questions.find((question) => question.number === Number(card.dataset.dimensionQuestion));
      if (!item) return;
      card.addEventListener("dblclick", () => openDetail(item, model.minimumSample));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail(item, model.minimumSample);
        }
      });
    });
  }

  function render(rows, analysis) {
    const container = document.getElementById("resultDimensionCallouts");
    const meta = document.getElementById("resultDimensionCalloutMeta");
    const select = document.getElementById("resultDimensionQuestionSelect");
    const graphButton = document.getElementById("resultDimensionCalloutGraphButton");
    if (!container) return;
    const payload = analysis || state.analysis || {};
    const sourceRows = rows || [];
    if (graphButton) {
      graphButton.disabled = !sourceRows.length;
      graphButton.onclick = () => openDimensionCustomGraph(sourceRows, payload, select?.value || "__summary__");
    }
    if (!select) {
      const model = questionModel(sourceRows, payload);
      if (meta) meta.textContent = model.answeredCount + " of 10 high-level questions answered - minimum sample " + model.minimumSample + ".";
      renderQuestionCards(container, model);
      return;
    }
    const dimensions = configuredColumns(payload).map((column) => ({ value: resultDimensionDisplayName(column), raw: column }))
      .filter((item, index, items) => item.value && items.findIndex((candidate) => candidate.value === item.value) === index);
    const previous = select.value || "__summary__";
    select.innerHTML = '<option value="__summary__">High-Level Summary</option>'
      + dimensions.map((item) => '<option value="' + safe(item.value) + '">' + safe(item.value) + '</option>').join("");
    if (previous === "__summary__" || dimensions.some((item) => item.value === previous)) select.value = previous;
    const renderSelected = () => {
      const selected = select.value;
      const isSummary = selected === "__summary__";
      const selectedModel = questionModel(sourceRows, payload, isSummary ? "" : selected);
      if (meta) meta.textContent = selectedModel.answeredCount + " of 10 " + (isSummary ? "high-level questions" : "questions for " + selected) + " answered - minimum sample " + selectedModel.minimumSample + ".";
      renderQuestionCards(container, selectedModel);
    };
    select.onchange = renderSelected;
    renderSelected();
  }

  function boardroomEvidence(rows, analysis, limit = 5) {
    const payload = analysis || {};
    const maximum = Math.max(1, Math.min(5, Number(limit) || 5));
    const dimensions = configuredColumns(payload)
      .map((column) => resultDimensionDisplayName(column))
      .filter((dimension, index, items) => dimension && items.indexOf(dimension) === index);
    return dimensions.map((dimension) => {
      const model = questionModel(rows || [], payload, dimension);
      const questions = model.questions
        .filter((item) => item.answered && /^Strong\b/i.test(String(item.evidence || "")))
        .slice(0, maximum)
        .map((item) => ({
          number: item.number,
          key: item.key,
          question: item.question,
          answer: item.answer,
          evidence: item.evidence,
          method: item.method,
          formula: item.formula,
        }));
      return { dimension, minimumSample: model.minimumSample, questions };
    });
  }

  window.renderDimensionIntelligenceCallouts = render;
  window.dimensionIntelligenceQuestionModel = questionModel;
  window.dimensionIntelligenceGraphRows = dimensionGraphRows;
  window.dimensionIntelligenceGraphFields = dimensionGraphNumericFields;
  window.dimensionIntelligenceBoardroomEvidence = boardroomEvidence;
})();
