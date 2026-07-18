import { pipeline, env } from '@huggingface/transformers';

// Configure transformers env
env.allowLocalModels = false;

let generatorPipeline = null;

function stripRepetition(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const seen = new Set();
  const out = [];
  for (const s of sentences) {
    const key = s.trim().toLowerCase();
    if (key && seen.has(key)) break; // stop at the first repeated sentence
    seen.add(key);
    out.push(s);
  }
  return out.join(' ').trim();
}

function trimToCompleteSentence(text) {
  const trimmed = text.trim();
  if (/[.!?]["')\]]?$/.test(trimmed)) return trimmed; // already ends cleanly
  // Find the last sentence-ending punctuation and cut there
  const lastEnd = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?'));
  if (lastEnd > 20) { // keep a reasonable minimum length, avoid over-truncating short answers
    return trimmed.slice(0, lastEnd + 1);
  }
  return trimmed; // no good cut point found, leave as-is rather than mangling it further
}

// Track loading progress
const progressMap = {};
let lastSentProgress = -1; // throttle: only send when integer % changes

self.addEventListener('message', async (event) => {
  const { type, payload, requestId } = event.data;

  try {
    switch (type) {
      case 'LOAD_MODELS': {
        self.postMessage({ type: 'STATUS', status: 'loading' });

        const makeProgressCallback = (modelId) => (progress) => {
          if (progress.status === 'progress') {
            progressMap[progress.file] = progress.progress || 0;
            
            // Calculate average progress across all files of this model
            const fileKeys = Object.keys(progressMap);
            const totalProgress = fileKeys.reduce((sum, key) => sum + progressMap[key], 0);
            const avgProgress = totalProgress / fileKeys.length;
            const roundedProgress = Math.round(avgProgress);

            // Throttle: only post when the integer % has increased (never go backward)
            if (roundedProgress > lastSentProgress) {
              lastSentProgress = roundedProgress;
              self.postMessage({
                type: 'PROGRESS',
                payload: {
                  modelId,
                  averageProgress: roundedProgress / 100 // 0 to 1 for the main thread
                }
              });
              // Once download hits 100%, signal the initializing phase
              if (roundedProgress >= 100) {
                self.postMessage({ type: 'STATUS', status: 'initializing' });
              }
            }
          }
        };

        // Load unified SmolLM text-generation pipeline if not loaded
        // NOTE: SmolLM2-135M-Instruct is a very small 135M-parameter model and may struggle to reliably follow 
        // RAG-style grounding instructions. If hallucination persists despite the prompt structure, 
        // upgrading to a larger quantized instruct model (like Qwen2.5-0.5B-Instruct) may be necessary.
        if (!generatorPipeline) {
          generatorPipeline = await pipeline(
            'text-generation',
            'HuggingFaceTB/SmolLM2-135M-Instruct',
            { 
              progress_callback: makeProgressCallback('smollm'),
              dtype: 'q4f16',
              device: 'webgpu'
            }
          ).catch(() => {
            Object.keys(progressMap).forEach(key => delete progressMap[key]);
            lastSentProgress = -1;
            // Fallback to WASM if WebGPU is not available
            return pipeline(
              'text-generation',
              'HuggingFaceTB/SmolLM2-135M-Instruct',
              {
                progress_callback: makeProgressCallback('smollm'),
                dtype: 'q4'
              }
            );
          });
        }

        self.postMessage({ type: 'MODELS_READY' });
        break;
      }

      case 'ANSWER_QUESTION': {
        const { question, context } = payload;
        if (!generatorPipeline) {
          throw new Error("AI Chat model is not loaded yet.");
        }
        
        const wantsDetail = /\b(detailed|breakdown|elaborate|explain|list|summariz|in depth|comprehensive)\b/i.test(question);
        const tokenBudget = wantsDetail ? 150 : 80;

        // Construct Qwen instruction prompt
        const messages = [
          { role: 'system', content: 'You are a document assistant. Only use the provided context to answer. If the answer is not in the context, say so explicitly. Do not use outside knowledge. Answer in no more than 5 complete sentences. Always finish your final sentence — never trail off.' },
          { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer using ONLY the context above.` }
        ];
        let prompt = generatorPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
        prompt += "Answer (context-only, no outside knowledge):";

        const response = await generatorPipeline(prompt, {
          max_new_tokens: tokenBudget,
          temperature: 0.4,
          top_p: 0.9,
          do_sample: true,
          repetition_penalty: 1.15,
          no_repeat_ngram_size: 3,
          return_full_text: false
        });

        let answer = trimToCompleteSentence(stripRepetition(response[0].generated_text.trim().replace(/\\([.\-)])/g, '$1')));
        
        // Remove the appended instruction prompt if the model echoed it back
        if (answer.toLowerCase().startsWith("answer (context-only")) {
          answer = answer.replace(/^answer \(context-only, no outside knowledge\):?\s*/i, '');
        }

        // Lightweight grounding check
        const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'how', 'why', 'where', 'when', 'who', 'which', 'do', 'does', 'did', 'are', 'was', 'were', 'has', 'have', 'had', 'can', 'could', 'should', 'would', 'this', 'that', 'it', 'from', 'as', 'be', 'will', 'not']);
        const answerWords = answer.toLowerCase().split(/[\s_\-?.,!()"']+/).filter(w => w.length > 3 && !stopWords.has(w));
        
        let grounded = true;
        if (answerWords.length > 0) {
          let matchCount = 0;
          const contextLower = context.toLowerCase();
          for (const w of answerWords) {
            if (contextLower.includes(w)) matchCount++;
          }
          // Require at least 20% of the meaningful words to overlap with context
          if ((matchCount / answerWords.length) < 0.2) {
            grounded = false;
          }
        }
        
        if (!grounded) {
          answer = "I couldn't find a clear answer in the document.";
        }

        self.postMessage({ type: 'ANSWER_READY', payload: { answer, score: 1.0 }, requestId });
        break;
      }

      case 'SUMMARIZE': {
        const { text } = payload;
        if (!generatorPipeline) {
          throw new Error("AI Chat model is not loaded yet.");
        }

        // Construct summarization prompt
        const messages = [
          { role: 'system', content: `You are a helpful assistant. Write a clear, concise 2-3 sentence executive summary of the following text. Focus on key details and keep it highly professional.\nText:\n${text}` },
          { role: 'user', content: 'Summarize this text.' }
        ];
        const prompt = generatorPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });

        const response = await generatorPipeline(prompt, {
          max_new_tokens: 100,
          temperature: 0.4,
          top_p: 0.9,
          do_sample: true,
          repetition_penalty: 1.15,
          no_repeat_ngram_size: 3,
          return_full_text: false
        });

        let summary = trimToCompleteSentence(stripRepetition(response[0].generated_text.trim().replace(/\\([.\-)])/g, '$1')));
        
        // Output sanity check to detect greedy degeneration/word salad
        const first200 = summary.substring(0, 200);
        const hasPunctuation = /[.!?]/.test(first200);
        
        // Check for long run of capitalized words without lowercase connectors
        const words = summary.split(/\s+/);
        let consecutiveCaps = 0;
        let isKeywordList = false;
        for (const w of words) {
          if (/^[A-Z][a-zA-Z]*$/.test(w.replace(/[^a-zA-Z]/g, ''))) {
            consecutiveCaps++;
            if (consecutiveCaps > 15) {
              isKeywordList = true;
              break;
            }
          } else if (/^[a-z]+$/.test(w.replace(/[^a-zA-Z]/g, ''))) {
            consecutiveCaps = 0;
          }
        }
        
        if (!hasPunctuation || isKeywordList || summary.length < 20) {
           summary = "Summary could not be generated clearly for this document — try Doc Chat to ask specific questions instead.";
        }

        self.postMessage({ type: 'SUMMARY_READY', payload: { summary }, requestId });
        break;
      }

      case 'EXPLAIN_CELL': {
        const { prompt: cellPrompt } = payload;
        if (!generatorPipeline) {
          throw new Error("AI Chat model is not loaded yet.");
        }

        // Construct explain cell prompt
        const messages = [
          { role: 'system', content: 'You are a data science teacher. Explain the following Jupyter notebook cell code and its output in 2-3 simple sentences.' },
          { role: 'user', content: cellPrompt }
        ];
        const prompt = generatorPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });

        const response = await generatorPipeline(prompt, {
          max_new_tokens: 80,
          temperature: 0.4,
          top_p: 0.9,
          do_sample: true,
          repetition_penalty: 1.15,
          no_repeat_ngram_size: 3,
          return_full_text: false
        });

        const answer = trimToCompleteSentence(stripRepetition(response[0].generated_text.trim().replace(/\\([.\-)])/g, '$1')));
        self.postMessage({ type: 'EXPLAIN_CELL_READY', payload: { answer }, requestId });
        break;
      }

      default:
        console.warn(`AI Worker received unhandled action: ${type}`);
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', payload: error.message || error.toString(), requestId });
  }
});
