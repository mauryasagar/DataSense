import { jsPDF } from 'jspdf';

/**
 * Convert an SVG element to a base64 PNG data URL via OffscreenCanvas.
 * Falls back to returning null if not supported.
 */
async function svgToPngDataUrl(svgEl, scale = 2) {
  try {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.width || svgEl.clientWidth || 560;
        const h = img.height || svgEl.clientHeight || 340;
        const canvas = document.createElement('canvas');
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  } catch {
    return null;
  }
}

/**
 * Export current workspace session to a PDF report.
 * @param {string} fileName
 * @param {string} fileType
 * @param {Object} stats
 * @param {Array<Object>} sessionItems  - chat history (CSV) or cell explanations (ipynb)
 * @param {Array<HTMLElement|null>} chartElements  - DOM refs for chart containers
 */
export async function exportSessionReport(fileName, fileType, stats, sessionItems, chartElements = []) {
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const PW = doc.internal.pageSize.getWidth();   // 210
    const PH = doc.internal.pageSize.getHeight();  // 297
    const M = 18;                                   // margin
    const CW = PW - 2 * M;                         // content width
    const ACCENT = [99, 102, 241];                  // indigo-500

    let y = M;

    // ── Helpers ─────────────────────────────────────────────────────────────
    const newPage = () => {
      footer();
      doc.addPage();
      y = M;
    };

    const ensureSpace = (needed) => {
      if (y + needed > PH - M - 12) newPage();
    };

    const footer = () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 170);
      doc.text('DataSense · 100% Private · On-Device AI · No Cloud', PW / 2, PH - 8, { align: 'center' });
      const pg = doc.internal.getNumberOfPages();
      doc.text(`Page ${pg}`, PW - M, PH - 8, { align: 'right' });
    };

    const rule = (color = [228, 228, 230]) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.line(M, y, PW - M, y);
      y += 5;
    };

    // ── Cover Header ────────────────────────────────────────────────────────
    // Indigo accent bar
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, PW, 2.5, 'F');

    y = 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(9, 9, 11);
    doc.text('DataSense AI Report', M, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text(`Generated: ${new Date().toLocaleString()}`, M, y);
    y += 10;

    rule(ACCENT);

    // ── File Details ─────────────────────────────────────────────────────────
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(M, y, CW, 28, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text('WORKSPACE DETAILS', M + 5, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(39, 39, 42);
    doc.text(`File: ${fileName}`, M + 5, y + 14);
    doc.text(`Mode: ${fileType.toUpperCase()}`, M + 5, y + 20);

    const statsText = fileType === 'csv'
      ? `Rows: ${stats.totalRows ?? 'N/A'}   Columns: ${stats.totalCols ?? 'N/A'}`
      : fileType === 'pdf'
      ? `Pages: ${stats.pageCount ?? 'N/A'}   Words: ${stats.wordCount ?? 'N/A'}   Paragraphs: ${stats.paragraphs ?? 'N/A'}`
      : `Cells: ${stats.totalCells ?? 'N/A'}   Code Cells: ${stats.codeCells ?? 'N/A'}`;
    doc.text(statsText, M + 80, y + 14);
    y += 34;

    // ── Section Title ────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(9, 9, 11);
    doc.text(fileType === 'csv' ? 'Chat Q&A Log' : fileType === 'pdf' ? 'Document Q&A Log' : 'Notebook Cell Explanations', M, y);
    y += 6;
    rule();

    // ── Session Items ─────────────────────────────────────────────────────────
    for (let i = 0; i < sessionItems.length; i++) {
      const item = sessionItems[i];

      let title = '';
      let body = '';

      if (fileType === 'csv' || fileType === 'pdf') {
        title = `Q${i + 1}: ${item.question || ''}`;
        body = item.answer || '';
      } else {
        title = `Cell ${(item.index ?? i) + 1} · ${item.cellType || 'code'}`;
        body = item.explanation || '(No explanation generated)';
      }

      const splitTitle = doc.splitTextToSize(title, CW);
      const splitBody  = doc.splitTextToSize(body, CW - 4);
      const titleH = splitTitle.length * 5.2;
      const bodyH  = splitBody.length * 4.6;

      ensureSpace(titleH + bodyH + 10);

      // Question / title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...ACCENT);
      doc.text(splitTitle, M, y);
      y += titleH + 1;

      // Answer / body
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(39, 39, 42);
      doc.text(splitBody, M + 2, y);
      y += bodyH + 3;

      // Chart
      const chartEl = chartElements[i];
      if (fileType === 'csv' && item.chartType && chartEl) {
        // Try to find the SVG inside the chart container
        const svgEl = chartEl.querySelector('svg');
        let imgData = null;

        if (svgEl) {
          imgData = await svgToPngDataUrl(svgEl, 2.5);
        }

        if (imgData) {
          const chartH = 68; // mm
          ensureSpace(chartH + 8);

          // Label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...ACCENT);
          doc.text(`Generated ${item.chartType} chart`, M, y);
          y += 4;

          doc.addImage(imgData, 'PNG', M, y, CW, chartH);
          y += chartH + 4;
        }
      }

      // Separator
      if (i < sessionItems.length - 1) {
        ensureSpace(8);
        doc.setDrawColor(228, 228, 230);
        doc.setLineWidth(0.2);
        doc.line(M, y, PW - M, y);
        y += 6;
      }
    }

    footer();

    const safeName = fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    doc.save(`datasense-${safeName}-report.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Export error:', error);
    throw new Error('Failed to export PDF: ' + error.message);
  }
}
