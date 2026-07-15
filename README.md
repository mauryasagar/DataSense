# 🧠 DataSense

### Local AI Workspace for CSV, PDF & Notebooks

**An offline-first, browser-based sandbox for analyzing CSV files, PDF reports, and Jupyter Notebooks — entirely on-device. No cloud, no API keys, no data uploads.**

**Stack:** React 19 · Vite · Tailwind CSS · `@huggingface/transformers` (ONNX Runtime Web) · WebGPU/WASM

**[🚀 Live App](https://mauryasagar.github.io/DataSense/)**

---

## Overview

Data science students and researchers often work with private or sensitive data — research drafts, financial datasets, confidential notebooks. Uploading that data to cloud LLM providers risks leaks, breaks compliance, and needs constant internet.

**DataSense** solves this by running everything client-side: CSV analysis, PDF Q&A, and notebook explanation, powered by a real language model running fully inside your browser tab via WebGPU/WASM. Nothing you upload ever leaves your machine.

---

## Features

| Feature | Description |
|---|---|
| 💬 **CSV Data Chat** | Natural language queries answered by a local NLQ engine (zero latency for math/stats), with AI fallback for anything else |
| 📊 **EDA Copilot Dashboard** | Row/column KPIs, color-coded missing-value health, descriptive stats, distribution charts, and a heatmapped Pearson correlation matrix |
| 📄 **PDF Document Q&A** | Upload any PDF and ask questions; answered via a local RAG pipeline |
| 📓 **Notebook Explainer** | Upload a `.ipynb` file and get AI explanations for every code cell and its output |
| 📤 **Exportable Reports** | Export your EDA dashboard and chat findings as a PDF report |
| 📱 **Installable PWA** | Installable as a standalone app; model and assets are precached for offline use |
| 🔌 **100% Offline After First Load** | Once the model and app shell are cached, everything works with no internet connection |
| 💾 **Session Persistence** | File metadata, EDA results, and chat history are saved to IndexedDB and restored automatically |

---

## Tech Stack

### Frontend
- **React 19** + **Vite** — UI and build tooling
- **Tailwind CSS** — utility-first styling
- **react-router-dom** (`HashRouter`) — `/` is the landing page, `/app` is the workspace
- **Lucide React** — icons

### AI & Data Engines
- **`@huggingface/transformers`** (ONNX Runtime Web) — runs `onnx-community/SmolLM2-135M-Instruct-ONNX` in a dedicated Web Worker (`ai.worker.js`) so inference never blocks the UI
- **`papaparse`** — CSV parsing
- **`pdfjs-dist`** — PDF parsing
- Custom local engines: `nlqEngine.js` (natural-language-to-stats), `edaEngine.js` (exploratory data analysis), `contextBuilder.js` (RAG context assembly), `chartSelector.js`

### Storage & Export
- **`idb`** — IndexedDB wrapper for session persistence
- **`vite-plugin-pwa`** — installable app + offline asset caching
- **`jsPDF`** + **`html2canvas`** — PDF report export

---

## Project Structure

```
.
├── src/
│   ├── App.jsx                    # Root app + routing
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   ├── context/
│   │   └── ThemeContext.jsx
│   ├── hooks/
│   │   ├── useAIWorker.js         # Web Worker bridge for AI calls
│   │   ├── useFileHandler.js      # CSV/PDF/notebook upload handling
│   │   └── useSession.js          # IndexedDB session persistence
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   └── AppPage.jsx            # Main workspace
│   ├── parsers/
│   │   ├── csvParser.js
│   │   ├── pdfParser.js
│   │   └── notebookParser.js
│   ├── utils/
│   │   ├── nlqEngine.js           # Local natural-language-to-stats engine
│   │   ├── edaEngine.js           # Exploratory data analysis
│   │   ├── contextBuilder.js      # RAG context assembly
│   │   ├── chartSelector.js
│   │   └── pdfExporter.js         # PDF report export
│   ├── workers/
│   │   └── ai.worker.js           # SmolLM2 inference (ONNX Runtime Web)
│   └── components/landing/        # Landing page sections
├── public/
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Getting Started

### Try it instantly (no setup)
Visit **[mauryasagar.github.io/DataSense](https://mauryasagar.github.io/DataSense/)** — Chrome recommended for WebGPU support.

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- npm

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Upload a CSV, PDF, or `.ipynb` file to begin — the AI model downloads and warms up automatically in the background (~35 MB, one time).

### Testing Offline Mode
After the model has loaded and cached once:
1. Open DevTools → Application → Cache Storage to confirm model files are cached
2. Disable Wi-Fi / enable airplane mode
3. Refresh — the app loads and all features still work

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

---

## On-Device AI Specifications

As required by Section 6 of the OSDHack 2026 Resource Guide:

**Model:** [`onnx-community/SmolLM2-135M-Instruct-ONNX`](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX), run via `@huggingface/transformers` (ONNX Runtime Web), with WebGPU acceleration and automatic WASM (SIMD) fallback.

| Metric | Value |
|---|---|
| Baseline size (FP16/FP32) | ~270 MB |
| Quantized footprint (4-bit, `dtype: q4`) | ~35 MB |
| RAM usage during inference | ~100–150 MB |
| First-time model download | ~5–10s |
| Warm-up from cache | ~2–5s |
| NLQ engine (local math/stats) | ~0ms — no AI model needed |
| CSV chat response (AI-assisted) | ~0.5–1.5s |
| PDF Q&A response | ~0.5–1s |
| Summarization latency | ~1–2s |
| Generation rate | ~15–30 tokens/sec (WebGPU, quantized) |

**Pipeline notes:**
- The **NLQ engine** (`answerLocally`) handles ~80% of typical data questions (mean, sum, max, min, median, correlation, distribution) instantly, without touching the AI model.
- **RAG retrieval** uses stopword-filtered keyword overlap to rank and select the top 3 PDF paragraphs per query, capped at ~1500 characters of context.
- The **EDA engine** computes Pearson correlation, IQR-based outlier detection, frequency distributions, and missing-value analysis entirely in browser JavaScript.

---

## License

- **Source Code:** [MIT License](LICENSE)
- **Model Weights:** SmolLM2 is licensed under [Apache 2.0](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct) by Hugging Face. The app downloads the ONNX build [onnx-community/SmolLM2-135M-Instruct-ONNX](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX), which carries the same license.