# DataSense — Local AI Workspace for CSV, PDF & Notebooks

An offline-first, browser-based sandbox for analyzing CSV files, PDF reports, and Jupyter Notebooks entirely on-device — no cloud, no API keys, no data uploads.

---

## 📌 Problem Statement

Data science students and researchers frequently work with private, sensitive, or proprietary data — research drafts, financial datasets, confidential notebooks. Uploading these documents to cloud-based LLM providers (ChatGPT, Claude, Gemini) introduces significant data leakage risks, triggers compliance violations, and depends on continuous high-speed internet. This is a fundamental blocker for privacy-sensitive workflows.

## 📌 Solution Overview

**DataSense** is a fully browser-sandboxed workspace. It enables local analysis of CSV sheets, PDF document Q&A, and Jupyter Notebook cell explanation using client-side AI runtimes via WebAssembly and WebGPU. Raw data is kept strictly private on the user's machine — it never leaves the browser tab.

Key capabilities:
- **CSV Data Chat** — Natural language queries answered by a local NLQ engine (zero latency for math/stats) with AI fallback
- **Redesigned EDA Copilot** — A premium exploratory data analysis dashboard featuring row/column KPIs, color-coded missing value health, descriptive stats, distribution charts, and a heatmapped correlation matrix.
- **PDF Document Q&A** — Upload any PDF and ask questions; answers via local RAG pipeline
- **Notebook Explainer** — Upload a `.ipynb` file and get AI explanations for every code cell
- **100% Offline** — After first model load, works with no internet connection
- **Session Persistence** — Chat history and analysis metadata are restored across browser sessions

---

## 🧠 On-Device AI Usage & Technical Specifications

As required by Section 6 of the OSDHack 2026 Resource Guide, here are the technical specifications of the on-device model stack:

1. **Target Hardware**:
   - Runs locally in modern web browsers using client CPU/GPU. Accelerates inference using **WebGPU** with automatic fallback to **WebAssembly (WASM SIMD)** if WebGPU is not supported.

2. **AI Models & Framework**:
   - **Framework**: `@huggingface/transformers` utilizing ONNX Runtime Web.
   - **Unified Chat Model**: [onnx-community/SmolLM2-135M-Instruct](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct) (Apache-2.0 License).

3. **Model Footprint**:
   - **Baseline Size**: ~270 MB (FP16/FP32).
   - **Quantized Footprint**: **~35 MB** (ONNX format, 4-bit quantized weights `dtype: 'q4'`).
   - **RAM Usage During Inference**: ~100 MB – 150 MB.
   - Model files are cached securely in the browser's Cache Storage (Web Cache API) after the first download — no re-download on subsequent visits.

4. **Performance Metrics (Average Desktop/Laptop CPU/GPU)**:
   - **First-time model download**: **~5–10 seconds** depending on connection speed (only ~35 MB!).
   - **WASM/WebGPU initialization / warm-up** (from cache, runs automatically on page load): **~2–5 seconds**. The app loads and initializes the model in the background immediately.
   - **NLQ Engine (local math/stats queries)**: ~0 ms — computed instantly without the AI model.
   - **CSV chat response time (AI-assisted)**: ~0.5s – 1.5s.
   - **PDF document Q&A response time**: ~0.5s – 1s.
   - **Generative text summarization latency**: ~1s – 2s.
   - **Generation Rate**: ~15–30 tokens/sec (WebGPU, quantized model).

5. **Customization & Pipeline**:
   - **NLQ Engine**: A zero-latency local calculation engine (`answerLocally`) handles all mathematical and descriptive statistical queries (mean, sum, max, min, median, correlation, distribution, etc.) before falling back to the LLM. This covers ~80% of typical data questions with no AI wait time.
   - **RAG Context Retrieval**: Custom paragraph-scoring heuristics (stopword-filtered keyword overlap) rank and select the top 3 PDF paragraphs matching user queries, providing a focused context of ≤ 1500 characters for the model.
   - **EDA Engine**: Full on-device Exploratory Data Analysis — Pearson correlation matrix, IQR-based outlier detection, frequency distributions, missing value analysis — runs entirely in browser JavaScript.

---

## 🛠️ Setup and Usage

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Run

1. Clone the repository and navigate to the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [`http://localhost:5173`](http://localhost:5173) in your browser (Chrome recommended for best WebGPU/WASM performance).
5. Upload a CSV, PDF, or `.ipynb` file to begin analysis immediately.
6. The AI model loads and warms up automatically in the background on page load. A progress bar will show the download status (~35 MB download on the first visit, near-instant initialization on subsequent visits).

### Testing Offline Mode
After the model has loaded and cached:
1. Open DevTools → Application → Cache Storage to confirm model files are cached.
2. Toggle airplane mode / disable Wi-Fi.
3. Refresh the page — the app loads and all features work offline.

---

## 🎥 Demo and Screenshots

- **Walkthrough Demo Video**: *(Add your 2-5 min demo video link here)*
- **Screenshots**: *(Add your screenshots here)*

---

## ⚖️ License

- **Source Code**: Licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.
- **Model Weights**: The SmolLM2 model is licensed under the [Apache 2.0 License](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct) by Hugging Face.