import Papa from 'papaparse';
import { runFullEDA, detectColumnType } from '../utils/edaEngine';

/**
 * Parse CSV file and build summary + AI context
 * @param {File} file 
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error("Failed to parse CSV. Please ensure it is a valid format."));
          return;
        }

        const rows = results.data;
        if (!rows || rows.length === 0) {
          reject(new Error("This file appears to be empty."));
          return;
        }

        const columns = results.meta.fields || [];
        // PapaParse metadata fields can be empty if there are no headers
        if (columns.length === 0 || (columns.length === 1 && columns[0] === "")) {
          reject(new Error("This CSV has no column headers. Please add a header row."));
          return;
        }

        // Handle CSVs with more than 500 columns (summarize only the first 500)
        const limitedColumns = columns.slice(0, 500);

        // Detect data types per column
        const columnTypes = {};
        limitedColumns.forEach(col => {
          const vals = rows.map(r => r[col]);
          columnTypes[col] = detectColumnType(vals);
        });

        // Build data summary and execute EDA operations
        const edaResult = runFullEDA(rows, limitedColumns, columnTypes);

        // Build AI context string (max 400 words)
        const aiContext = buildCSVAIContext(limitedColumns, columnTypes, edaResult, rows);

        resolve({
          rows,
          columns: limitedColumns,
          columnTypes,
          edaResult,
          aiContext
        });
      },
      error: (err) => {
        reject(new Error("Failed to parse CSV: " + err.message));
      }
    });
  });
}

/**
 * Builds the AI context string (max 400 words) from column types, stats and first rows
 */
function buildCSVAIContext(columns, columnTypes, eda, rows) {
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

  // Strict check to keep word count under 400 words
  const words = ctx.split(/\s+/);
  if (words.length > 400) {
    return words.slice(0, 400).join(' ') + '\n... [truncated]';
  }
  return ctx;
}
