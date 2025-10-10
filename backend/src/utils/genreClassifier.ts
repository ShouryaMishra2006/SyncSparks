// backend/src/utils/genreClassifier.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";


export interface AiResult {
  title: string;
  text: string;
  bullets: string[];
  raw?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface GenreClassificationResult {
  genre: string;
  
}

/**
 * genreClassifier
 * Uses AI (or fallback) to classify AiResult into a genre.
 * @param aiResult - The full AI-generated idea payload
 * @returns Promise<{ genre: string; confidence?: number }>
 */

// ====================
//  LLM INITIALIZATION
// ====================

const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
  temperature: 0.3,
});
// ====================
//  PROMPT TEMPLATE
// ====================

const genrePrompt = PromptTemplate.fromTemplate(`
You are a professional creative story genre classifier.

Given the following creative idea, identify its most appropriate genre.

Respond ONLY with one short genre label (e.g. "Science Fiction", "Fantasy", "Romantic Comedy", "Thriller", "Drama", "Horror", etc.)

Title: {title}
Text: {text}

Return ONLY the genre name. Do not explain.
`);

// ====================
//  GENRE CLASSIFIER CHAIN
// ====================


export const genreClassifier = async (aiResult: AiResult): Promise<GenreClassificationResult> => {
  const chain = RunnableSequence.from([genrePrompt, gemini]);

  const response = await chain.invoke({
    title: aiResult.title,
    text: aiResult.text,
  });
  // Safely extract the genre whether the response is string or object
  let genre: string = "Uncategorized";
  if (!response.content) return { ...aiResult, genre };


  if (typeof response.content === "string") {
    genre = response.content.trim();
  } else if (Array.isArray(response.content) && response.content.length > 0) {
    const first = response.content[0];
    // first could be string or MessageContentComplex
    if (typeof first === "string") genre = (first as string).trim();
    else if (first && typeof first === "object" && "text" in first && typeof first.text === "string") {
      genre = first.text.trim();}
    else genre = JSON.stringify(first).slice(0, 50); // fallback
  }

  return { ...aiResult, genre };
}