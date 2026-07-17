import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';

export default function EdaDashboard({ activeTab, fileType, parsedData, file, ai, pdfSummary, pdfSummaryLoading, triggerPDFSummaryManual }) {
  if (activeTab !== 'eda' || fileType !== 'csv' || !parsedData?.edaResult) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-950/30 grid-pattern-scroll font-sans">
      <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8 animate-fade-in">
        
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">EDA Copilot</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Exploratory Data Analysis</h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Automated statistical insights for <span className="font-semibold text-zinc-800 dark:text-zinc-300">{file.name}</span>
            </p>
          </div>
          {!pdfSummary && !pdfSummaryLoading && (
            <button
              onClick={triggerPDFSummaryManual}
              disabled={ai.status !== 'ready'}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Generate AI Summary</span>
            </button>
          )}
        </div>

        {/* AI Summary Banner */}
        {pdfSummaryLoading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-accent/20 bg-accent/5 dark:bg-accent/10 animate-pulse">
            <RefreshCw className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-accent">Synthesizing dataset insights...</p>
              <p className="text-[11px] text-accent/80">Using local AI model to synthesize EDA tables</p>
            </div>
          </div>
        )}
        {pdfSummary && (
          <div className="p-5 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-transparent to-transparent shadow-sm space-y-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black text-accent uppercase tracking-wider">AI Executive Summary</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">{pdfSummary}</p>
          </div>
        )}

        {/* Overview Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Rows', value: parsedData.edaResult.overview.totalRows.toLocaleString(), icon: '📋' },
            { label: 'Total Columns', value: parsedData.edaResult.overview.totalCols, icon: '🗂️' },
            { label: 'Numeric Features', value: parsedData.edaResult.overview.numericCount, icon: '🔢' },
            { label: 'Categorical Features', value: parsedData.edaResult.overview.categoricalCount, icon: '🏷️' }
          ].map((kpi, idx) => (
            <div key={idx} className="panel-card p-4 cursor-default hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <span className="text-lg text-accent">{kpi.icon}</span>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">{kpi.value}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Data Health & Numeric stats two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Missing Values Card */}
          <div className="panel-card flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/20 dark:bg-zinc-950/20">
              <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Missing Values Analysis</h4>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">Total Missing: {parsedData.edaResult.overview.totalMissing}</span>
            </div>
            <div className="p-4 overflow-y-auto max-h-[300px] divide-y divide-zinc-100 dark:divide-zinc-850">
              {Object.entries(parsedData.edaResult.missingAnalysis).map(([col, meta]) => (
                <div key={col} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate">{col}</span>
                      {meta.flag && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-danger/10 text-danger">HIGH</span>
                      )}
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${meta.percentage > 20 ? 'bg-danger' : meta.percentage > 5 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${Math.min(meta.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">{meta.percentage.toFixed(1)}%</span>
                    <p className="text-[9px] text-zinc-400 font-mono">{meta.count} missing</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Numeric Statistics Card */}
          <div className="panel-card flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
              <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Descriptive Statistics</h4>
            </div>
            <div className="p-4 overflow-y-auto max-h-[300px] space-y-3">
              {Object.keys(parsedData.edaResult.numericStats).length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-4 text-center">No numerical features found.</p>
              ) : Object.entries(parsedData.edaResult.numericStats).map(([col, stats]) => (
                <div key={col} className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-150/60 dark:border-zinc-800/80 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{col}</span>
                    {stats.outlierCount > 0 && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">
                        {stats.outlierCount} outliers
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono">
                    {[
                      { l: 'MIN', v: stats.min !== undefined ? Number(stats.min).toFixed(1) : '—' },
                      { l: 'MEAN', v: stats.mean !== undefined ? Number(stats.mean).toFixed(1) : '—' },
                      { l: 'MED', v: stats.median !== undefined ? Number(stats.median).toFixed(1) : '—' },
                      { l: 'MAX', v: stats.max !== undefined ? Number(stats.max).toFixed(1) : '—' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-1 rounded bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850">
                        <span className="text-[8px] text-zinc-400 block">{item.l}</span>
                        <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Categorical Breakdown */}
        <div className="panel-card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
            <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Categorical Distributions</h4>
          </div>
          <div className="p-5">
            {Object.keys(parsedData.edaResult.categoricalStats).length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic text-center">No categorical features found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-1">
                {Object.entries(parsedData.edaResult.categoricalStats).map(([col, stats]) => {
                  const barColors = ['bg-accent', 'bg-accent/80', 'bg-accent/60', 'bg-accent/40', 'bg-accent/20'];
                  return (
                    <div key={col} className="p-4 bg-zinc-50/40 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{col}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">{stats.uniqueCount} val</span>
                      </div>
                      <div className="space-y-2">
                        {stats.topValues.slice(0, 5).map((valMeta, idx) => {
                          const pct = (valMeta.count / parsedData.edaResult.overview.totalRows) * 100;
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                <span className="text-zinc-650 dark:text-zinc-300 truncate max-w-[120px]">{valMeta.value || 'null'}</span>
                                <span className="font-bold text-zinc-500 dark:text-zinc-400 font-mono">{pct.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                                <div className={`h-full ${barColors[idx % barColors.length]}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Correlation Matrix */}
        <div className="panel-card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20">
            <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Correlation Heatmap</h4>
          </div>
          <div className="p-5">
            {Object.keys(parsedData.edaResult.correlationMatrix).length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic text-center">Correlation matrix requires at least 2 numerical features.</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-1 text-xs font-mono text-center">
                    <thead>
                      <tr>
                        <th className="text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-2 pr-3 font-sans">Column</th>
                        {Object.keys(parsedData.edaResult.correlationMatrix).map(col => (
                          <th key={col} className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 pb-2 px-1 font-sans min-w-[50px] truncate max-w-[80px]" title={col}>
                            {col.length > 7 ? col.slice(0, 6) + '…' : col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(parsedData.edaResult.correlationMatrix).map(([rowCol, targets]) => (
                        <tr key={rowCol}>
                          <td className="text-left text-[11px] font-bold text-zinc-700 dark:text-zinc-350 pr-3 font-sans truncate max-w-[110px] py-1.5">{rowCol}</td>
                          {Object.keys(parsedData.edaResult.correlationMatrix).map(col => {
                            const r = targets[col];
                            const isSelf = rowCol === col;
                            const absVal = Math.abs(r);
                            const bgClass = isSelf ? 'bg-zinc-150 dark:bg-zinc-800'
                              : r > 0.6 ? 'bg-success/20'
                              : r < -0.6 ? 'bg-danger/20'
                              : absVal > 0.3 ? 'bg-warning/20'
                              : 'bg-zinc-50 dark:bg-zinc-900/30';
                            const textClass = isSelf ? 'text-zinc-400 dark:text-zinc-500'
                              : r > 0.6 ? 'text-success font-extrabold'
                              : r < -0.6 ? 'text-danger font-extrabold'
                              : 'text-zinc-650 dark:text-zinc-400';
                            return (
                              <td key={col} className={`px-2 py-1.5 rounded-xl ${bgClass} ${textClass} text-[11px] font-bold`} title={`${rowCol} × ${col}: ${r.toFixed(4)}`}>
                                {r.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-4 flex-wrap pt-2 text-[10px] text-zinc-400">
                  {[
                    { label: 'Positive (r > 0.6)', bg: 'bg-success/20 border border-success/30' },
                    { label: 'Negative (r < -0.6)', bg: 'bg-danger/20 border border-danger/30' },
                    { label: 'Moderate (|r| > 0.3)', bg: 'bg-warning/20 border border-warning/30' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-sm ${item.bg}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
