import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, generateObject } from "ai";
import { z, ZodType } from "zod";
import { FlashcardOutputSchema, FlashcardOutput } from "../schemas/flashcard.schema";
import { QuizOutputSchema, QuizOutput } from "../schemas/quiz.schema";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || "google/gemma-3-27b-it:free";
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || "openrouter/free"; // alternative "mistralai/mistral-small-3.1-24b-instruct:free"

function getModel(useFallback = false) {
  const modelId = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
  return openrouter(modelId);
}

function extractJSON<T>(text: string, schema: ZodType<T>): T {
  try {
    // Try to find JSON in markdown blocks first
    const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    const jsonStr = match ? match[1] : text;
    
    // Clean up potential leading/trailing garbage
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object found in response");
    
    const cleaned = jsonStr.substring(start, end + 1);
    const parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  } catch (error: any) {
    console.error("JSON Extraction Error:", error.message);
    console.error("Raw text was:", text);
    throw new Error(`Failed to parse AI response as valid JSON: ${error.message}`);
  }
}

export async function generateSummary(notes: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel(),
      prompt: `You are an expert tutor. Summarize the following study notes 
in a clear, structured format with key concepts highlighted.

Notes:
${notes}`,
    });

    return text;
  } catch (error: any) {
    if (error.statusCode === 429) {
      const { text } = await generateText({
        model: getModel(true),
        prompt: `Summarize these study notes clearly and concisely:\n\n${notes}`,
      });
      return text;
    }
    throw error;
  }
}

export async function generateFlashcards(notes: string, count = 10): Promise<FlashcardOutput["flashcards"]> {
  console.log(`Generating ${count} flashcards for notes length: ${notes.length}`);
  const prompt = `You are an expert tutor. Generate exactly ${count} flashcards 
from these study notes. Each flashcard should test one specific concept.

Notes:
${notes}

Respond ONLY with a JSON object in this format:
{
  "flashcards": [
    { "question": "...", "answer": "..." }
  ]
}`;

  try {
    const { text } = await generateText({
      model: getModel(),
      prompt,
    });

    return extractJSON(text, FlashcardOutputSchema).flashcards;
  } catch (error: any) {
    if (error.statusCode === 429) {
      const { text } = await generateText({
        model: getModel(true),
        prompt,
      });
      return extractJSON(text, FlashcardOutputSchema).flashcards;
    }
    console.error("Flashcard generation error:", error.message);
    throw error;
  }
}

export async function generateQuiz(notes: string, count = 5): Promise<QuizOutput["questions"]> {
  const prompt = `You are an expert tutor. Generate exactly ${count} multiple-choice 
questions from these study notes. Make the wrong options plausible but 
clearly incorrect to someone who studied the material.

Notes:
${notes}

Respond ONLY with a JSON object matching this schema:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}`;

  try {
    const { text } = await generateText({
      model: getModel(),
      prompt,
    });

    return extractJSON(text, QuizOutputSchema).questions;
  } catch (error: any) {
    if (error.statusCode === 429) {
      const { text } = await generateText({
        model: getModel(true),
        prompt,
      });
      return extractJSON(text, QuizOutputSchema).questions;
    }
    throw error;
  }
}

export async function extractTextFromImage(imageBuffer: Uint8Array, mimeType: string): Promise<string> {
  try {
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const imageUri = `data:${mimeType};base64,${base64Image}`;

    const { text } = await generateText({
      model: getModel(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a precise text extraction assistant. Look at this image and:
1. Extract ALL text content you can see, including handwritten text.
2. Organize it logically (preserve headings, bullet points, numbered lists).
3. If you see a diagram or chart, describe what it shows in clear text.
4. If handwriting is unclear, make your best guess and put uncertain words in [brackets].

Respond with ONLY the extracted and organized text. No commentary.`,
            },
            {
              type: "image",
              image: imageUri,
            },
          ],
        },
      ],
    });

    return text;
  } catch (error: any) {
    if (error.statusCode === 429) {
      const base64Image = Buffer.from(imageBuffer).toString("base64");
      const imageUri = `data:${mimeType};base64,${base64Image}`;
      
      const { text } = await generateText({
        model: getModel(true),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all text from this image:" },
              { type: "image", image: imageUri },
            ],
          },
        ],
      });
      return text;
    }
    throw error;
  }
}

export async function extractTextFromImageUrl(imageUrl: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this image. Organize logically.",
            },
            {
              type: "image",
              image: new URL(imageUrl),
            },
          ],
        },
      ],
    });

    return text;
  } catch (error: any) {
    if (error.statusCode === 429) {
      const { text } = await generateText({
        model: getModel(true),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all text from this image:" },
              { type: "image", image: new URL(imageUrl) },
            ],
          },
        ],
      });
      return text;
    }
    console.error("Image URL text extraction error:", error.message);
    throw error;
  }
}

export async function generateFlashcardsFromImage(imageBuffer: Uint8Array, mimeType: string, count = 10): Promise<FlashcardOutput["flashcards"]> {
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const imageUri = `data:${mimeType};base64,${base64Image}`;

  console.log(`Generating ${count} flashcards from image (${mimeType})`);
  const messages: any[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `You are an expert tutor. Look at this image of study material 
and generate exactly ${count} flashcards based on the content you see. 
Each flashcard should test one specific concept from the image.

Respond ONLY with a JSON object in this format:
{
  "flashcards": [
    { "question": "...", "answer": "..." }
  ]
}`,
        },
        {
          type: "image",
          image: imageUri,
        },
      ],
    },
  ];

  try {
    const { text } = await generateText({
      model: getModel(),
      messages,
    });

    return extractJSON(text, FlashcardOutputSchema).flashcards;
  } catch (error: any) {
    if (error.statusCode === 429) {
      const { text } = await generateText({
        model: getModel(true),
        messages,
      });
      return extractJSON(text, FlashcardOutputSchema).flashcards;
    }
    throw error;
  }
}

export async function generateQuizFromImage(imageBuffer: Uint8Array, mimeType: string, count = 5): Promise<QuizOutput["questions"]> {
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const imageUri = `data:${mimeType};base64,${base64Image}`;

  const messages: any[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Look at this image of study material and generate exactly ${count} 
multiple-choice questions based on what you see.

Respond ONLY with a JSON object in this format:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}`,
        },
        {
          type: "image",
          image: imageUri,
        },
      ],
    },
  ];

  try {
    const { text } = await generateText({
      model: getModel(),
      messages,
    });

    return extractJSON(text, QuizOutputSchema).questions;
  } catch (error: any) {
    if (error.statusCode === 429) {
      const { text } = await generateText({
        model: getModel(true),
        messages,
      });
      return extractJSON(text, QuizOutputSchema).questions;
    }
    throw error;
  }
}
