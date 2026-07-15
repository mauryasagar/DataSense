import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker — use Vite's BASE_URL so it resolves on both localhost and GitHub Pages
pdfjsLib.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

/**
 * Extracts text from a PDF page while preserving line breaks and paragraph spacing.
 * @param {File} file 
 */
export async function parsePDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pageCount = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      let lastY = null;
      let lastX = null;

      for (const item of textContent.items) {
        if (!item.str) continue;
        
        const x = item.transform[4];
        const y = item.transform[5];

        if (lastY !== null) {
          // If Y coordinate has changed significantly, insert a newline
          const yDiff = Math.abs(y - lastY);
          if (yDiff > 8) {
            pageText += '\n';
          } else if (lastX !== null && x > lastX + 12 && item.str.trim() !== '') {
            // If X coordinate has moved significantly right, insert space
            pageText += ' ';
          }
        }
        pageText += item.str;
        lastY = y;
        lastX = x + (item.width || 0);
      }

      fullText += pageText + '\n\n';
    }

    const cleanedText = fullText.trim();
    if (cleanedText.length === 0) {
      throw new Error("This PDF contains only images. Text extraction is not supported.");
    }

    // Heuristics: group lines into naturally sized paragraphs (300-600 characters)
    const rawLines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const paragraphs = [];
    let currentParagraph = '';

    for (const line of rawLines) {
      if (currentParagraph === '') {
        currentParagraph = line;
      } else {
        const endsWithPeriod = /[.!?:]$/.test(currentParagraph);
        const startsWithCapital = /^[A-Z]/.test(line);

        // Heuristics: Start a new paragraph if previous ends with punctuation and new line starts with a capital letter, OR if current paragraph is sufficiently long
        if (currentParagraph.length > 400 || (endsWithPeriod && startsWithCapital && currentParagraph.length > 150)) {
          paragraphs.push(currentParagraph);
          currentParagraph = line;
        } else {
          // Connect with space
          currentParagraph += ' ' + line;
        }
      }
    }
    if (currentParagraph !== '') {
      paragraphs.push(currentParagraph);
    }

    const wordCount = cleanedText.split(/\s+/).filter(w => w.length > 0).length;

    return {
      fullText: cleanedText,
      paragraphs,
      pageCount,
      wordCount
    };
  } catch (error) {
    if (error.name === 'PasswordException') {
      throw new Error("This PDF is password protected and cannot be read.");
    }
    if (error.message && error.message.includes("images")) {
      throw error;
    }
    throw new Error("This PDF contains only images or has no extractable text. Text extraction is not supported.");
  }
}
