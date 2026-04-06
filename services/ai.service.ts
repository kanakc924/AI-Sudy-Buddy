import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, generateObject } from "ai";
import { FlashcardOutputSchema, FlashcardOutput } from "../schemas/flashcard.schema";
import { QuizOutputSchema, QuizOutput } from "../schemas/quiz.schema";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Primary model or a chain of free alternatives
const MODELS = [
  'google/gemma-3-27b-it:free',
  'google/gemma-3-12b-it:free',
  process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/auto',
]

const VISION_MODELS = [
  'google/gemma-3-27b-it:free',
  'google/gemma-3-12b-it:free',
  process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/auto',
]

/**
 * Reusable wrapper that tries a list of models sequentially in case of failures.
 * Now catches not just rate limits (429), but also parsing/validation errors (500)
 * to ensure maximum reliability with free models.
 */
async function withFallback<T>(
  models: string[],
  fn: (modelId: string) => Promise<T>
): Promise<T> {
  let lastError: any;

  for (const modelId of models) {
    try {
      console.log(`Trying model: ${modelId}`);
      const result = await fn(modelId);
      return result;
    } catch (error: any) {
      lastError = error;

      // Log the error detail for debugging
      console.error(`Error with model ${modelId}:`, error.message || error);

      const isRecoverable =
        error?.statusCode === 429 ||
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('rate') ||
        error?.message?.includes('rate-limited') ||
        error?.message?.includes('Failed to process successful response') || // Catch Vercel AI SDK parsing errors
        error?.name === 'AI_ObjectGenerationError' ||
        error?.reason === 'maxRetriesExceeded' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('ETIMEDOUT');

      if (isRecoverable) {
        console.warn(`Model ${modelId} failed with a recoverable error. Trying next model...`);
        continue;
      }

      // Not a recoverable error (e.g. auth issue, invalid input) — throw immediately
      throw error;
    }
  }

  // All models exhausted
  console.error('All models exhausted. Last error:', lastError?.message || lastError);
  throw new Error(
    `AI Generation failed after trying all fallback models. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

// generateSummary
export async function generateSummary(notes: string): Promise<string> {
  return withFallback(MODELS, async (modelId) => {
    const { text } = await generateText({
      model: openrouter(modelId),
      prompt: `You are an expert tutor. Summarize the following study notes 
in a clear, structured format with key concepts highlighted.

Notes:
${notes}`,
    });
    return text;
  });
}

// generateFlashcards
export async function generateFlashcards(
  notes: string,
  count = 10
): Promise<FlashcardOutput['flashcards']> {
  console.log(`Generating ${count} flashcards`);
  return withFallback(MODELS, async (modelId) => {
    const { object } = await generateObject({
      model: openrouter(modelId),
      schema: FlashcardOutputSchema,
      prompt: `You are an expert tutor. Generate exactly ${count} flashcards 
from these study notes. Each flashcard should test one specific concept.

Notes:
${notes}`,
    });
    return object.flashcards;
  });
}

// generateQuiz
export async function generateQuiz(
  notes: string,
  count = 5
): Promise<QuizOutput['questions']> {
  return withFallback(MODELS, async (modelId) => {
    const { object } = await generateObject({
      model: openrouter(modelId),
      schema: QuizOutputSchema,
      prompt: `You are an expert tutor. Generate exactly ${count} multiple-choice 
questions from these study notes. Make the wrong options plausible but 
clearly incorrect to someone who studied the material.

Notes:
${notes}`,
    });
    return object.questions;
  });
}

// extractTextFromImage
export async function extractTextFromImage(
  imageBuffer: Uint8Array,
  mimeType: string
): Promise<string> {
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const imageUri = `data:${mimeType};base64,${base64Image}`;

  return withFallback(VISION_MODELS, async (modelId) => {
    const { text } = await generateText({
      model: openrouter(modelId),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a precise text extraction assistant. Look at this image and:
1. Extract ALL text content you can see, including handwritten text.
2. Organize it logically (preserve headings, bullet points, numbered lists).
3. If you see a diagram or chart, describe what it shows in clear text.
4. If handwriting is unclear, make your best guess and put uncertain words in [brackets].

Respond with ONLY the extracted and organized text. No commentary.`,
            },
            {
              type: 'image',
              image: imageUri,
            },
          ],
        },
      ],
    });
    return text;
  });
}

// extractTextFromImageUrl
export async function extractTextFromImageUrl(imageUrl: string): Promise<string> {
  return withFallback(VISION_MODELS, async (modelId) => {
    const { text } = await generateText({
      model: openrouter(modelId),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Organize logically.',
            },
            {
              type: 'image',
              image: new URL(imageUrl),
            },
          ],
        },
      ],
    });
    return text;
  });
}

// generateFlashcardsFromImage
export async function generateFlashcardsFromImage(
  imageBuffer: Uint8Array,
  mimeType: string,
  count = 10
): Promise<FlashcardOutput['flashcards']> {
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const imageUri = `data:${mimeType};base64,${base64Image}`;
  console.log(`Generating ${count} flashcards from image (${mimeType})`);

  return withFallback(VISION_MODELS, async (modelId) => {
    const { object } = await generateObject({
      model: openrouter(modelId),
      schema: FlashcardOutputSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert tutor. Look at this image of study material 
and generate exactly ${count} flashcards based on the content you see. 
Each flashcard should test one specific concept from the image.`,
            },
            {
              type: 'image',
              image: imageUri,
            },
          ],
        },
      ],
    });
    return object.flashcards;
  });
}

// generateQuizFromImage
export async function generateQuizFromImage(
  imageBuffer: Uint8Array,
  mimeType: string,
  count = 5
): Promise<QuizOutput['questions']> {
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const imageUri = `data:${mimeType};base64,${base64Image}`;

  return withFallback(VISION_MODELS, async (modelId) => {
    const { object } = await generateObject({
      model: openrouter(modelId),
      schema: QuizOutputSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Look at this image of study material and generate exactly ${count} 
multiple-choice questions based on what you see.`,
            },
            {
              type: 'image',
              image: imageUri,
            },
          ],
        },
      ],
    });
    return object.questions;
  });
}

// explainDiagram
export async function explainDiagram(
  imageBuffer: Uint8Array,
  mimeType: string
): Promise<string> {
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const imageUri = `data:${mimeType};base64,${base64Image}`;

  return withFallback(VISION_MODELS, async (modelId) => {
    const { text } = await generateText({
      model: openrouter(modelId),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert educator. Look at this diagram, chart, or 
image and provide a clear step-by-step explanation of:
1. What the diagram shows overall
2. Each key component or element
3. How the parts relate to each other
4. What concept or process it is illustrating

Write in clear, simple language a student would understand.`,
            },
            {
              type: 'image',
              image: imageUri,
            },
          ],
        },
      ],
    });
    return text;
  });
}
