const fs = require('fs');

let content = fs.readFileSync('src/pages/AppPage.jsx', 'utf8');

// 1. Imports
content = content.replace(
  "import Footer from '../components/landing/Footer'",
  "import Footer from '../components/landing/Footer'\nimport DataTable from '../components/DataTable'\nimport EdaDashboard from '../components/EdaDashboard'\nimport NotebookView from '../components/NotebookView'\nimport ChatPanel from '../components/ChatPanel'"
);

function removeBetween(startStr, endStr) {
  const start = content.indexOf(startStr);
  const end = content.indexOf(endStr);
  if (start !== -1 && end !== -1) {
    content = content.substring(0, start) + content.substring(end);
    console.log("Removed between:", startStr.slice(0,20), "and", endStr.slice(0,20));
  } else {
    console.log("Failed to remove between:", startStr.slice(0,20), "and", endStr.slice(0,20));
  }
}

function replaceBetween(startStr, endStr, replaceWith) {
  const start = content.indexOf(startStr);
  let end = content.indexOf(endStr, start);
  if (end !== -1) {
      end += endStr.length;
  }
  if (start !== -1 && end !== -1) {
    content = content.substring(0, start) + replaceWith + content.substring(end);
    console.log("Replaced between:", startStr.slice(0,20), "and", endStr.slice(0,20));
  } else {
    console.log("Failed to replace between:", startStr.slice(0,20), "and", endStr.slice(0,20));
  }
}

// 2. Remove SVGChart
removeBetween('// Compact SVG Chart', '// Empty State Dropz');

// 3. Remove retrieveRelevantContext
removeBetween('function retrieveRelevantContext', 'export default function AppPage');

// 4. Remove Chat states
content = content.replace(/  const \[chatInput, setChatInput\] = useState\(''\)\n/g, '');
content = content.replace(/  const \[csvSummary, setCsvSummary\] = useState\(''\)\n/g, '');
content = content.replace(/  const chatEndRef = useRef\(null\)\n/g, '');
content = content.replace(/  const messageRefs = useRef\(\[\]\)\n/g, '');

// Remove unused imports in AppPage
content = content.replace("Send,", "");
content = content.replace("BookOpen, Check", "BookOpen");
content = content.replace("import { determineChartType, extractChartData } from '../utils/chartSelector'\n", "");
content = content.replace("import { answerLocally, buildRichAIContext } from '../utils/nlqEngine'\n", "");

// 5. Remove handleSendQuestion
// starts at `  const handleSendQuestion = async (forcedQuestion) => {`
// ends at `  // Explain single code cell`
removeBetween('  const handleSendQuestion = async (forcedQuestion) => {', '  // Explain single code cell');

// 9. Replace ChatPanel view
replaceBetween("{/* CSV & PDF: Data Chat Pane */}", "{/* CSV: Data Explorer Tab */}",
  "{/* CSV & PDF: Data Chat Pane */}\n            <ChatPanel activeTab={activeTab} fileType={fileType} parsedData={parsedData} ai={ai} chatHistory={chatHistory} setChatHistory={setChatHistory} suggestedQuestions={suggestedQuestions} />\n\n            {/* CSV: Data Explorer Tab */}"
);

// 6. Replace DataTable view
replaceBetween("{/* CSV: Data Explorer Tab */}", "{/* CSV: EDA Copilot Tab */}",
  "{/* CSV: Data Explorer Tab */}\n            <DataTable activeTab={activeTab} fileType={fileType} parsedData={parsedData} file={file} />\n\n            {/* CSV: EDA Copilot Tab */}"
);

// 7. Replace EdaDashboard view
replaceBetween("{/* CSV: EDA Copilot Tab */}", "{/* Notebook Explainer Tab */}",
  "{/* CSV: EDA Copilot Tab */}\n            <EdaDashboard activeTab={activeTab} fileType={fileType} parsedData={parsedData} file={file} ai={ai} pdfSummary={pdfSummary} pdfSummaryLoading={pdfSummaryLoading} triggerPDFSummaryManual={triggerPDFSummaryManual} />\n\n            {/* Notebook Explainer Tab */}"
);

// 8. Replace NotebookView
replaceBetween("{/* Notebook Explainer Tab */}", "</main>",
  "{/* Notebook Explainer Tab */}\n            <NotebookView activeTab={activeTab} fileType={fileType} parsedData={parsedData} ai={ai} notebookExplanations={notebookExplanations} explainingCellIdx={explainingCellIdx} handleExplainCell={handleExplainCell} />\n\n          </main>"
);

fs.writeFileSync('src/pages/AppPage.jsx', content);
console.log("Refactored AppPage.jsx successfully.");
