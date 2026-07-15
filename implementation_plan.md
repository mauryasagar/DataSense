# DataSense Implementation Plan

DataSense is a browser-based, local AI workspace for data students, running fully on-device via Transformers.js (WebAssembly). This plan details the required components and steps to build the features.

## Proposed Changes

We will implement the project features across the following directories and files:

### 1. Dependencies and Configuration

- **Dependencies**: Install `@xenova/transformers`, `papaparse`, `pdfjs-dist`, `idb`, `jspdf`, `html2canvas`.
- **DevDependencies**: Install `vite-plugin-pwa`.
- **[MODIFY] [vite.config.js](./vite.config.js)**: Configure Vite to support PWA plugin, worker options, and resolve any issues with WebWorkers and external libraries.
- **[NEW] [MIT License](./LICENSE)**: Create the MIT License file required by rules.

### 2. File Parsers

- **[NEW] [csvParser.js](./src/parsers/csvParser.js)**: Implement PapaParse integration to return rows, columns, data types, and compile an AI summary and context string.
- **[NEW] [pdfParser.js](./src/parsers/pdfParser.js)**: Implement PDF text extraction using `pdfjs-dist` and the paragraph scoring logic for context retrieval.
- **[NEW] [notebookParser.js](./src/parsers/notebookParser.js)**: Implement .ipynb JSON parser to extract cells, their source code, and outputs.

### 3. Utility Modules

- **[NEW] [edaEngine.js](./src/utils/edaEngine.js)**: Implement calculations for dataset summary, missing values analysis, numeric stats, outlier detection, categorical frequency, and Pearson correlation matrix.
- **[NEW] [chartSelector.js](./src/utils/chartSelector.js)**: Implement natural language question to chart type mapper.
- **[NEW] [contextBuilder.js](./src/utils/contextBuilder.js)**: Implement context-building utilities for the AI model.
- **[NEW] [pdfExporter.js](./src/utils/pdfExporter.js)**: Implement jsPDF + html2canvas session report export.

### 4. AI WebWorker and Hooks

- **[NEW] [ai.worker.js](./src/workers/ai.worker.js)**: Load QA (`distilbert-base-uncased-distilled-squad`) and summarization (`distilbart-cnn-6-6`) models, send loading progress, and process messages (`LOAD_MODELS`, `ANSWER_QUESTION`, `SUMMARIZE`, `EXPLAIN_CELL`).
- **[NEW] [useAIWorker.js](./src/hooks/useAIWorker.js)**: Manage Worker instantiation, message sending, and loading/caching states.
- **[NEW] [useFileHandler.js](./src/hooks/useFileHandler.js)**: Handle drag-and-drop, file type validation, parsing, and error catching.
- **[NEW] [useSession.js](./src/hooks/useSession.js)**: Implement IndexedDB persistence for session restoration.

### 5. UI Integration

- **[MODIFY] [AppPage.jsx](./src/pages/AppPage.jsx)**:
  - Revamp file drop zone to accept CSV, PDF, and .ipynb files.
  - Implement full layout supporting each of the three active modes:
    - **CSV Mode**: Chat with charts, AI-suggested questions, dataset table viewer, and EDA Copilot dashboard (with summary, cards, missing analysis, outlier analysis, top values, and correlation matrix).
    - **PDF Mode**: Document summary, suggested questions, paragraph scoring Q&A.
    - **Notebook Mode**: Cell explanations, sequential "Explain All" button, output rendering.
  - Add Privacy Badge (counter of external requests, locked at 0).
  - Add "Download PDF Report" button and "Clear Session" button.
  - Handle all required error scenarios and AI limitations.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure successful bundle compilation (including worker integration and PWA configuration).

### Manual Verification
- Test file uploads for all three file types.
- Check that the model downloads with a progress bar and loads correctly.
- Test chat, chart generation, and EDA summary in CSV mode.
- Test document summary and Q&A in PDF mode.
- Test cell-by-cell explanation and "Explain All" in Notebook mode.
- Verify IndexedDB persistence across refreshes.
- Verify PDF export matches user session details.
- Verify offline operation by toggling connection off in browser devtools.
