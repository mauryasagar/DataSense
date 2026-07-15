import { useState } from 'react';
import { parseCSV } from '../parsers/csvParser';
import { parseNotebook } from '../parsers/notebookParser';
import { parsePDF } from '../parsers/pdfParser';

export function useFileHandler() {
  const [file, setFile] = useState(null); // File object or mock file object (for session restore)
  const [fileType, setFileType] = useState(null); // 'csv' | 'pdf' | 'ipynb'
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    setError(null);
    setLoading(true);

    try {
      // 1. File size check (Max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        throw new Error("File too large. Maximum supported size is 50MB.");
      }

            // 2. Extension detection
      const fileName = selectedFile.name.toLowerCase();
      let type = null;
      if (fileName.endsWith('.csv')) {
        type = 'csv';
      } else if (fileName.endsWith('.ipynb')) {
        type = 'ipynb';
      } else if (fileName.endsWith('.pdf')) {
        type = 'pdf';
      } else {
        throw new Error("Only CSV, PDF, and .ipynb files are supported");
      }

            // 3. Parser execution
      let data = null;
      if (type === 'csv') {
        data = await parseCSV(selectedFile);
      } else if (type === 'ipynb') {
        data = await parseNotebook(selectedFile);
      } else if (type === 'pdf') {
        data = await parsePDF(selectedFile);
      }

      setFile(selectedFile);
      setFileType(type);
      setParsedData(data);
    } catch (err) {
      setError(err.message || "An unexpected error occurred during parsing.");
      setFile(null);
      setFileType(null);
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionData = (restoredFile, restoredFileType, restoredParsedData) => {
    setFile(restoredFile);
    setFileType(restoredFileType);
    setParsedData(restoredParsedData);
    setError(null);
    setLoading(false);
  };

  const clearFile = () => {
    setFile(null);
    setFileType(null);
    setParsedData(null);
    setError(null);
    setLoading(false);
  };

  return {
    file,
    fileType,
    parsedData,
    loading,
    error,
    handleFile,
    clearFile,
    loadSessionData
  };
}
