import React from 'react';
import { Cpu, RefreshCw, Check } from 'lucide-react';

export default function NotebookView({ activeTab, fileType, parsedData, ai, notebookExplanations, explainingCellIdx, handleExplainCell }) {
  if (activeTab !== 'notebook' || fileType !== 'ipynb' || !parsedData) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-transparent">
      {parsedData.map((cell, idx) => (
        <div key={idx} className="panel-card !p-0 overflow-hidden animate-fade-in flex flex-col">
          
          {/* Cell Header */}
          <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50/30 dark:bg-zinc-900/10 backdrop-blur-sm">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Cell [{cell.index + 1}] · {cell.type}</span>
            
            {cell.type === 'code' && (
              <button
                onClick={() => handleExplainCell(idx)}
                disabled={explainingCellIdx === idx || ai.status !== 'ready'}
                className="flex items-center gap-1.5 text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3.5 py-1 rounded-full hover:bg-zinc-850 dark:hover:bg-zinc-100 disabled:opacity-35 shadow-sm transition-all active:scale-95"
              >
                {explainingCellIdx === idx ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-zinc-300" />
                    <span>Thinking...</span>
                  </>
                ) : notebookExplanations[idx] ? (
                  <>
                    <Check className="w-3 h-3 text-success" />
                    <span className="text-success font-extrabold">Explained</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3 h-3 text-zinc-400" />
                    <span>Explain Cell</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Cell Content */}
          <div className="p-4 space-y-3">
            {cell.type === 'markdown' ? (
              // Markdown Cell View with proper heading styles and font size
              <div className="text-[13px] sm:text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed font-sans">
                {cell.source.split('\n').map((line, lIdx) => {
                  if (line.trim().startsWith('#')) {
                    const match = line.match(/^(#{1,6})\s+(.*)$/);
                    if (match) {
                      const level = match[1].length;
                      const text = match[2];
                      if (level === 1) {
                        return <h1 key={lIdx} className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-2 mb-1.5 font-sans">{text}</h1>;
                      } else if (level === 2) {
                        return <h2 key={lIdx} className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mt-1.5 mb-1 font-sans">{text}</h2>;
                      } else {
                        return <h3 key={lIdx} className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 mb-1 font-sans">{text}</h3>;
                      }
                    }
                    const headingText = line.replace(/#/g, '').trim();
                    return <h3 key={lIdx} className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 mb-1 font-sans">{headingText}</h3>;
                  }
                  return <p key={lIdx} className="mb-1.5 last:mb-0 leading-relaxed">{line}</p>;
                })}
              </div>
            ) : (
              // Code Cell View
              <div className="space-y-4">
                <pre className="p-4 rounded-xl bg-zinc-900 dark:bg-zinc-900/80 border border-zinc-800 text-[13px] text-zinc-100 dark:text-zinc-200 overflow-x-auto font-mono leading-relaxed shadow-inner">
                  <code>{cell.source}</code>
                </pre>

                {/* Cell Output if present */}
                {cell.hasOutputs && cell.outputText && (
                  <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-150 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">Terminal Output</span>
                    <pre className="text-[12px] text-zinc-700 dark:text-zinc-355 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">{cell.outputText}</pre>
                  </div>
                )}

                {/* Explanation Box */}
                <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">AI Explanation</span>
                  {notebookExplanations[idx] ? (
                    <p className="text-[14px] sm:text-[15px] font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed animate-fade-in">{notebookExplanations[idx]}</p>
                  ) : (
                    <p className="text-xs sm:text-sm text-zinc-400 italic">No explanation generated yet. Click "Explain Cell" or "Explain All Cells" to run analysis.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
