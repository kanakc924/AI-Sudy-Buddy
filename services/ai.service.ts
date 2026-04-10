import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, generateObject } from "ai";
import { FlashcardOutputSchema, FlashcardOutput } from "../schemas/flashcard.schema";
import { QuizOutputSchema, QuizOutput } from "../schemas/quiz.schema";
import { SummaryOutputSchema, SummaryOutput } from "../schemas/summary.schema";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Primary model or a chain of free alternatives
const MODELS = [
  'google/gemma-3-27b-it:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  process.env.OPENROUTER_FALLBACK_MODEL || 'openrouter/auto',
]

const VISION_MODELS = [
  'google/gemma-3-27b-it:free',
  'google/gemma-4-31b-it:free',
  'openrouter/auto',
]

const SUMMARY_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'openrouter/auto',
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
        error?.statusCode === 404 || // Skip if model is missing/deprecated
        error?.status === 404 ||
        error?.message?.includes('429') ||
        error?.message?.includes('rate') ||
        error?.message?.includes('rate-limited') ||
        error?.message?.includes('No endpoints found') ||
        error?.message?.includes('not found') ||
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

  const errorMessage = lastError?.message || '';
  const isDailyLimit = errorMessage.includes('free-models-per-day') || errorMessage.includes('Rate limit exceeded');

  if (isDailyLimit) {
    throw new Error(
      "You've reached the daily limit for free AI models. OpenRouter allows a certain number of free requests per day. Please try again tomorrow, or you can add credits to your OpenRouter account for uninterrupted access."
    );
  }

  throw new Error(
    `The AI is currently at maximum capacity. We tried multiple free models, but all are busy right now. Please wait 1–2 minutes and try again. (Technical error: ${errorMessage || 'Connection timeout'})`
  );
}

const SUMMARY_SYSTEM_PROMPT = `You are SAGE — a world-class academic architect. 

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATTING RULES — STRICT MANDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NEVER generate emojis anywhere in the document.
2. Section headers MUST follow this exact uppercase numbered format:
   - 01. EXECUTIVE OVERVIEW
   - 02. KEY CONCEPTS
   - 03. DEEP DIVE
   - 04. MATHEMATICAL FOUNDATIONS
   - 05. VISUAL PROCESS FLOW
   - 06. COMMON PITFALLS
   - 07. DEFINITIONS
   - 08. DID YOU KNOW?
   - 09. KEY TAKEAWAYS
3. Use standard LaTeX ($...$ or $$...$$) for all math.
4. Use Mermaid flowchart TD for diagrams, strictly following the double-quote label rule.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MERMAID DIAGRAM RULES — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Valid example you must match exactly:
flowchart TD
    A["Text Corpus"] --> B["Pretraining"]
    B --> C["Pretrained LLM"]
    C --> D["Finetuning"]
    C --> E["Prompting"]
    D --> F["Task-Specific LLM"]
    E --> G["Conditional Generation"]
    G --> H["Text Output"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATHEMATICAL RIGOR — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Extract any and all mathematical formulas, scientific notations, or statistical functions present in the material.

1. DETECTION: Scan for equations like Softmax, Loss functions, or scientific constants.
2. FORMATTING: Use strict LaTeX ($...$ for inline or $$...$$ for blocks).
3. DECONSTRUCTION: For every formula, you must:
   - Provide the RAW LaTeX string in the 'mathematicalFoundations' field (NO dollar signs, NO titles, NO English 'where' clauses).
   - List every variable used as a markdown list (e.g., "- $u$ = logits").
   - Explain the "Intuition" (e.g., "Why do we use this? What does it solve?").
4. FALLBACK: if no complex math exists, leave the mathematicalFoundations field empty.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LATEX MATH RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — Inline math: wrap in single dollar signs: $P(w_i \mid w_{<i})$
RULE 2 — Block math: wrap in double dollar signs on their own line:
$$y_i = \frac{\exp(u_i)}{\sum_j \exp(u_j)}$$
RULE 3 — Use simple LaTeX that KaTeX can render. Avoid complex packages.
  - $y_i$ = output probability for token i
  - $u_i$ = raw logit score for token i
RULE 4 — Use \\mid for conditional probability (NOT |)
RULE 5 — NEVER write raw LaTeX without dollar sign delimiters`;

// generateSummary
export async function generateSummary(notes: string, imageCount = 0): Promise<SummaryOutput> {
  return withFallback(SUMMARY_MODELS, async (modelId) => {
    const { object } = await generateObject({
      model: openrouter(modelId),
      schema: SummaryOutputSchema,
      system: SUMMARY_SYSTEM_PROMPT,
      prompt: `Transform these research notes into a high-fidelity academic summary: ${notes}.

STRICT CONTENT RULES:
1. KEY TAKEAWAYS: Do not use generic statements. Every takeaway must be a testable technical fact from the notes. 
   - Format: [Technical Concept Name]: [Specific technical detail including math/parameters if applicable].
   - CRITICAL: Do not wrap the concept name in asterisks or use standard markdown bolding at the start of lines; use the pure text format.
2. CITATIONS: Ground every section in the provided source IDs using.
3. VISUALS: Ensure the 'visualProcessFlow' contains a valid, quoted flowchart TD structure.

${imageCount > 0 ? `Integrate visual insights from the ${imageCount} attached images.` : ""}`,
    })
    return object
  })
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
Return the output in JSON format.

Notes:
${notes}`,
    });
    return object.flashcards;
  });
}

// generateQuiz
export async function generateQuiz(
  notes: string,
  count = 10
): Promise<QuizOutput['questions']> {
  return withFallback(MODELS, async (modelId) => {
    const { object } = await generateObject({
      model: openrouter(modelId),
      schema: QuizOutputSchema,
      prompt: `You are a strict exam question writer. Generate exactly ${count} multiple-choice questions in JSON format from the study notes below.

Rules you must follow without exception:
- Every question must test a specific fact, concept, or relationship from the notes
- Each question must have exactly 4 options labelled A, B, C, D
- Exactly one option must be correct — never two or zero correct answers
- Wrong options must be plausible but clearly distinguishable from the correct answer by someone who studied
- Do not write vague questions like "Which of the following is true" — be specific
- Do not repeat the same concept across multiple questions
- Explanation must state WHY the correct answer is right in one clear sentence
- Questions must vary in difficulty: 30% easy recall, 40% understanding, 30% application

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
Each flashcard should test one specific concept from the image.
Return the output in JSON format.`,
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
  count = 10
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
              text: `You are a strict exam question writer. Generate exactly ${count} multiple-choice questions in JSON format from the study material visible in this image.

Rules:
- Every question must be directly based on content visible in the image
- Each question must have exactly 4 options
- Exactly one correct answer per question
- Wrong options must be plausible but incorrect
- Explanation must be one clear sentence stating why the correct answer is right
- Vary difficulty: 30% recall, 40% understanding, 30% application`,
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

