import * as pdfjsLib from 'pdfjs-dist';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdfjs worker — use Vite's URL import so it resolves correctly
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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
      
      const items = textContent.items.filter(item => item.str && item.str.trim() !== '');
      
      const columns = [];
      items.forEach(item => {
        const x = item.transform[4];
        let placed = false;
        for (const col of columns) {
          // Cluster items within ~150 pixels of horizontal drift
          if (Math.abs(col.baseX - x) < 150) {
            col.items.push(item);
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push({ baseX: x, items: [item] });
        }
      });

      columns.sort((a, b) => a.baseX - b.baseX);

      let pageText = '';
      for (const col of columns) {
        col.items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 8) return yDiff; // top-to-bottom
          return a.transform[4] - b.transform[4]; // left-to-right
        });

        let lastY = null;
        let lastX = null;
        for (const item of col.items) {
          const x = item.transform[4];
          const y = item.transform[5];

          if (lastY !== null) {
            const yDiff = Math.abs(y - lastY);
            if (yDiff > 8) {
              pageText += '\n';
            } else if (lastX !== null && x > lastX + 12) {
              pageText += ' ';
            }
          }
          pageText += item.str;
          lastY = y;
          lastX = x + (item.width || 0);
        }
        pageText += '\n\n';
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
    
    const abbreviations = ['Mr', 'Ms', 'Dr', 'Inc', 'Ltd', 'e.g', 'i.e', 'U.S', 'U.K', 'vs', 'etc', 'Prof', 'St'];

    for (const line of rawLines) {
      if (currentParagraph === '') {
        currentParagraph = line;
      } else {
        let endsWithPeriod = /[.!?:]$/.test(currentParagraph);
        const startsWithCapital = /^[A-Z]/.test(line);

        if (endsWithPeriod) {
          for (const abbr of abbreviations) {
            if (currentParagraph.endsWith(abbr + '.')) {
              endsWithPeriod = false;
              break;
            }
          }
        }

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
