import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';
import SVGChart from './SVGChart';
import { determineChartType, extractChartData } from '../utils/chartSelector';
import { answerLocally, buildRichAIContext } from '../utils/nlqEngine';

function retrieveRelevantContext(question, paragraphs) {
  const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'how', 'why', 'where', 'when', 'who', 'which', 'do', 'does', 'did', 'are', 'was', 'were', 'has', 'have', 'had', 'can', 'could', 'should', 'would']);
  const words = question.toLowerCase().split(/[\s_\-?.,]+/).filter(w => w.length > 1 && !stopWords.has(w));
  
  if (words.length === 0) {
    return paragraphs.slice(0, 2).join('\n\n');
  }

  const scoredParagraphs = paragraphs.map((p, idx) => {
    const lp = p.toLowerCase();
    let score = 0;
    words.forEach(w => {
      if (lp.includes(w)) {
        score += 1;
        const regex = new RegExp('\\b' + w + '\\b', 'g');
        const matches = lp.match(regex);
        if (matches) {
          score += matches.length * 0.5;
        }
      }
    });
    return { p, score, idx };
  });

  scoredParagraphs.sort((a, b) => b.score - a.score);

  const selected = [];
  let currentLength = 0;
  for (const item of scoredParagraphs) {
    if (item.score <= 0 && selected.length > 0) break;
    if (currentLength + item.p.length > 1500 && selected.length > 0) continue;
    selected.push(item);
    currentLength += item.p.length;
    if (selected.length >= 3) break;
  }

  selected.sort((a, b) => a.idx - b.idx);
  return selected.map(item => item.p).join('\n\n');
}

export default function ChatPanel({ activeTab, fileType, parsedData, ai, chatHistory, setChatHistory, suggestedQuestions }) {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const messageRefs = useRef([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendQuestion = async (forcedQuestion) => {
    const q = (forcedQuestion || chatInput).trim();
    if (!q) return;

    if (!forcedQuestion) setChatInput('');

    const updatedHistory = [...chatHistory, { question: q, answer: 'Thinking...', loading: true }];
    setChatHistory(updatedHistory);

    try {
      if (fileType === 'csv') {
        const chartType = parsedData.rows ? determineChartType(q) : null;
        const chartData = parsedData.rows ? extractChartData(chartType, parsedData.edaResult, parsedData.columns, parsedData.rows) : null;

        const localResult = parsedData.rows ? answerLocally(q, parsedData) : null;
        if (localResult) {
          setChatHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              question: q,
              answer: localResult.answer,
              chartType: chartData ? chartType : null,
              chartData: chartData,
              loading: false
            };
            return next;
          });
          return;
        }

        if (ai.status !== 'ready') {
          setChatHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              question: q,
              answer: `I couldn't compute a direct answer to that question from the data.\n\nTip: Try asking things like:\n- "What is the average Revenue?"\n- "Show me the total Units"\n- "What are the top categories?"\n- "How many rows are there?"`,
              chartType: chartData ? chartType : null,
              chartData: chartData,
              loading: false
            };
            return next;
          });
          return;
        }

        const richContext = buildRichAIContext(parsedData);
        const result = await ai.answerQuestion(q, richContext);

        const answer = result?.answer || `I couldn't find a precise answer to "${q}".`;

        setChatHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            question: q,
            answer,
            chartType: chartData ? chartType : null,
            chartData: chartData,
            loading: false
          };
          return next;
        });
      } else if (fileType === 'pdf') {
        if (ai.status !== 'ready') {
          setChatHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              question: q,
              answer: "Load AI Models first to chat with your document.",
              loading: false
            };
            return next;
          });
          return;
        }

        const relevantContext = retrieveRelevantContext(q, parsedData.paragraphs);
        if (!relevantContext.trim()) {
          setChatHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              question: q,
              answer: "Could not retrieve any relevant text segments in this PDF.",
              loading: false
            };
            return next;
          });
          return;
        }

        const result = await ai.answerQuestion(q, relevantContext);
        const answer = result?.answer || "I couldn't find a clear answer in the document text for that question.";

        setChatHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            question: q,
            answer,
            loading: false
          };
          return next;
        });
      }
    } catch (err) {
      setChatHistory(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          question: q,
          answer: "Sorry, I encountered an error: " + (err.message || ''),
          loading: false
        };
        return next;
      });
    }
  };

  if ((activeTab !== 'chat' && activeTab !== 'pdf-chat') || (fileType !== 'csv' && fileType !== 'pdf')) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-6 max-w-xl mx-auto py-12 group">
            <div className="icon-box glow group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300 w-16 h-16 rounded-2xl shadow-xl">
              <MessageSquare className="w-7 h-7 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-xl tracking-tight mb-2">Ask questions about your {fileType === 'pdf' ? 'document' : 'data'}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                AI processes metadata and paragraph summaries locally. Your raw values are never transmitted.
              </p>
            </div>

            {(fileType === 'csv' || fileType === 'pdf') && suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2.5 justify-center mt-6 w-full max-w-2xl">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendQuestion(q)}
                    className="px-4 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-xs font-semibold hover:border-zinc-400 dark:hover:border-zinc-500 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer text-left max-w-full truncate backdrop-blur-md"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className="space-y-2.5 animate-fade-in">
            <div className="flex justify-end">
              <div className="w-fit max-w-[80%] px-4 py-2.5 rounded-2xl text-[14px] sm:text-[15px] font-semibold leading-relaxed bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-tr-sm shadow-md">
                {msg.question}
              </div>
            </div>

            <div className="flex justify-start">
              <div className="w-fit max-w-[90%] md:max-w-[580px] p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl rounded-tl-sm text-[14px] sm:text-[15px] leading-relaxed space-y-3 shadow-sm">
                {msg.loading ? (
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                    <span className="font-semibold font-mono text-xs animate-pulse">Running local model inference...</span>
                  </div>
                ) : (
                  <>
                    <div className="font-medium text-zinc-850 dark:text-zinc-200 whitespace-pre-wrap space-y-2">
                      {msg.answer.split('\n').map((line, li) => {
                        const parts = line.split(/\*\*(.+?)\*\*/g);
                        return (
                          <p key={li} className={line.startsWith('-') ? 'ml-2' : ''}>
                            {parts.map((part, pi) =>
                              pi % 2 === 1
                                ? <strong key={pi} className="text-zinc-950 dark:text-zinc-50">{part}</strong>
                                : part
                            )}
                          </p>
                        );
                      })}
                    </div>

                    {msg.chartType && msg.chartData && (
                      <div
                        ref={el => messageRefs.current[i] = el}
                        className="pt-4 border-t border-zinc-150 dark:border-zinc-800/80 space-y-2"
                      >
                        <SVGChart type={msg.chartType} data={msg.chartData} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      <div className="flex-shrink-0 border-t border-zinc-200/80 dark:border-zinc-800/80 p-4 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md z-10">
        <div className="max-w-4xl mx-auto flex gap-3.5 items-end">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendQuestion()
              }
            }}
            placeholder={fileType === 'pdf' ? "Ask anything about this document..." : "Ask anything about your data (e.g. what is the average revenue?)..."}
            rows={1}
            className="flex-1 resize-none rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 px-5 py-3.5 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
          />
          <button
            onClick={() => handleSendQuestion()}
            disabled={!chatInput.trim()}
            className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-95 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
