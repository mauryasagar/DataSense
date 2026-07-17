import { useEffect, useState } from 'react';

// Singleton worker references to prevent double loading
let globalWorker = null;
let globalListeners = new Set();
let globalState = {
  status: 'idle', // 'idle' | 'loading' | 'initializing' | 'ready' | 'error'
  progress: 0,
  error: null,
  modelCached: localStorage.getItem('modelCached') === 'true'
};

function getWorker() {
  if (!globalWorker) {
    // Vite handles this URL syntax for compiling workers as bundles
    globalWorker = new Worker(
      new URL('../workers/ai.worker.js', import.meta.url),
      { type: 'module' }
    );

    globalWorker.addEventListener('message', (event) => {
      const { type, payload, status } = event.data;

      if (type === 'STATUS') {
        globalState.status = status;
        emitState();
      } else if (type === 'PROGRESS') {
        const { averageProgress } = payload;
        globalState.progress = Math.round(averageProgress * 100);
        emitState();
      } else if (type === 'MODELS_READY') {
        globalState.status = 'ready';
        globalState.progress = 100;
        globalState.modelCached = true;
        localStorage.setItem('modelCached', 'true');
        
        // Broadcast custom event so the UI can display offline notification
        window.dispatchEvent(new CustomEvent('ai-model-cached'));
        emitState();
      } else if (type === 'ERROR') {
        globalState.status = 'error';
        globalState.error = payload;
        emitState();
      }
    });
    // Auto-start model loading immediately when worker is first created
    globalWorker.postMessage({ type: 'LOAD_MODELS' });
    globalState.status = 'loading';
  }
  return globalWorker;
}

function emitState() {
  globalListeners.forEach(listener => listener({ ...globalState }));
}

export function useAIWorker() {
  const [workerState, setWorkerState] = useState({ ...globalState });

  useEffect(() => {
    const listener = (state) => setWorkerState(state);
    globalListeners.add(listener);

    // Initialize worker (model loading starts automatically in getWorker)
    getWorker();

    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  const loadModels = () => {
    if (globalState.status === 'idle' || globalState.status === 'error') {
      const worker = getWorker();
      worker.postMessage({ type: 'LOAD_MODELS' });
    }
  };

  const executeTask = (type, payload) => {
    return new Promise((resolve, reject) => {
      const worker = getWorker();
      const requestId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Create a temporary message listener for this specific request
      const handleResponse = (event) => {
        const { type: responseType, payload: responsePayload, requestId: responseRequestId } = event.data;

        if (responseRequestId !== requestId) return;

        if (responseType === 'ERROR') {
          worker.removeEventListener('message', handleResponse);
          reject(new Error(responsePayload));
        } else if (
          (type === 'ANSWER_QUESTION' && responseType === 'ANSWER_READY') ||
          (type === 'SUMMARIZE' && responseType === 'SUMMARY_READY') ||
          (type === 'EXPLAIN_CELL' && responseType === 'EXPLAIN_CELL_READY')
        ) {
          worker.removeEventListener('message', handleResponse);
          resolve(responsePayload);
        }
      };

      worker.addEventListener('message', handleResponse);
      worker.postMessage({ type, payload, requestId });
    });
  };

  const answerQuestion = (question, context) => {
    return executeTask('ANSWER_QUESTION', { question, context });
  };

  const summarizeText = (text) => {
    return executeTask('SUMMARIZE', { text });
  };

  const explainCell = (prompt) => {
    return executeTask('EXPLAIN_CELL', { prompt });
  };

  return {
    ...workerState,
    loadModels,
    answerQuestion,
    summarizeText,
    explainCell
  };
}
