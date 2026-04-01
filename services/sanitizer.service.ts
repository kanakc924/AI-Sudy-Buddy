import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODELS = [
  'google/gemma-3-12b-it:free',
  'google/gemma-2-9b-it:free',
  process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/auto',
];

/**
 * Sanitizes and formats extracted text to fix merged words, broken lines, 
 * and poor spacing while preserving headings and bullet points.
 */
export async function sanitizeText(rawText: string): Promise<string> {
  if (!rawText || rawText.trim().length === 0) return rawText;

  // Step 1: Pre-process with Regex for basic line merging
  // Join lines that don't end in . ! or ? AND are followed by a lowercase letter or space
  let processedText = rawText.replace(/([^.!?:])\n([a-z\s])/g, '$1 $2');

  // Step 2: AI-Powered "Smart Formatting"
  // This handles the "merged words" problem (e.g. "Acomputeris...") 
  // and overall readability while preserving structure.
  try {
    const result = await withFallback(MODELS, async (modelId) => {
      const { text } = await generateText({
        model: openrouter(modelId),
        prompt: `You are a professional text formatter. Your goal is to take noisy, poorly-spaced text from OCR/extraction and make it highly readable for students.

TASKS:
1. WORD SEGMENTATION: If you see merged words like "Acomputeris", fix them into "A computer is".
2. LINE MERGING: If a sentence was split mid-phrase across lines, merge it back into a fluid paragraph.
3. STRUCTURE PRESERVATION: Keep all bullet points (•), numbered lists, and headers (like "Definition", "Uses") exactly as they are.
4. SPACING: Use proper paragraph breaks. Ensure one clear empty line between different sections.
5. NO COMMENTARY: Return ONLY the cleaned text. Do not add "Here is the text" or any introductory remarks.

RAW TEXT TO CLEAN:
${processedText}`,
      });
      return text.trim();
    });

    return result;
  } catch (error) {
    console.error('Text Sanitization Error:', error);
    // Fallback to the regex-processed text if AI fails
    return processedText;
  }
}

/**
 * Reusable fallback wrapper (mirrored from ai.service.ts for consistency)
 */
async function withFallback<T>(
  models: string[],
  fn: (modelId: string) => Promise<T>
): Promise<T> {
  let lastError: any;

  for (const modelId of models) {
    try {
      return await fn(modelId);
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.status === 429 || error?.message?.includes('429');
      if (isRateLimit) continue;
      throw error;
    }
  }
  throw lastError;
}
