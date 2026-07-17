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
        
        // Construct Qwen instruction prompt
        const messages = [
          { role: 'system', content: `You are a helpful data assistant. Answer the user's question accurately using only the context provided below. If you cannot find the answer in the context, say "I couldn't find a clear answer in the document.".\nContext:\n${context}` },
          { role: 'user', content: question }
        ];
        const prompt = generatorPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });

        const response = await generatorPipeline(prompt, {
          max_new_tokens: 150,
          temperature: 0.2,
          do_sample: false,
          repetition_penalty: 1.3,
          no_repeat_ngram_size: 3,
          return_full_text: false
        });

        const answer = stripRepetition(response[0].generated_text.trim().replace(/\\([.\-)])/g, '$1'));
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
          { role: 'system', content: `You are a helpful data assistant. Write a clear, concise 2-3 sentence executive summary of the following data metrics. Focus on key details and keep it highly professional.\nText:\n${text}` },
          { role: 'user', content: 'Summarize this data.' }
        ];
        const prompt = generatorPipeline.tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });

        const response = await generatorPipeline(prompt, {
          max_new_tokens: 150,
          temperature: 0.3,
          do_sample: false,
          repetition_penalty: 1.3,
          no_repeat_ngram_size: 3,
          return_full_text: false
        });

        const summary = stripRepetition(response[0].generated_text.trim().replace(/\\([.\-)])/g, '$1'));
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
          temperature: 0.3,
          do_sample: false,
          repetition_penalty: 1.3,
          no_repeat_ngram_size: 3,
          return_full_text: false
        });

        const answer = stripRepetition(response[0].generated_text.trim().replace(/\\([.\-)])/g, '$1'));
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
