/**
 * Notebook Parser for DataSense
 */

export async function parseNotebook(file) {
  try {
    const text = await file.text();
    const notebook = JSON.parse(text);

    if (!notebook || !notebook.cells || !Array.isArray(notebook.cells)) {
      throw new Error("Invalid Jupyter Notebook format. Missing 'cells' array.");
    }

    const parsedCells = notebook.cells.map((cell, index) => {
      // source is typically an array of lines or a single string
      const source = Array.isArray(cell.source) 
        ? cell.source.join('') 
        : (cell.source || '');

      // Outputs check
      const outputs = cell.outputs || [];
      const hasOutputs = outputs.length > 0;

      // Extract readable outputs text
      const outputText = outputs
        .map(out => {
          if (out.text) {
            return Array.isArray(out.text) ? out.text.join('') : out.text;
          }
          if (out.data) {
            // Render text/plain or image if text/plain is missing
            const textPlain = out.data['text/plain'];
            if (textPlain) {
              return Array.isArray(textPlain) ? textPlain.join('') : textPlain;
            }
          }
          return '';
        })
        .filter(t => t.trim() !== '')
        .join('\n');

      return {
        index,
        type: cell.cell_type || 'code', // 'code', 'markdown', or 'raw'
        source,
        outputs,
        hasOutputs,
        outputText
      };
    });

    const codeCellCount = parsedCells.filter(c => c.type === 'code').length;
    if (codeCellCount === 0) {
      throw new Error("This notebook has no code cells to explain.");
    }

    return parsedCells;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse notebook JSON. The file might be corrupted.");
    }
    throw error;
  }
}
