import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Upload, X, Sun, Moon, ArrowLeft,
  MessageSquare, Table, Search, 
  Database, FileText, Cpu, ShieldCheck, Play,
  AlertTriangle, RefreshCw, Download, BarChart2, BookOpen
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAIWorker } from '../hooks/useAIWorker'
import { useFileHandler } from '../hooks/useFileHandler'
import { useSession } from '../hooks/useSession'

import { buildNotebookContext } from '../utils/contextBuilder'
import { exportSessionReport } from '../utils/pdfExporter'
import Footer from '../components/landing/Footer'
import DataTable from '../components/DataTable'
import EdaDashboard from '../components/EdaDashboard'
import NotebookView from '../components/NotebookView'
import ChatPanel from '../components/ChatPanel'
// Empty State Dropzone Component supporting multiple extensions




function EmptyDropZone({ onFileSelect, fileError, onLoadSample, onScroll }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }

  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col grid-pattern-scroll relative" onScroll={onScroll}>
      {/* Radial gradient — inside scrollable area so it scrolls with content */}
      <div className="sticky top-0 left-1/2 pointer-events-none" style={{height: 0}}>
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-zinc-100 dark:bg-zinc-900/60 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-14 pb-12 px-6 max-w-5xl mx-auto w-full relative z-10">

        {/* Badge */}
        <div className="badge mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-fast-pulse" />
          100% On-Device AI · No Cloud · No API Keys
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1] mb-5 text-center animate-slide-up">
          Analyze your data, <br className="hidden sm:block" />
          <span className="gradient-text">locally and privately.</span>
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg text-center mb-12 leading-relaxed animate-slide-up" style={{ animationDelay: '0.05s' }}>
          Drop any CSV, PDF, or Jupyter Notebook below to run local WebAssembly engines and AI models entirely inside your browser sandbox.
        </p>

        {/* Error banner */}
        {fileError && (
          <div className="w-full max-w-xl mb-8 flex items-start gap-3 p-5 rounded-2xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300 animate-slide-up shadow-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="text-sm font-medium">{fileError}</div>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 relative z-10 group shadow-lg
            ${dragging
              ? 'border-zinc-900 dark:border-white scale-[1.02] shadow-2xl bg-zinc-50 dark:bg-zinc-900/60'
              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/40 hover:border-zinc-500 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:scale-[1.01] hover:shadow-2xl'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.ipynb,.pdf"
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files[0])}
          />

          {/* Upload icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
            dragging
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 scale-110 shadow-zinc-900/30'
              : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 group-hover:bg-zinc-800 dark:group-hover:bg-zinc-100 group-hover:scale-105 group-hover:shadow-lg'
          }`}>
            <Upload className="w-6 h-6" strokeWidth={2.2} />
          </div>

          <div className="text-center space-y-2">
            <p className="font-bold text-zinc-900 dark:text-zinc-50 text-lg tracking-tight">
              {dragging ? 'Drop your file here' : 'Upload dataset or document'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Drag & drop your CSV, PDF, or Jupyter Notebook (.ipynb) directly into the browser.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 w-full pt-5 justify-center">
            <ShieldCheck className="w-4 h-4" />
            <span>Local on-device parsing · 100% private</span>
          </div>
        </div>

        {/* Sample Loaders */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 z-10 relative">
          <button
            onClick={(e) => { e.stopPropagation(); onLoadSample('csv') }}
            className="btn-primary flex items-center gap-2.5 px-8 py-3.5 text-sm rounded-full shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
          >
            <Table className="w-4 h-4" />
            <span>Load Sample CSV</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLoadSample('pdf') }}
            className="btn-ghost flex items-center gap-2.5 px-8 py-3.5 text-sm rounded-full hover:scale-[1.01] transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Load Sample PDF</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLoadSample('ipynb') }}
            className="btn-ghost flex items-center gap-2.5 px-8 py-3.5 text-sm rounded-full hover:scale-[1.01] transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Load Sample Notebook</span>
          </button>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className="px-6 pb-12 max-w-5xl mx-auto w-full relative z-10">
        <div className="mb-8 text-center">
          <span className="section-label">What you can do</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="feature-card group flex flex-col justify-start">
            <div className="icon-box mb-4 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300">
              <BarChart2 className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
            </div>
            <div className="fn-name mb-1.5">analyzeCSV()</div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">CSV Data Copilot</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Interactive EDA charts, correlational analysis, instant data summaries, and SQL-powered Q&A chat.
            </p>
          </div>

          <div className="feature-card group flex flex-col justify-start">
            <div className="icon-box mb-4 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300">
              <FileText className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
            </div>
            <div className="fn-name mb-1.5">parsePDF()</div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">Doc Chat & Summary</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Extracts text from PDF documents locally and uses AI to generate summaries and answer context-retrieved questions.
            </p>
          </div>

          <div className="feature-card group flex flex-col justify-start">
            <div className="icon-box mb-4 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300">
              <BookOpen className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
            </div>
            <div className="fn-name mb-1.5">parseNotebook()</div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">Notebook Explainer</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Instantly parses <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">.ipynb</code> files and uses on-device AI to explain code cells and outputs.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function ModelStatusBanner({ status, progress, error, loadModels, modelCached }) {
  if (status === 'ready') return null;

  const isInitializing = status === 'initializing';
  const isLoading = status === 'loading';

  return (
    <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 dark:from-zinc-900/20 dark:via-zinc-950 dark:to-zinc-900/20 p-5 sm:p-6 transition-all duration-300 animate-slide-up backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all ${(isLoading || isInitializing) ? 'bg-zinc-900/10 dark:bg-white/10 shadow-inner border border-zinc-900/20 dark:border-white/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
            <Cpu className={`w-5 h-5 ${(isLoading || isInitializing) ? 'text-zinc-900 dark:text-zinc-100 animate-pulse' : 'text-zinc-400'}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {status === 'idle' && 'AI features are not loaded yet'}
              {isLoading && `Downloading models… (${progress}%)`}
              {isInitializing && 'Warming up AI engine…'}
              {status === 'error' && 'Failed to load AI models'}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
              {status === 'idle' && (
                modelCached
                  ? 'Model is cached locally. Click to load — takes ~2-5s to initialize. Data exploration works without it.'
                  : 'One-time ultra-lightweight ~35MB download needed for AI Q&A, summaries & notebook explainer. CSV data analysis works right now.'
              )}
              {isLoading && 'Downloading WebAssembly runtimes and AI weights. Please keep this tab active.'}
              {isInitializing && 'Compiling and loading model weights into WebAssembly memory. Almost ready…'}
              {status === 'error' && `Error details: ${error}. Please refresh or try again.`}
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0 w-full md:w-auto flex items-center gap-3">
          {status === 'idle' && (
            <div className="flex items-center gap-2.5">
              {modelCached && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                  ✓ Cached
                </span>
              )}
              <button
                onClick={loadModels}
                className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                {modelCached ? 'Initialize AI' : 'Load AI Models'}
              </button>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-48 bg-zinc-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="bg-zinc-900 dark:bg-white h-full rounded-full"
                  style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums w-8">{progress}%</span>
            </div>
          )}
          {isInitializing && (
            <div className="flex items-center gap-2.5">
              {/* Indeterminate spinner */}
              <svg className="w-5 h-5 animate-spin text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Initializing…</span>
            </div>
          )}
          {status === 'error' && (
            <button
              onClick={loadModels}
              className="px-6 py-2.5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Download
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AppPage() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  // Custom AI Worker Hook
  const ai = useAIWorker()
  
  // Custom File Handler Hook
  const fileHandler = useFileHandler()
  const { file, fileType, parsedData, loading: fileParsing, error: fileError } = fileHandler

  // Session Persistence Hook
  const { restoredSession, saveSession, clearSession } = useSession()

  // Local State
  const [activeTab, setActiveTab] = useState('chat')
  const [chatHistory, setChatHistory] = useState([])
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  
    
  // Extra features states for CSV & Notebooks
  const [notebookExplanations, setNotebookExplanations] = useState({}) // cellIndex -> explanation text
  const [explainingCellIdx, setExplainingCellIdx] = useState(null)
  const [explainAllProgress, setExplainAllProgress] = useState(null) // { current, total } or null
  
  // EDA AI Summary states
  const [pdfSummary, setPdfSummary] = useState('')
  const [pdfSummaryLoading, setPdfSummaryLoading] = useState(false)

  // Toast notifications for caching/offline status
  const [toastMessage, setToastMessage] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  // DOM Refs for report capturing
  const messageRefs = useRef([])

  // Restore session from IndexedDB if available
  useEffect(() => {
    if (restoredSession && !file) {
      // Re-create a mock File object to satisfy file selection state
      const mockFile = { name: restoredSession.fileName, size: 0 }
      fileHandler.loadSessionData(mockFile, restoredSession.fileType, restoredSession.parsedData)
      setChatHistory(restoredSession.chatHistory || [])
      
      if (restoredSession.fileType === 'csv' || restoredSession.fileType === 'pdf') {
        setPdfSummary(restoredSession.extra?.pdfSummary || '')
      } else if (restoredSession.fileType === 'ipynb') {
        setNotebookExplanations(restoredSession.extra?.notebookExplanations || {})
      }

      // Since rows are no longer persisted (to save memory), tell user to re-upload for live queries
      const hasRows = restoredSession.parsedData?.rows?.length > 0;
      setToastMessage(
        hasRows
          ? "Restored previous workspace session!"
          : `Session restored! Re-upload "${restoredSession.fileName}" to run new queries.`
      )
    }
  }, [restoredSession, file, fileHandler])

  // Save session on state changes
  useEffect(() => {
    if (file && fileType && parsedData) {
      const extra = {}
      if (fileType === 'csv' || fileType === 'pdf') {
        extra.pdfSummary = pdfSummary
      } else if (fileType === 'ipynb') {
        extra.notebookExplanations = notebookExplanations
      }
      saveSession(file.name, fileType, parsedData, chatHistory, extra)
    }
  }, [file, fileType, parsedData, chatHistory, pdfSummary, notebookExplanations, saveSession])

    // Auto-generate suggested questions when CSV loads and set tab on file load
  useEffect(() => {
    if (fileType === 'csv' && parsedData?.columns) {
      // Static suggestions based on columns & types for speed and accuracy
      const cols = parsedData.columns;
      const types = parsedData.columnTypes;
      const numCols = cols.filter(c => types[c] === 'numeric');
      const catCols = cols.filter(c => types[c] === 'categorical');

      const questions = [];
      if (numCols.length > 0) {
        questions.push(`What is the average distribution of ${numCols[0]}?`);
        if (catCols.length > 0) {
          questions.push(`Show me the breakdown of ${numCols[0]} by ${catCols[0]}`);
        } else if (numCols.length > 1) {
          questions.push(`Analyze the correlation between ${numCols[0]} and ${numCols[1]}`);
        }
      }
      if (catCols.length > 0) {
        questions.push(`Which are the top categories in ${catCols[0]}?`);
        if (numCols.length > 0) {
          questions.push(`Is there a trend of ${numCols[0]} vs ${catCols[0]}?`);
        }
      }
      while (questions.length < 5 && cols.length > 0) {
        const col = cols[questions.length % cols.length];
        questions.push(`Display summary details for the column ${col}`);
      }
      setSuggestedQuestions(questions.slice(0, 5));
      setActiveTab('chat');
    } else if (fileType === 'ipynb') {
      setActiveTab('notebook');
    } else if (fileType === 'pdf') {
      setSuggestedQuestions([
        "What is the core methodology of this report?",
        "What are the main conclusions?",
        "Give me a detailed breakdown of the findings.",
        "What privacy measures are detailed in the document?"
      ]);
      setActiveTab('pdf-chat');
    }
  }, [fileType, parsedData])

  // Listen for the custom cached event from Hook
  useEffect(() => {
    const handleCached = () => {
      setToastMessage("AI models cached — app now works offline! 🌐✈️");
    };
    window.addEventListener('ai-model-cached', handleCached);
    return () => window.removeEventListener('ai-model-cached', handleCached);
  }, []);

  // Dismiss toast after delay
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleFileSelect = (selectedFile) => {
    fileHandler.handleFile(selectedFile);
  }

  // Trigger EDA / Doc AI Summary generation
  const triggerPDFSummaryManual = async () => {
    if (ai.status !== 'ready') return;
    setPdfSummaryLoading(true);
    try {
      let summaryInput = '';
      if (fileType === 'csv' && parsedData?.edaResult) {
        const eda = parsedData.edaResult;
        summaryInput = `Dataset overview: ${eda.overview.totalRows} rows, ${eda.overview.totalCols} columns (${eda.overview.numericCount} numeric, ${eda.overview.categoricalCount} categorical). Missing values: ${eda.overview.totalMissing}. ` +
          Object.entries(eda.numericStats).map(([col, s]) => `${col}: mean=${s.mean.toFixed(2)}, stdDev=${s.stdDev.toFixed(2)}, ${s.outlierCount} outliers`).join('. ') + '. ' +
          Object.entries(eda.categoricalStats).map(([col, s]) => `${col}: ${s.uniqueCount} unique values`).join('. ');
      } else if (fileType === 'pdf' && parsedData?.fullText) {
        summaryInput = parsedData.fullText.length > 2500
          ? parsedData.fullText.substring(0, 2500) + '...'
          : parsedData.fullText;
      } else {
        throw new Error("No data available to summarize");
      }

      const result = await ai.summarizeText(summaryInput);
      setPdfSummary(result?.summary || result?.answer || 'Summary could not be generated.');
    } catch (err) {
      console.error('Summary error:', err);
      setToastMessage('Failed to generate summary.');
    } finally {
      setPdfSummaryLoading(false);
    }
  };


  // Explain single code cell
  const handleExplainCell = async (cellIdx) => {
    if (ai.status !== 'ready') {
      setToastMessage("Load AI Models first to explain code cells.");
      return;
    }
    setExplainingCellIdx(cellIdx);
    try {
      const currentCell = parsedData[cellIdx];
      // Collect previous imports
      const prevImports = [];
      parsedData.slice(0, cellIdx).forEach(c => {
        if (c.type === 'code') {
          c.source.split('\n').forEach(line => {
            if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
              prevImports.push(line.trim());
            }
          });
        }
      });

      const promptContext = buildNotebookContext(currentCell.index, currentCell.source, currentCell.outputText, prevImports);
      
      const result = await ai.explainCell(promptContext);
      const explanation = result?.answer || "The AI could not find a clear answer. Try rephrasing your question.";
      
      setNotebookExplanations(prev => ({
        ...prev,
        [cellIdx]: explanation
      }));
    } catch (e) {
      console.error(e);
      setToastMessage("Failed to explain cell.");
    } finally {
      setExplainingCellIdx(null);
    }
  };

  // Explain all code cells sequentially
  const handleExplainAll = async () => {
    if (ai.status !== 'ready') {
      setToastMessage("Load AI Models first to explain code cells.");
      return;
    }

    const codeCells = parsedData.map((cell, idx) => ({ cell, idx })).filter(item => item.cell.type === 'code');
    if (codeCells.length === 0) return;

    setExplainAllProgress({ current: 0, total: codeCells.length });

    for (let i = 0; i < codeCells.length; i++) {
      const { cell, idx } = codeCells[i];
      // Skip if already explained
      if (notebookExplanations[idx]) {
        setExplainAllProgress(prev => ({ ...prev, current: i + 1 }));
        continue;
      }

      setExplainingCellIdx(idx);
      setExplainAllProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const prevImports = [];
        parsedData.slice(0, idx).forEach(c => {
          if (c.type === 'code') {
            c.source.split('\n').forEach(line => {
              if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
                prevImports.push(line.trim());
              }
            });
          }
        });

        const promptContext = buildNotebookContext(cell.index, cell.source, cell.outputText, prevImports);
        const result = await ai.explainCell(promptContext);
        const explanation = result?.answer || "The AI could not explain this cell clearly.";

        setNotebookExplanations(prev => ({
          ...prev,
          [idx]: explanation
        }));
      } catch (err) {
        console.error(`Error explaining cell ${idx}:`, err);
      }
    }

    setExplainingCellIdx(null);
    setExplainAllProgress(null);
    setToastMessage("Finished explaining all code cells! 🎉");
  };

  const handleExportPDF = async () => {
    if (!file) return;
    setToastMessage("Generating PDF report... 📄");
    
    // Package stats
    let stats = {};
    let sessionItems = [];

    if (fileType === 'csv') {
      stats = {
        totalRows: parsedData.edaResult?.overview?.totalRows,
        totalCols: parsedData.edaResult?.overview?.totalCols
      };
      sessionItems = chatHistory;
    } else if (fileType === 'pdf') {
      stats = {
        pageCount: parsedData.pageCount,
        wordCount: parsedData.wordCount,
        paragraphs: parsedData.paragraphs.length
      };
      sessionItems = chatHistory;
    } else if (fileType === 'ipynb') {
      stats = {
        totalCells: parsedData.length,
        codeCells: parsedData.filter(c => c.type === 'code').length
      };
      sessionItems = parsedData
        .filter(c => c.type === 'code')
        .map((c) => ({
          index: c.index,
          cellType: c.type,
          explanation: notebookExplanations[c.index]
        }))
        .filter(item => item.explanation);
    }

    // Get chart elements by referencing ref array
    const chartDoms = chatHistory.map((_, i) => messageRefs.current[i] || null);

    try {
      await exportSessionReport(file.name, fileType, stats, sessionItems, chartDoms);
      setToastMessage("Report downloaded successfully!");
    } catch (e) {
      setToastMessage("PDF Generation failed: " + e.message);
        }
  }

  const handleLoadSample = (type) => {
    if (type === 'csv') {
      const csvContent = "Month,Revenue,Profit,Units,Category,Region\n" +
        "Jan,1200,300,50,Hardware,East\n" +
        "Feb,1500,450,60,Software,East\n" +
        "Mar,2000,700,80,Hardware,West\n" +
        "Apr,1800,500,75,Software,West\n" +
        "May,2200,800,90,Hardware,North\n" +
        "Jun,2500,1000,110,Software,North\n" +
        "Jul,2100,650,85,Hardware,South\n" +
        "Aug,2800,1100,120,Software,South\n" +
        "Sep,2400,900,95,Hardware,East\n" +
        "Oct,2600,1050,105,Software,West\n" +
        "Nov,3100,1300,130,Hardware,North\n" +
        "Dec,3500,1600,150,Software,South";
      const mockFile = new File([csvContent], "sample_sales_report.csv", { type: "text/csv" });
      handleFileSelect(mockFile);
    } else if (type === 'pdf') {
      const mockFile = { name: "sample_ai_report.pdf", size: 4500 };
      const mockData = {
        fullText: "Title: Local AI RAG Architecture Analysis\n\nAbstract:\nThis study evaluates the latency and performance metrics of running large language models locally in web browsers using ONNX Runtime Web and WebAssembly. Modern browser sandboxes allow executing quantized transformer weights entirely on the client, removing server cost and keeping data 100% private.\n\nMethodology & Web Workers:\nTo prevent the main browser UI thread from freezing, the model execution pipeline is loaded inside an asynchronous Web Worker. Prompt context retrieval uses paragraph-level TF-IDF overlap scoring, selecting the top 3 highest-ranking text blocks (limited to 1500 characters) to pass to the generative Qwen1.5 model.\n\nResults & Metrics:\nInitial download latency ranges from 10 to 30 seconds to fetch the 350MB model. However, subsequent inference is instant due to local Web Cache API storage. Word generation rates range between 12 and 18 tokens per second on consumer CPUs, making local browser AI highly practical for text mining.\n\nKey Conclusions & Compliance:\nThe offline-first approach guarantees client-side data sovereignty and eliminates network latency bottlenecks. The system adheres fully to open-source guidelines by leveraging Apache-2.0 and MIT-licensed software frameworks.",
        paragraphs: [
          "Title: Local AI RAG Architecture Analysis",
          "Abstract:\nThis study evaluates the latency and performance metrics of running large language models locally in web browsers using ONNX Runtime Web and WebAssembly. Modern browser sandboxes allow executing quantized transformer weights entirely on the client, removing server cost and keeping data 100% private.",
          "Methodology & Web Workers:\nTo prevent the main browser UI thread from freezing, the model execution pipeline is loaded inside an asynchronous Web Worker. Prompt context retrieval uses paragraph-level TF-IDF overlap scoring, selecting the top 3 highest-ranking text blocks (limited to 1500 characters) to pass to the generative Qwen1.5 model.",
          "Results & Metrics:\nInitial download latency ranges from 10 to 30 seconds to fetch the 350MB model. However, subsequent inference is instant due to local Web Cache API storage. Word generation rates range between 12 and 18 tokens per second on consumer CPUs, making local browser AI highly practical for text mining.",
          "Key Conclusions & Compliance:\nThe offline-first approach guarantees client-side data sovereignty and eliminates network latency bottlenecks. The system adheres fully to open-source guidelines by leveraging Apache-2.0 and MIT-licensed software frameworks."
        ],
        pageCount: 2,
        wordCount: 218
      };
      fileHandler.loadSessionData(mockFile, 'pdf', mockData);
    } else if (type === 'ipynb') {
      const mockFile = { name: "sample_data_analysis.ipynb", size: 3000 };
      const mockData = [
        {
          index: 0,
          type: 'markdown',
          source: "# On-Device AI Heuristics Analysis\nThis notebook demonstrates local machine learning executions using Python pandas and numpy libraries.",
          outputs: [],
          hasOutputs: false,
          outputText: ''
        },
        {
          index: 1,
          type: 'code',
          source: "import numpy as np\nimport pandas as pd\n\n# Create a mock dataframe\ndata = np.random.randn(100, 3)\ndf = pd.DataFrame(data, columns=['A', 'B', 'C'])\nprint(df.describe())",
          outputs: [{ text: "                A           B           C\ncount  100.000000  100.000000  100.000000\nmean    -0.038102    0.052812   -0.012083\nstd      0.985102    1.023812    0.952901\nmin     -2.312940   -2.102381   -2.823901\nmax      2.502842    2.650284    2.190283" }],
          hasOutputs: true,
          outputText: "                A           B           C\ncount  100.000000  100.000000  100.000000\nmean    -0.038102    0.052812   -0.012083\nstd      0.985102    1.023812    0.952901\nmin     -2.312940   -2.102381   -2.823901\nmax      2.502842    2.650284    2.190283"
        },
        {
          index: 2,
          type: 'code',
          source: "correlation = df.corr()\nprint(correlation)",
          outputs: [{ text: "          A         B         C\nA  1.000000  0.082910 -0.119203\nB  0.082910  1.000000  0.052912\nC -0.119203  0.052912  1.000000" }],
          hasOutputs: true,
          outputText: "          A         B         C\nA  1.000000  0.082910 -0.119203\nB  0.082910  1.000000  0.052912\nC -0.119203  0.052912  1.000000"
        },
        {
          index: 3,
          type: 'code',
          source: "from sklearn.linear_model import LinearRegression\n\n# Fit simple regression\nX = df[['A', 'B']]\ny = df['C']\nmodel = LinearRegression().fit(X, y)\nprint(f'Intercept: {model.intercept_:.4f}')\nprint(f'Coefficients: {model.coef_}')",
          outputs: [{ text: "Intercept: -0.0142\nCoefficients: [-0.1182  0.0489]" }],
          hasOutputs: true,
          outputText: "Intercept: -0.0142\nCoefficients: [-0.1182  0.0489]"
        }
      ];
      fileHandler.loadSessionData(mockFile, 'ipynb', mockData);
    }
  }

  const handleClearSession = async () => {
    await clearSession()
    fileHandler.clearFile()
    setChatHistory([])
    setSuggestedQuestions([])
    setCsvSummary('')
    setNotebookExplanations({})
    setActiveTab('chat')
    setToastMessage("Session cleared successfully.")
  }

  const tabs = fileType === 'csv'
    ? [
        { id: 'chat', icon: MessageSquare, label: 'Data Chat' },
        { id: 'table', icon: Table, label: 'Data Explorer' },
        { id: 'eda', icon: Search, label: 'EDA Copilot' }
      ]
    : fileType === 'ipynb'
    ? [
        { id: 'notebook', icon: BookOpen, label: 'Notebook Explainer' }
      ]
    : fileType === 'pdf'
    ? [
        { id: 'pdf-chat', icon: MessageSquare, label: 'Doc Chat' },
        { id: 'pdf-summary', icon: FileText, label: 'Doc Summary' }
      ]
    : [];

    return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Header: shows grid-pattern background only when transparent at top (no file, not scrolled)
           so the 32px grid tiles seamlessly into the scrollable body grid beneath it */}
      <header className={`flex-shrink-0 h-16 transition-all duration-300 relative z-20 ${
        !file && !scrolled
          ? 'grid-pattern opacity-100 border-b border-transparent'
          : 'border-b border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl shadow-sm'
      }`}>
        <div className={`h-full flex items-center justify-between w-full ${!file ? 'max-w-6xl mx-auto px-4 sm:px-6' : 'px-6'}`}>
          <div className="flex items-center gap-4">
            {/* Home Button */}
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors ${
                !file 
                  ? 'xl:absolute xl:left-8 xl:top-1/2 xl:-translate-y-1/2' 
                  : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                <svg className="w-7 h-7 text-zinc-900 dark:text-zinc-50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.4" />
                  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.75" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">DataSense</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {ai.status !== 'ready' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>AI Loading</span>
              </div>
            )}

            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-9 h-9 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-300"
            >
              <div className={`transition-transform duration-500 ease-out ${theme === 'dark' ? 'rotate-90' : 'rotate-0'}`}>
                {theme === 'dark'
                  ? <Sun className="w-4 h-4" strokeWidth={1.5} />
                  : <Moon className="w-4 h-4" strokeWidth={1.5} />
                }
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Models Loading Status Banner */}
      <ModelStatusBanner status={ai.status} progress={ai.progress} error={ai.error} loadModels={ai.loadModels} modelCached={ai.modelCached} />

      {/* Main Panel Layout */}
      {fileParsing ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
          <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4 animate-spin">
            <RefreshCw className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Parsing uploaded document...</p>
          <p className="text-xs text-zinc-400 mt-1">Analyzing schemas, text content structure, and metadata locally</p>
        </div>
            ) : !file ? (
        <EmptyDropZone onFileSelect={handleFileSelect} fileError={fileError} onLoadSample={handleLoadSample} onScroll={(e) => setScrolled(e.target.scrollTop > 10)} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar with Premium Glassmorphism */}
          <aside className="w-72 flex-shrink-0 border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col bg-zinc-50/40 dark:bg-zinc-950/40 backdrop-blur-2xl hidden md:flex relative z-10">
            <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 shadow-sm">
                  <Database className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Active Workspace</span>
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 truncate" title={file.name}>{file.name}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {fileType === 'csv' && parsedData?.columns && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Columns & Types</span>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {parsedData.columns.map((col) => {
                      const type = parsedData.columnTypes[col];
                      return (
                        <div key={col} className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800/60 shadow-sm hover:shadow hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-default">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white truncate max-w-[130px]" title={col}>{col}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase tracking-wider ${
                            type === 'numeric' ? 'bg-accent/10 text-accent border border-accent/20' :
                            type === 'date' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700' :
                            'bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 border border-zinc-150 dark:border-zinc-700/50'
                          }`}>{type === 'numeric' ? 'NUM' : type === 'date' ? 'DATE' : 'TEXT'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {fileType === 'ipynb' && parsedData && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800/80 shadow-sm space-y-3">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Cells Overview</span>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Total Cells</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.length}</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Code Cells</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.filter(c => c.type === 'code').length}</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Markdown Cells</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.filter(c => c.type === 'markdown').length}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExplainAll}
                    disabled={explainAllProgress !== null || ai.status !== 'ready'}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-850 dark:hover:bg-zinc-100 disabled:opacity-50 text-xs font-extrabold shadow hover:shadow-md transition-all hover:scale-[1.01]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{explainAllProgress ? "Explaining..." : "Explain All Cells"}</span>
                  </button>

                  {explainAllProgress && (
                    <div className="space-y-1.5 bg-white/70 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-150 dark:border-zinc-800/80">
                      <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{explainAllProgress.current} / {explainAllProgress.total}</span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-zinc-900 dark:bg-white h-full transition-all" style={{ width: `${(explainAllProgress.current / explainAllProgress.total) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {fileType === 'pdf' && parsedData && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800/80 shadow-sm space-y-3">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Document Stats</span>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Pages</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.pageCount}</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Word Count</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.wordCount?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-355">
                        <span>Paragraphs</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{parsedData.paragraphs?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Clear and export CTA */}
            <div className="p-4 border-t border-zinc-200/85 dark:border-zinc-800/85 bg-zinc-50/20 dark:bg-zinc-900/20 space-y-2">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-extrabold rounded-full bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow hover:shadow-md transition-all hover:scale-[1.01]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF Report</span>
              </button>
              <button
                onClick={handleClearSession}
                className="w-full py-2.5 px-3 text-sm font-bold text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Clear Session
              </button>
            </div>
          </aside>

          {/* Main workspace panels */}
          <main className="flex-1 flex flex-col overflow-hidden bg-transparent z-10 relative">
            
            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-850 px-4 flex items-center justify-between bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
              <div className="flex items-center gap-4">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all ${
                        activeTab === tab.id
                          ? 'text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {/* Active indicator */}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white rounded-t-full shadow-[0_0_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Workspace file badge on the right of the tab row */}
              {file && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-[11px] font-medium text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/80 shadow-sm select-none my-1 flex-shrink-0 animate-fade-in">
                  <FileText className="w-3 h-3 text-zinc-400" />
                  <span className="truncate max-w-[140px] font-semibold">{file.name}</span>
                  <button
                    onClick={handleClearSession}
                    className="text-zinc-400 hover:text-zinc-750 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-0.5 rounded-full transition-colors ml-0.5"
                    title="Clear Session"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            
            {/* CSV & PDF: Data Chat Pane */}
            <ChatPanel activeTab={activeTab} fileType={fileType} parsedData={parsedData} ai={ai} chatHistory={chatHistory} setChatHistory={setChatHistory} suggestedQuestions={suggestedQuestions} messageRefs={messageRefs} />

            {/* CSV: Data Explorer Tab */}
            <DataTable activeTab={activeTab} fileType={fileType} parsedData={parsedData} file={file} />

            {/* CSV: EDA Copilot Tab */}
            <EdaDashboard activeTab={activeTab} fileType={fileType} parsedData={parsedData} file={file} ai={ai} pdfSummary={pdfSummary} pdfSummaryLoading={pdfSummaryLoading} triggerPDFSummaryManual={triggerPDFSummaryManual} />

            {/* Notebook Explainer Tab */}
            <NotebookView activeTab={activeTab} fileType={fileType} parsedData={parsedData} ai={ai} notebookExplanations={notebookExplanations} explainingCellIdx={explainingCellIdx} handleExplainCell={handleExplainCell} />

          </main>
        </div>
      )}



    </div>
  )
}
