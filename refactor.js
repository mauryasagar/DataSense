const fs = require('fs');

let content = fs.readFileSync('src/pages/AppPage.jsx', 'utf8');

// 1. Imports
content = content.replace(
  "import Footer from '../components/landing/Footer'",
  "import Footer from '../components/landing/Footer'\nimport DataTable from '../components/DataTable'\nimport EdaDashboard from '../components/EdaDashboard'\nimport NotebookView from '../components/NotebookView'\nimport ChatPanel from '../components/ChatPanel'"
);

// 2. Remove SVGChart
const svgMatch = content.match(/\/\/ Compact SVG Chart — theme-matching and responsive\nfunction SVGChart\(\{ type, data \}\) \{[\s\S]*?\n\}\n/m);
if (svgMatch) {
  content = content.replace(svgMatch[0], '');
} else {
  console.log("SVGChart not matched");
}

// 3. Remove retrieveRelevantContext
const ctxMatch = content.match(/function retrieveRelevantContext\(question, paragraphs\) \{[\s\S]*?\n\}\n/m);
if (ctxMatch) {
  content = content.replace(ctxMatch[0], '');
} else {
  console.log("retrieveRelevantContext not matched");
}

// 4. Remove Chat states
content = content.replace(/  const \[chatInput, setChatInput\] = useState\(''\)\n/m, '');
content = content.replace(/  const \[csvSummary, setCsvSummary\] = useState\(''\)\n/m, '');
content = content.replace(/  const chatEndRef = useRef\(null\)\n/m, '');
content = content.replace(/  const messageRefs = useRef\(\[\]\)\n/m, '');

// 5. Remove handleSendQuestion
const hsqMatch = content.match(/  const handleSendQuestion = async \(forcedQuestion\) => \{[\s\S]*?\n  \};\n/m);
if (hsqMatch) {
  content = content.replace(hsqMatch[0], '');
} else {
  console.log("handleSendQuestion not matched");
}

// 6. Replace DataTable view
const dtMatch = content.match(/            \{\/\* CSV: Data Explorer Tab \*\/\}\n            \{activeTab === 'table'[\s\S]*?            \)\n            \}\n/m);
if (dtMatch) {
  content = content.replace(dtMatch[0], "            <DataTable activeTab={activeTab} fileType={fileType} parsedData={parsedData} file={file} />\n");
} else {
  console.log("DataTable view not matched");
}

// 7. Replace EdaDashboard view
const edaMatch = content.match(/            \{\/\* CSV: EDA Copilot Tab \*\/\}\n            \{activeTab === 'eda'[\s\S]*?            \)\n            \}\n/m);
if (edaMatch) {
  content = content.replace(edaMatch[0], "            <EdaDashboard activeTab={activeTab} fileType={fileType} parsedData={parsedData} file={file} ai={ai} pdfSummary={pdfSummary} pdfSummaryLoading={pdfSummaryLoading} triggerPDFSummaryManual={triggerPDFSummaryManual} />\n");
} else {
  console.log("EdaDashboard view not matched");
}

// 8. Replace NotebookView
const nbMatch = content.match(/            \{\/\* Notebook Explainer Tab \*\/\}\n            \{activeTab === 'notebook'[\s\S]*?            \)\n            \}\n/m);
if (nbMatch) {
  content = content.replace(nbMatch[0], "            <NotebookView activeTab={activeTab} fileType={fileType} parsedData={parsedData} ai={ai} notebookExplanations={notebookExplanations} explainingCellIdx={explainingCellIdx} handleExplainCell={handleExplainCell} />\n");
} else {
  console.log("NotebookView not matched");
}

// 9. Replace ChatPanel view
const chatMatch = content.match(/            \{\/\* CSV & PDF: Data Chat Pane \*\/\}\n            \{\(activeTab === 'chat' \|\| activeTab === 'pdf-chat'\)[\s\S]*?            \)\n            \}\n/m);
if (chatMatch) {
  content = content.replace(chatMatch[0], "            <ChatPanel activeTab={activeTab} fileType={fileType} parsedData={parsedData} ai={ai} chatHistory={chatHistory} setChatHistory={setChatHistory} suggestedQuestions={suggestedQuestions} />\n");
} else {
  console.log("ChatPanel view not matched");
}

fs.writeFileSync('src/pages/AppPage.jsx', content);
console.log("Refactored AppPage.jsx");
