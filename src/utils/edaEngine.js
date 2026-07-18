/**
 * EDA Calculations Engine for DataSense
 */

// Helper to calculate median
export function calculateMedian(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Helper to calculate standard deviation
export function calculateStdDev(values, mean) {
  if (values.length <= 1) return 0;
  const sumOfSquares = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  return Math.sqrt(sumOfSquares / (values.length - 1)); // sample standard deviation
}

// Helper to detect outliers using IQR method
export function detectOutliers(values) {
  if (values.length < 4) return { count: 0, bounds: { lower: -Infinity, upper: Infinity } };
  const sorted = [...values].sort((a, b) => a - b);
  
  // Calculate percentiles
  const getPercentile = (p) => {
    const idx = (sorted.length - 1) * p;
    const base = Math.floor(idx);
    const rest = idx - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outlierValues = values.filter(v => v < lowerBound || v > upperBound);
  return {
    count: outlierValues.length,
    bounds: { lower: lowerBound, upper: upperBound }
  };
}

// Pearson correlation coefficient formula:
// r = sum((x - meanX) * (y - meanY)) / sqrt(sum((x - meanX)^2) * sum((y - meanY)^2))
export function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let num = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

// Function to detect type for a column
export function detectColumnType(values) {
  const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'categorical';

  let numericCount = 0;
  let dateCount = 0;

  for (const val of nonNulls) {
    if (typeof val === 'number') {
      numericCount++;
    } else if (typeof val === 'boolean') {
      // booleans can be treated as categorical
    } else if (typeof val === 'string') {
      // If it looks like a number
      if (val.trim() !== '' && !isNaN(val) && !isNaN(parseFloat(val))) {
        numericCount++;
      } else {
        // If it looks like a date string (basic check: can it parse, has length > 5, has non-numbers like -, / or :)
        const dateParsed = Date.parse(val);
        if (!isNaN(dateParsed) && val.length > 5 && isNaN(val) && /[-/:]/.test(val)) {
          dateCount++;
        }
      }
    }
  }

  const total = nonNulls.length;
  if (numericCount / total > 0.7) return 'numeric';
  if (dateCount / total > 0.7) return 'date';
  return 'categorical';
}

/**
 * Perform full EDA on parsed CSV rows
 * @param {Array<Object>} rows 
 * @param {Array<string>} columns 
 * @param {Object} columnTypes 
 */
export function runFullEDA(rows, columns, columnTypes) {
  const totalRows = rows.length;
  const totalCols = columns.length;
  
  // Count types
  let numericCount = 0;
  let categoricalCount = 0;
  let dateCount = 0;
  
  Object.values(columnTypes).forEach(type => {
    if (type === 'numeric') numericCount++;
    else if (type === 'date') dateCount++;
    else categoricalCount++;
  });

  // Calculate missing values analysis
  let totalMissing = 0;
  const missingAnalysis = {};
  
  columns.forEach(col => {
    let missing = 0;
    rows.forEach(row => {
      const val = row[col];
      if (val === null || val === undefined || val === '') {
        missing++;
      }
    });
    totalMissing += missing;
    const percentage = totalRows > 0 ? (missing / totalRows) * 100 : 0;
    missingAnalysis[col] = {
      count: missing,
      percentage: percentage,
      flag: percentage > 20
    };
  });

  // Calculate stats for columns
  const numericStats = {};
  const categoricalStats = {};

  columns.forEach(col => {
    const type = columnTypes[col];
    const nonNullValues = rows
      .map(row => row[col])
      .filter(val => val !== null && val !== undefined && val !== '');
      
    // Common: Unique count
    const uniqueValues = new Set(nonNullValues);
    const uniqueCount = uniqueValues.size;

    if (type === 'numeric') {
      // Coerce all to number
      const numbers = nonNullValues.map(v => typeof v === 'number' ? v : parseFloat(v)).filter(v => !isNaN(v));
      if (numbers.length > 0) {
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / numbers.length;
        const median = calculateMedian(numbers);
        const stdDev = calculateStdDev(numbers, mean);
        const outlierInfo = detectOutliers(numbers);

        numericStats[col] = {
          min,
          max,
          mean,
          median,
          stdDev,
          outlierCount: outlierInfo.count,
          uniqueCount
        };
      } else {
        numericStats[col] = { min: 0, max: 0, mean: 0, median: 0, stdDev: 0, outlierCount: 0, uniqueCount: 0 };
      }
    } else {
      // Categorical (or Date treated as categorical for frequencies)
      const frequencies = {};
      nonNullValues.forEach(val => {
        const valStr = String(val);
        frequencies[valStr] = (frequencies[valStr] || 0) + 1;
      });

      const sortedFreqs = Object.entries(frequencies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));

      categoricalStats[col] = {
        uniqueCount,
        topValues: sortedFreqs
      };
    }
  });

  // Pearson correlation matrix
  const correlationMatrix = {};
  const numericCols = columns.filter(col => columnTypes[col] === 'numeric');

  // Pre-parse numeric values to prevent O(N^2 * R) redundant parse/type-checks
  const parsedNumericRows = [];
  rows.forEach(row => {
    const pRow = {};
    let hasData = false;
    numericCols.forEach(col => {
      const val = row[col];
      if (val !== null && val !== undefined && val !== '') {
        const num = typeof val === 'number' ? val : parseFloat(val);
        if (!isNaN(num)) {
          pRow[col] = num;
          hasData = true;
        }
      }
    });
    if (hasData) {
      parsedNumericRows.push(pRow);
    }
  });

  // Initialize matrix
  numericCols.forEach(col => {
    correlationMatrix[col] = {};
  });

  // Calculate correlation symmetric half only
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i; j < numericCols.length; j++) {
      const col1 = numericCols[i];
      const col2 = numericCols[j];

      if (i === j) {
        correlationMatrix[col1][col2] = 1.0;
      } else {
        const x = [];
        const y = [];
        for (let r = 0; r < parsedNumericRows.length; r++) {
          const pRow = parsedNumericRows[r];
          if (pRow[col1] !== undefined && pRow[col2] !== undefined) {
            x.push(pRow[col1]);
            y.push(pRow[col2]);
          }
        }
        const corr = calculateCorrelation(x, y);
        correlationMatrix[col1][col2] = corr;
        correlationMatrix[col2][col1] = corr;
      }
    }
  }

  return {
    overview: {
      totalRows,
      totalCols,
      numericCount,
      categoricalCount,
      dateCount,
      totalMissing
    },
    missingAnalysis,
    numericStats,
    categoricalStats,
    correlationMatrix
  };
}
