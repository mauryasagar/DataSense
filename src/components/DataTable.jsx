import React from 'react';
import { Table } from 'lucide-react';

export default function DataTable({ activeTab, fileType, parsedData, file }) {
  if (activeTab !== 'table' || fileType !== 'csv' || !parsedData) return null;

  if (!parsedData.rows) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent p-6">
        <div className="panel-card text-center p-8 max-w-md">
          <Table className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Row Data Unavailable</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            To preserve memory and storage, individual rows are not saved between sessions. Please re-upload your CSV file to view the raw data table here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent p-6">
      <div className="panel-card !p-0 flex-1 flex flex-col overflow-hidden animate-fade-in shadow-xl">
        <div className="flex-shrink-0 px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <div>
            <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Interactive Data Explorer</h4>
            <p className="text-sm font-medium text-zinc-500 mt-1">Displaying the first 50 rows of {file.name}</p>
          </div>
          <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
            {parsedData.rows.length} rows x {parsedData.columns.length} columns
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left font-mono">
            <thead className="bg-zinc-50/90 dark:bg-zinc-900/90 sticky top-0 font-sans z-10 backdrop-blur-md">
              <tr>
                {parsedData.columns.map((col) => (
                  <th key={col} className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
              {parsedData.rows.slice(0, 50).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group">
                  {parsedData.columns.map((col) => {
                    const val = row[col];
                    return (
                      <td key={col} className="px-6 py-3.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-400 truncate max-w-[220px] group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                        {val === null || val === undefined ? (
                          <span className="text-danger/80 italic text-[10px]">null</span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
