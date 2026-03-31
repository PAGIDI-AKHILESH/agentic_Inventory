import 'dotenv/config';
import { getAiClient } from './lib/ai/config.ts';

async function test() {
  try {
    const ai = getAiClient();
    console.log('Testing Normal Chat...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Hello'
    });
    console.log('Text Response:', response.text);
  } catch (err: any) {
    console.error('An error occurred during Normal Chat:');
    console.error(JSON.stringify(err, null, 2));
  }
}

test();
