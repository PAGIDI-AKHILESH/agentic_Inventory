import 'dotenv/config';
import { generateTextWithFallback } from './lib/ai/fallback';

async function test() {
  try {
    // Force Groq fallback by unsetting Gemini
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = '';
    process.env.GEMINI_API_KEY = '';
    
    // Ensure GROQ_API_KEY is present
    console.log("GROQ key:", process.env.GROQ_API_KEY?.substring(0, 8) + "...");
    
    const text = await generateTextWithFallback("Hello, test");
    console.log("Success:", text);
  } catch (err: any) {
    console.error("Error:", err.message || err);
    if (err.error) console.error(JSON.stringify(err.error));
  }
}
test();
