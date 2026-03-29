import { GoogleGenAI } from '@google/genai';

export function getGeminiApiKey(): string | null {
  const apiKey = (
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    process.env.API_KEY
  )?.trim();

  if (!apiKey || apiKey === 'TODO_KEYHERE' || apiKey === '') {
    return null;
  }
  return apiKey;
}

export function getAiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}
