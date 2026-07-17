/**
 * Natural Language Query Engine for DataSense
 * Understands human questions about CSV data and computes answers directly.
 * Falls back gracefully with a helpful context string for the AI model.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (typeof n !== 'number' || isNaN(n)) return String(n);
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function normalize(str) {
  return String(str || '').toLowerCase().trim();
}

/** Find all column names mentioned in the question (fuzzy word match) */
function findMentionedColumns(q, columns) {
  const lq = normalize(q);
  return columns.filter(col => {
    const lc = normalize(col);
    // Direct substring match or word-level match
    if (lq.includes(lc)) return true;
    // Match individual words of multi-word column names
    const words = lc.split(/[\s_-]+/);
    return words.length > 1 && words.every(w => w.length > 2 && lq.includes(w));
  });
}

/** Detect the primary intent from the question */
function detectIntent(q) {
  const lq = normalize(q);

  if (/\b(how many|count|number of|total count|frequency|occurrenc)\b/.test(lq)) return 'count';
  if (/\b(sum|total|add up|combined|aggregate)\b/.test(lq)) return 'sum';
  if (/\b(average|avg|mean|typical|usual|expected)\b/.test(lq)) return 'average';
  if (/\b(median|middle value)\b/.test(lq)) return 'median';
  if (/\b(max|maximum|highest|largest|biggest|most|peak|top)\b/.test(lq)) return 'max';
  if (/\b(min|minimum|lowest|smallest|least|bottom)\b/.test(lq)) return 'min';
  if (/\b(range|spread|difference between max and min)\b/.test(lq)) return 'range';
  if (/\b(distribution|histogram|spread|how.*distributed)\b/.test(lq)) return 'distribution';
  if (/\b(trend|over time|monthly|yearly|by month|by year|growth)\b/.test(lq)) return 'trend';
  if (/\b(correlation|relationship|relate|compare|vs\.?|versus|against)\b/.test(lq)) return 'correlation';
  if (/\b(unique|distinct|categories|category|values|breakdown)\b/.test(lq)) return 'unique';
  if (/\b(missing|null|empty|blank|na)\b/.test(lq)) return 'missing';
  if (/\b(top|best|highest|most popular|leading|rank)\b/.test(lq)) return 'top';
  if (/\b(outlier|anomal|unusual)\b/.test(lq)) return 'outlier';
  if (/\b(overview|summary|describe|about|what.*columns|how.*rows|size|shape)\b/.test(lq)) return 'overview';

  return null;
}

/** Pick the best numeric column for a question */
function pickNumericColumn(mentionedCols, allNumericCols, edaResult) {
  // Prefer mentioned cols that are numeric
  const mentioned = mentionedCols.filter(c => edaResult.numericStats[c]);
  if (mentioned.length > 0) return mentioned[0];
  return allNumericCols[0] || null;
}

/** Pick the best categorical column for a question */
function pickCategoricalColumn(mentionedCols, allCatCols, edaResult) {
  const mentioned = mentionedCols.filter(c => edaResult.categoricalStats[c]);
  if (mentioned.length > 0) return mentioned[0];
  return allCatCols[0] || null;
}

// ── Main answering function ───────────────────────────────────────────────────

/**
 * Try to answer a natural language question directly from the data.
 * @param {string} question
 * @param {Object} parsedData  - { rows, columns, columnTypes, edaResult, aiContext }
 * @returns {{ answer: string, confidence: 'high'|'medium'|'low' } | null}
 */
