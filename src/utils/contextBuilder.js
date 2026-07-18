/**
 * Context Builder utility for DataSense
 * Consolidates the building of AI prompts and contexts for all supported file types.
 */






/**
 * Builds the notebook cell explanation prompt context
 */
export function buildNotebookContext(index, source, outputText, previousImports = []) {
  const importsText = previousImports.length > 0 
    ? previousImports.slice(0, 8).join(', ') 
    : 'None';

  const sourceClean = (source || '').slice(0, 300);
  const outputClean = (outputText || '').trim().slice(0, 200);

  let prompt = `Python notebook cell [${index}].\n`;
  prompt += `Imports used so far: [${importsText}].\n`;
  prompt += `Current cell code:\n${sourceClean}\n`;
  if (outputClean && outputClean !== '') {
    prompt += `Output: ${outputClean}\n`;
  }
  prompt += `Explain what this cell does in 2-3 simple sentences for a beginner data science student.`;
  return prompt;
}
