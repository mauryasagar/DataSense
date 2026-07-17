/**
 * Chart Selector utility for DataSense
 */

export function determineChartType(question) {
  const q = question.toLowerCase();

  // 1. Explicit chart-type names — highest priority, unambiguous
  if (q.includes("line chart") || q.includes("line graph") || q.includes("line plot")) return "line";
  if (q.includes("histogram")) return "histogram";
  if (q.includes("pie chart") || q.includes("pie graph")) return "pie";
  if (q.includes("scatter plot") || q.includes("scatterplot") || q.includes("scatter chart") || q.includes("scatter graph")) return "scatter";
  if (q.includes("bar chart") || q.includes("bar graph")) return "bar";

  // 2. Semantic intent keywords
  if (q.includes("trend") || q.includes("over time") || q.includes("monthly") || q.includes("yearly") || q.includes("date") || q.includes("timeline")) {
    return "line";
  }
  if (q.includes("distribution") || q.includes("spread") || q.includes("frequency")) {
    return "histogram";
  }
  if (q.includes("proportion") || q.includes("percentage") || q.includes("share") || q.includes("ratio")) {
    return "pie";
  }
  if (q.includes("correlation") || q.includes("relationship") || q.includes(" vs ") || q.includes(" vs.") || q.includes("against") || q.includes("scatter")) {
    return "scatter";
  }
  if (q.includes("compare") || q.includes("breakdown") || q.includes("by category") || q.includes("top") || q.includes("rank")) {
    return "bar";
  }

  // 3. Generic visualization request with no specific type named — default to bar
  if (q.includes("chart") || q.includes("graph") || q.includes("plot") || q.includes("visuali")) {
    return "bar";
  }

  // No chart intent detected at all
  return null;
}

/**
 * Extract chart data based on chart type and column statistics
 * @param {string} chartType 
 * @param {Object} eda 
 * @param {Array<string>} columns 
 * @param {Array<Object>} rows 
 */
export function extractChartData(chartType, eda, columns, rows) {
  // Let's find columns that can fit the chart type
  if (!chartType) return null;
  const numericCols = columns.filter(col => eda.numericStats[col] !== undefined);
  const categoricalCols = columns.filter(col => eda.categoricalStats[col] !== undefined);

  if (numericCols.length === 0 && categoricalCols.length === 0) return null;

  switch (chartType) {
    case "line": {
      // Look for a date/time column and a numeric column
      const dateCol = columns.find(col => eda.missingAnalysis[col] && !eda.numericStats[col]) || categoricalCols[0];
      const numCol = numericCols[0] || columns[0];
      
      if (!dateCol || !numCol) return null;

      // Group and sort by date/category
      const dataMap = {};
      rows.forEach(r => {
        const key = String(r[dateCol] || 'Unknown');
        const val = parseFloat(r[numCol]) || 0;
        if (!dataMap[key]) dataMap[key] = [];
        dataMap[key].push(val);
      });

      const labels = Object.keys(dataMap).slice(0, 50); // limit to 50 points for readable chart
      const values = labels.map(l => {
        const vals = dataMap[l];
        return vals.reduce((a, b) => a + b, 0) / vals.length; // average
      });

      return {
        labels,
        datasets: [{ label: `Average of ${numCol} by ${dateCol}`, data: values }],
        xAxisLabel: dateCol,
        yAxisLabel: numCol
      };
    }

    case "histogram": {
      // Find a numeric column to display distribution
      const numCol = numericCols[0];
      if (!numCol) return null;

      const vals = rows.map(r => parseFloat(r[numCol])).filter(v => !isNaN(v));
      if (vals.length === 0) return null;

      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const binCount = 10;
      const binSize = (max - min) / binCount;

      const bins = Array(binCount).fill(0);
      const labels = [];
      for (let i = 0; i < binCount; i++) {
        const binStart = min + i * binSize;
        const binEnd = min + (i + 1) * binSize;
        labels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
      }

      vals.forEach(v => {
        let binIdx = Math.floor((v - min) / binSize);
        if (binIdx >= binCount) binIdx = binCount - 1;
        if (binIdx < 0) binIdx = 0;
        bins[binIdx]++;
      });

      return {
        labels,
        datasets: [{ label: `Frequency of ${numCol}`, data: bins }],
        xAxisLabel: numCol,
        yAxisLabel: "Frequency"
      };
    }

    case "pie": {
      // Find a categorical column and look at frequencies
      const catCol = categoricalCols[0] || columns[0];
      if (!catCol) return null;

      const stats = eda.categoricalStats[catCol];
      if (stats && stats.topValues) {
        const labels = stats.topValues.map(v => v.value);
        const data = stats.topValues.map(v => v.count);
        return {
          labels,
          datasets: [{ label: `Proportion of ${catCol}`, data }],
          xAxisLabel: catCol,
          yAxisLabel: "Count"
        };
      }
      return null;
    }

    case "scatter": {
      // Find two numeric columns
      const xCol = numericCols[0];
      const yCol = numericCols[1] || numericCols[0];
      if (!xCol || !yCol) return null;

      const dataPoints = [];
      rows.slice(0, 100).forEach(row => { // limit scatter plot to first 100 points
        const xVal = parseFloat(row[xCol]);
        const yVal = parseFloat(row[yCol]);
        if (!isNaN(xVal) && !isNaN(yVal)) {
          dataPoints.push({ x: xVal, y: yVal });
        }
      });

      return {
        dataPoints,
        xAxisLabel: xCol,
        yAxisLabel: yCol
      };
    }

    case "bar":
    default: {
      // Find a categorical column and a numeric column
      const catCol = categoricalCols[0] || columns[0];
      const numCol = numericCols[0];

      if (!catCol) return null;

      if (numCol) {
        // Average numeric values grouped by categorical values
        const groupMap = {};
        rows.forEach(r => {
          const key = String(r[catCol] || 'Unknown');
          const val = parseFloat(r[numCol]);
          if (!isNaN(val)) {
            if (!groupMap[key]) groupMap[key] = [];
            groupMap[key].push(val);
          }
        });

        const labels = Object.keys(groupMap).slice(0, 30); // limit to top 30 categories
        const data = labels.map(l => {
          const vals = groupMap[l];
          return vals.reduce((a, b) => a + b, 0) / vals.length;
        });

        return {
          labels,
          datasets: [{ label: `Average ${numCol} by ${catCol}`, data }],
          xAxisLabel: catCol,
          yAxisLabel: `Average ${numCol}`
        };
      } else {
        // Simple counts
        const stats = eda.categoricalStats[catCol];
        if (stats && stats.topValues) {
          const labels = stats.topValues.map(v => v.value);
          const data = stats.topValues.map(v => v.count);
          return {
            labels,
            datasets: [{ label: `Count of ${catCol}`, data }],
            xAxisLabel: catCol,
            yAxisLabel: "Count"
          };
        }
        return null;
      }
    }
  }
}
