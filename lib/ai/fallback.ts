import { getAiClient } from './config';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy',
});

export async function generateTextWithFallback(prompt: string, options?: { useSearch?: boolean }): Promise<string> {
  const ai = getAiClient();
  let latestError: any = null;

  if (ai) {
    try {
      const config: any = {};
      if (options?.useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response.text) {
        return response.text;
      }
    } catch (error: any) {
      console.warn('Gemini API failed, falling back to Groq...', error?.message);
      latestError = error;
      // Continue to Groq fallback
    }
  } else {
    console.warn('Gemini API key not configured, attempting Groq fallback...');
  }

  // Fallback to Groq
  try {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy') {
      throw new Error('Groq API Key not configured and Gemini failed.');
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });

    return chatCompletion.choices[0]?.message?.content || 'No response generated.';
  } catch (error: any) {
    console.error('Groq fallback also failed:', error?.message);
    // If both failed, throw a generic error that the handlers can catch
    // Make sure we simulate a quota error if Gemini originally threw it, to preserve original user feedback (e.g. 429 logic)
    if (latestError && (latestError.status === 429 || latestError.message?.includes('429') || latestError.message?.includes('quota'))) {
      throw latestError; // Keep the original 429 error so the UI handles it as rate limited
    }
    throw error;
  }
}
