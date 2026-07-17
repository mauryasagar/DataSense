<div align="center">

# 🧠 DataSense

### Local AI Workspace for CSV, PDF & Notebooks

**An offline-first, browser-based sandbox for analyzing CSV files, PDF reports, and Jupyter Notebooks — entirely on-device.**
**No cloud. No API keys. No data uploads.**

**Stack:** React 19 · Vite · Tailwind CSS · `@huggingface/transformers` (ONNX Runtime Web) · WebGPU/WASM

### [Live App](https://mauryasagar.github.io/DataSense/)

</div>

---

## 📌 Overview

Data science students and researchers often work with private or sensitive data — research drafts, financial datasets, confidential notebooks. Uploading that data to cloud LLM providers risks leaks, breaks compliance, and needs constant internet.

**DataSense** solves this by running everything client-side: CSV analysis, PDF Q&A, and notebook explanation, powered by a real language model running fully inside your browser tab via WebGPU/WASM. Nothing you upload ever leaves your machine.

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 💬 CSV Data Chat
Natural language queries answered by a local NLQ engine (zero latency for math/stats), with AI fallback for anything else.

### 📊 EDA Copilot Dashboard
Row/column KPIs, color-coded missing-value health, descriptive stats, distribution charts, and a heatmapped Pearson correlation matrix.

### 📄 PDF Document Q&A
Upload any PDF and ask questions — answered via a local RAG pipeline.

### 📓 Notebook Explainer
Upload a `.ipynb` file and get AI explanations for every code cell and its output.

</td>
<td width="50%" valign="top">

### 📤 Exportable Reports
Export your EDA dashboard and chat findings as a PDF report.

### 📱 Installable PWA
Installable as a standalone app; model and assets are precached for offline use.

### 🔌 100% Offline After First Load
Once the model and app shell are cached, everything works with no internet connection.

### 💾 Session Persistence
File metadata, EDA results, and chat history are saved to IndexedDB and restored automatically.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top">

**Frontend**
- React 19 + Vite
- Tailwind CSS
- `react-router-dom` (HashRouter)
- Lucide React

</td>
<td valign="top">

**AI & Data Engines**
- `@huggingface/transformers` (ONNX Runtime Web)
- SmolLM2-135M-Instruct in a Web Worker
- `papaparse` · `pdfjs-dist`
- Custom NLQ, EDA & RAG engines

</td>
<td valign="top">

**Storage & Export**
- `idb` (IndexedDB)
- `vite-plugin-pwa`
- `jsPDF` + `html2canvas`

</td>
</tr>
</table>

---

## 📂 Project Structure

```
.
├── src/
│   ├── App.jsx                    # Root app + routing
│   ├── main.jsx                   # React entry point
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

## 🚀 Getting Started

### Try it instantly — no setup
Visit **[mauryasagar.github.io/DataSense](https://mauryasagar.github.io/DataSense/)** — Chrome recommended for WebGPU support.

### Run it locally

```bash
git clone https://github.com/mauryasagar/DataSense.git
cd DataSense
npm install
npm run dev
```

Open **http://localhost:5173** and upload a CSV, PDF, or `.ipynb` file to begin. The AI model downloads and warms up automatically in the background (~35 MB, one time only).

### Test offline mode
1. Load the app once so the model caches
2. Open DevTools → Application → Cache Storage to confirm it's cached
3. Turn on airplane mode and refresh — everything still works

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

---

## 🧠 On-Device AI Specifications

<sub>As required by Section 6 of the OSDHack 2026 Resource Guide</sub>

**Model:** [`HuggingFaceTB/SmolLM2-135M-Instruct`](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct) — run via `@huggingface/transformers` (ONNX Runtime Web), WebGPU-accelerated with automatic WASM (SIMD) fallback.

| Metric | Value |
|---|---|
| Baseline size (FP16/FP32) | ~270 MB |
| Quantized footprint (4-bit) | **~35 MB** |
| RAM usage during inference | ~100–150 MB |
| First-time model download | ~5–10s |
| Warm-up from cache | ~2–5s |
| NLQ engine (local math/stats) | ~0ms — no AI needed |
| CSV chat response (AI-assisted) | ~0.5–1.5s |
| PDF Q&A response | ~0.5–1s |
| Summarization latency | ~1–2s |
| Generation rate | ~15–30 tokens/sec |

**How it's fast:**
- **NLQ engine** answers ~80% of typical data questions (mean, sum, correlation, distribution, etc.) instantly, without touching the AI model
- **RAG retrieval** uses stopword-filtered keyword overlap to select the top 3 relevant PDF paragraphs per query
- **EDA engine** computes correlation, outliers, and distributions entirely in browser JavaScript

---

## Screenshots
 
<img src="https://github.com/user-attachments/assets/692d0e4f-1f85-41b7-bb4d-04d3ee71a1c9" alt="Landing Page" width="500" />
<p><em>Landing page</em></p>

<img src="https://github.com/user-attachments/assets/81c2c5a8-d057-46b5-af2b-fec9eb92d8d0" alt="EDA Copilot Dashboard" width="500" />
<p><em>EDA Copilot — instant local analysis</em></p>

<img src="https://github.com/user-attachments/assets/8be7f116-5f1b-4a4c-959a-c80dcbf2d5f5" alt="Notebook Explainer" width="500" />
<p><em>Notebook Explainer</em></p>

---

## ⚖️ License

| | |
|---|---|
| **Source Code** | [MIT License](LICENSE) |
| **Model Weights** | [Apache 2.0](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct) by Hugging Face — the app downloads the ONNX build [`HuggingFaceTB/SmolLM2-135M-Instruct`](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct), same license |

---

Built for OSDHack 2026.
