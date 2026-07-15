/**
 * Context Builder utility for DataSense
 * Consolidates the building of AI prompts and contexts for all supported file types.
 */

/**
 * Builds context for CSV question-answering
 */
export function buildCSVContext(columns, columnTypes, eda, rows) {
  let ctx = `Dataset Overview:\n`;
  ctx += `- Total rows: ${eda.overview.totalRows}\n`;
  ctx += `- Total columns: ${eda.overview.totalCols}\n\n`;

  ctx += `Columns & Key Stats:\n`;
  columns.forEach(col => {
    const type = columnTypes[col];
    ctx += `- ${col} (${type}): `;
    if (type === 'numeric' && eda.numericStats[col]) {
      const stats = eda.numericStats[col];
      ctx += `Min=${stats.min}, Max=${stats.max}, Mean=${stats.mean.toFixed(2)}, Median=${stats.median}\n`;
    } else if (eda.categoricalStats[col]) {
      const stats = eda.categoricalStats[col];
      const topVals = stats.topValues.map(v => `"${v.value}" (${v.count})`).join(', ');
      ctx += `UniqueCount=${stats.uniqueCount}, TopFreqValues=[${topVals}]\n`;
    } else {
      ctx += `UniqueCount=${eda.categoricalStats[col]?.uniqueCount || 0}\n`;
    }
  });

  ctx += `\nFirst 10 Rows (Readable Text):\n`;
  const previewRows = rows.slice(0, 10);
  previewRows.forEach((row, idx) => {
    ctx += `Row ${idx + 1}: ${JSON.stringify(row)}\n`;
  });

  const words = ctx.split(/\s+/);
  if (words.length > 400) {
    return words.slice(0, 400).join(' ') + '\n... [truncated]';
  }
  return ctx;
}




/**
 * Builds the notebook cell explanation prompt context
 */
export function buildNotebookContext(index, source, outputText, previousImports = []) {
  const importsText = previousImports.length > 0 
    ? previousImports.slice(0, 8).join(', ') 
    : 'None';

  const sourceClean = (source || '').slice(0, 300);
  const outputClean = (outputText || '').trim().slice(0, 200);

  let prompt = `Python notebook cell [${index}].\n`;
  prompt += `Imports used so far: [${importsText}].\n`;
  prompt += `Current cell code:\n${sourceClean}\n`;
  if (outputClean && outputClean !== '') {
    prompt += `Output: ${outputClean}\n`;
  }
  prompt += `Explain what this cell does in 2-3 simple sentences for a beginner data science student.`;
  return prompt;
}