export function answerLocally(question, parsedData) {
  const { rows, columns, edaResult } = parsedData;
  if (!rows || !columns || !edaResult) return null;

  const q = normalize(question);
  const mentionedCols = findMentionedColumns(q, columns);
  const intent = detectIntent(q);

  const numericCols = columns.filter(c => edaResult.numericStats[c]);
  const categoricalCols = columns.filter(c => edaResult.categoricalStats[c]);

  // ── Overview / dataset info ───────────────────────────────────────────────
  if (intent === 'overview' || (!intent && q.includes('row')) || q.includes('column') || q.includes('dataset')) {
    const { totalRows, totalCols, numericCount, categoricalCount, totalMissing } = edaResult.overview;
    return {
      answer: `This dataset has **${fmt(totalRows)} rows** and **${fmt(totalCols)} columns** — ${numericCount} numeric and ${categoricalCount} categorical. There are ${totalMissing} missing values in total.\n\nColumns: ${columns.join(', ')}.`,
      confidence: 'high'
    };
  }

  // ── Missing values ────────────────────────────────────────────────────────
  if (intent === 'missing') {
    const col = mentionedCols[0];
    if (col && edaResult.missingAnalysis[col] !== undefined) {
      const missing = edaResult.missingAnalysis[col]?.count ?? edaResult.missingAnalysis[col];
      return {
        answer: `The **${col}** column has **${fmt(missing)} missing value(s)** out of ${fmt(edaResult.overview.totalRows)} rows.`,
        confidence: 'high'
      };
    }
    const { totalMissing } = edaResult.overview;
    const missingDetails = Object.entries(edaResult.missingAnalysis || {})
      .filter(([, v]) => (v?.count ?? v) > 0)
      .map(([c, v]) => `${c}: ${v?.count ?? v}`)
      .join(', ');
    return {
      answer: `There are **${fmt(totalMissing)} missing values** in total across the dataset${missingDetails ? `. Breakdown — ${missingDetails}` : ''}.`,
      confidence: 'high'
    };
  }

  // ── Unique / category breakdown ───────────────────────────────────────────
  if (intent === 'unique') {
    const col = pickCategoricalColumn(mentionedCols, categoricalCols, edaResult) ||
                mentionedCols[0];
    if (col && edaResult.categoricalStats[col]) {
      const stats = edaResult.categoricalStats[col];
      const topList = (stats.topValues || []).slice(0, 5).map(v => `**${v.value}** (${v.count}×)`).join(', ');
      return {
        answer: `**${col}** has **${fmt(stats.uniqueCount)} unique values**. Top values: ${topList}.`,
        confidence: 'high'
      };
    }
  }

  // ── Count ─────────────────────────────────────────────────────────────────
  if (intent === 'count') {
    const col = mentionedCols[0];
    if (col && edaResult.categoricalStats[col]) {
      const stats = edaResult.categoricalStats[col];
      return {
        answer: `There are **${fmt(stats.uniqueCount)} unique categories** in **${col}**. Total row count: **${fmt(edaResult.overview.totalRows)}**.`,
        confidence: 'high'
      };
    }
    return {
      answer: `The dataset has **${fmt(edaResult.overview.totalRows)} rows**.`,
      confidence: 'high'
    };
  }

  // ── Average ───────────────────────────────────────────────────────────────
  if (intent === 'average') {
    const col = pickNumericColumn(mentionedCols, numericCols, edaResult);
    if (col) {
      const s = edaResult.numericStats[col];
      return {
        answer: `The **average (mean)** of **${col}** is **${fmt(s.mean)}**. (Median: ${fmt(s.median)}, Range: ${fmt(s.min)} – ${fmt(s.max)})`,
        confidence: 'high'
      };
    }
    if (numericCols.length > 0) {
      const lines = numericCols.map(c => `**${c}**: mean = ${fmt(edaResult.numericStats[c].mean)}`).join('\n');
      return { answer: `Here are the averages for all numeric columns:\n${lines}`, confidence: 'high' };
    }
  }

  // ── Sum ───────────────────────────────────────────────────────────────────
  if (intent === 'sum') {
    const col = pickNumericColumn(mentionedCols, numericCols, edaResult);
    if (col) {
      const total = rows.reduce((acc, r) => {
        const v = parseFloat(r[col]);
        return acc + (isNaN(v) ? 0 : v);
      }, 0);
      return {
        answer: `The **total sum** of **${col}** is **${fmt(total)}**.`,
        confidence: 'high'
      };
    }
    if (numericCols.length > 0) {
      const lines = numericCols.map(c => {
        const total = rows.reduce((acc, r) => acc + (parseFloat(r[c]) || 0), 0);
        return `**${c}**: ${fmt(total)}`;
      }).join('\n');
      return { answer: `Here are the totals for all numeric columns:\n${lines}`, confidence: 'high' };
    }
  }

  // ── Max ───────────────────────────────────────────────────────────────────
  if (intent === 'max' || (intent === 'top' && mentionedCols.some(c => edaResult.numericStats[c]))) {
    const col = pickNumericColumn(mentionedCols, numericCols, edaResult);
    if (col) {
      const s = edaResult.numericStats[col];
      // Find the row with the max value
      const maxRow = rows.reduce((best, r) => {
        const v = parseFloat(r[col]);
        return (!isNaN(v) && (best === null || v > parseFloat(best[col]))) ? r : best;
      }, null);
      let extra = '';
      if (maxRow) {
        const catCol = categoricalCols[0];
        if (catCol && maxRow[catCol] !== undefined) extra = ` (in row where ${catCol} = "${maxRow[catCol]}")`;
      }
      return {
        answer: `The **maximum** value of **${col}** is **${fmt(s.max)}**${extra}.`,
        confidence: 'high'
      };
    }
  }

  // ── Min ───────────────────────────────────────────────────────────────────
  if (intent === 'min') {
    const col = pickNumericColumn(mentionedCols, numericCols, edaResult);
    if (col) {
      const s = edaResult.numericStats[col];
      return {
        answer: `The **minimum** value of **${col}** is **${fmt(s.min)}**.`,
        confidence: 'high'
      };
    }
  }

  // ── Median ────────────────────────────────────────────────────────────────
  if (intent === 'median') {
    const col = pickNumericColumn(mentionedCols, numericCols, edaResult);
    if (col) {
      const s = edaResult.numericStats[col];
      return {
        answer: `The **median** of **${col}** is **${fmt(s.median)}**.`,
        confidence: 'high'
      };
    }
  }

  // ── Range ─────────────────────────────────────────────────────────────────
  if (intent === 'range') {
    const col = pickNumericColumn(mentionedCols, numericCols, edaResult);
    if (col) {
      const s = edaResult.numericStats[col];
      return {
        answer: `The **range** of **${col}** is **${fmt(s.max - s.min)}** (from ${fmt(s.min)} to ${fmt(s.max)}).`,
        confidence: 'high'
      };
    }
  }

  // ── Top N categories ──────────────────────────────────────────────────────
  if (intent === 'top') {
    const col = pickCategoricalColumn(mentionedCols, categoricalCols, edaResult);
    const numCol = pickNumericColumn(mentionedCols, numericCols, edaResult);

    if (col && numCol) {
      // Group and aggregate
      const groupMap = {};
      rows.forEach(r => {
        const key = String(r[col] ?? 'Unknown');
        const val = parseFloat(r[numCol]);
        if (!isNaN(val)) {
          groupMap[key] = (groupMap[key] || 0) + val;
        }
      });
      const sorted = Object.entries(groupMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const list = sorted.map(([k, v], i) => `${i + 1}. **${k}** — ${fmt(v)}`).join('\n');
      return {
        answer: `Top categories in **${col}** by **${numCol}** (total):\n${list}`,
        confidence: 'high'
      };
    }

    if (col) {
      const stats = edaResult.categoricalStats[col];
      const list = (stats?.topValues || []).slice(0, 5).map((v, i) => `${i + 1}. **${v.value}** — ${v.count} times`).join('\n');
      return {
        answer: `Most frequent values in **${col}**:\n${list}`,
        confidence: 'high'
      };
    }
  }

  // ── Distribution ──────────────────────────────────────────────────────────
  if (intent === 'distribution') {
    const col = pickNumericColumn(mentionedCols, numericCols, edaResult);
    if (col) {
      const s = edaResult.numericStats[col];
      return {
        answer: `**Distribution of ${col}:**\n- Min: ${fmt(s.min)}\n- Max: ${fmt(s.max)}\n- Mean: ${fmt(s.mean)}\n- Median: ${fmt(s.median)}\n- Std Dev: ${fmt(s.stdDev)}\n- Outliers: ${s.outlierCount || 0}\n\nA histogram chart is shown below.`,
        confidence: 'high'
      };
    }
  }

  // ── Correlation ───────────────────────────────────────────────────────────
  if (intent === 'correlation') {
    const numMentioned = mentionedCols.filter(c => edaResult.numericStats[c]);
    const c1 = numMentioned[0] || numericCols[0];
    const c2 = numMentioned[1] || numericCols[1];
    if (c1 && c2) {
      // Compute Pearson correlation
      const pairs = rows.map(r => [parseFloat(r[c1]), parseFloat(r[c2])]).filter(([a, b]) => !isNaN(a) && !isNaN(b));
      const n = pairs.length;
      if (n > 1) {
        const meanA = pairs.reduce((s, [a]) => s + a, 0) / n;
        const meanB = pairs.reduce((s, [, b]) => s + b, 0) / n;
        const num = pairs.reduce((s, [a, b]) => s + (a - meanA) * (b - meanB), 0);
        const denA = Math.sqrt(pairs.reduce((s, [a]) => s + (a - meanA) ** 2, 0));
        const denB = Math.sqrt(pairs.reduce((s, [, b]) => s + (b - meanB) ** 2, 0));
        const r = (denA && denB) ? num / (denA * denB) : 0;
        const strength = Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.4 ? 'moderate' : 'weak';
        const direction = r > 0 ? 'positive' : 'negative';
        return {
          answer: `The Pearson correlation between **${c1}** and **${c2}** is **${r.toFixed(3)}** — a ${strength} ${direction} relationship.`,
          confidence: 'high'
        };
      }
    }
  }

  // ── Trend ─────────────────────────────────────────────────────────────────
  if (intent === 'trend') {
    const numCol = pickNumericColumn(mentionedCols, numericCols, edaResult);
    const catCol = pickCategoricalColumn(mentionedCols, categoricalCols, edaResult);
    if (numCol && catCol) {
      const groupMap = {};
      rows.forEach(r => {
        const key = String(r[catCol] ?? 'Unknown');
        const val = parseFloat(r[numCol]);
        if (!isNaN(val)) {
          if (!groupMap[key]) groupMap[key] = [];
          groupMap[key].push(val);
        }
      });
      const entries = Object.entries(groupMap).slice(0, 24);
      const list = entries.map(([k, vals]) => {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return `**${k}**: ${fmt(avg)}`;
      }).join(', ');
      return {
        answer: `**${numCol}** trend by **${catCol}**: ${list}`,
        confidence: 'high'
      };
    }
  }

  // ── Outlier ───────────────────────────────────────────────────────────────
  if (intent === 'outlier') {
    const col = pickNumericColumn(mentionedCols, numericCols, edaResult);
    if (col) {
      const s = edaResult.numericStats[col];
      return {
        answer: `**${col}** has **${s.outlierCount || 0} detected outlier(s)**. Values outside the normal range (beyond 1.5× IQR from quartiles) are considered outliers. Min: ${fmt(s.min)}, Max: ${fmt(s.max)}, Mean: ${fmt(s.mean)}.`,
        confidence: 'high'
      };
    }
  }

  // ── Column-only question (no clear intent but column mentioned) ───────────
  if (mentionedCols.length > 0) {
    const col = mentionedCols[0];
    if (edaResult.numericStats[col]) {
      const s = edaResult.numericStats[col];
      return {
        answer: `Here's a summary of **${col}**:\n- Min: ${fmt(s.min)}\n- Max: ${fmt(s.max)}\n- Mean: ${fmt(s.mean)}\n- Median: ${fmt(s.median)}\n- Std Dev: ${fmt(s.stdDev)}\n- Outliers: ${s.outlierCount || 0}`,
        confidence: 'medium'
      };
    }
    if (edaResult.categoricalStats[col]) {
      const stats = edaResult.categoricalStats[col];
      const topList = (stats.topValues || []).slice(0, 5).map(v => `**${v.value}** (${v.count})`).join(', ');
      return {
        answer: `**${col}** has **${fmt(stats.uniqueCount)} unique values**. Top values: ${topList}.`,
        confidence: 'medium'
      };
    }
  }

  return null; // No local answer — fall back to AI
}

/**
 * Build a richer AI context that includes pre-computed facts,
 * making it easier for the extractive QA model to find answers.
 */
export function buildRichAIContext(parsedData) {
  const { rows, columns, edaResult } = parsedData;

  let ctx = '';

  ctx += `DATASET FACTS:\n`;
  ctx += `Total rows: ${edaResult.overview.totalRows}. Total columns: ${edaResult.overview.totalCols}.\n`;
  ctx += `Columns: ${columns.join(', ')}.\n\n`;

  // Numeric stats as sentences
  Object.entries(edaResult.numericStats || {}).forEach(([col, s]) => {
    const total = rows.reduce((acc, r) => acc + (parseFloat(r[col]) || 0), 0);
    ctx += `${col}: minimum is ${fmt(s.min)}, maximum is ${fmt(s.max)}, average is ${fmt(s.mean)}, median is ${fmt(s.median)}, total sum is ${fmt(total)}, standard deviation is ${fmt(s.stdDev)}, outlier count is ${s.outlierCount || 0}.\n`;
  });

  // Categorical stats as sentences
  Object.entries(edaResult.categoricalStats || {}).forEach(([col, s]) => {
    const topVals = (s.topValues || []).slice(0, 3).map(v => `${v.value} (${v.count} times)`).join(', ');
    ctx += `${col}: has ${s.uniqueCount} unique values. Most frequent values are: ${topVals}.\n`;
  });

  // Missing values
  const missingCols = Object.entries(edaResult.missingAnalysis || {}).filter(([, v]) => (v?.count ?? v) > 0);
  if (missingCols.length > 0) {
    ctx += `Missing values: ${missingCols.map(([c, v]) => `${c} has ${v?.count ?? v} missing`).join(', ')}.\n`;
  } else {
    ctx += `No missing values in this dataset.\n`;
  }

  // First 5 rows
  ctx += `\nSAMPLE ROWS:\n`;
  rows.slice(0, 5).forEach((row, i) => {
    ctx += `Row ${i + 1}: ${Object.entries(row).map(([k, v]) => `${k}=${v}`).join(', ')}.\n`;
  });

  const words = ctx.split(/\s+/);
  if (words.length > 600) return words.slice(0, 600).join(' ') + ' [truncated]';
  return ctx;
}
