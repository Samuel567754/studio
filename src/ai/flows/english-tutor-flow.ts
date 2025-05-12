
'use server';
/**
 * @fileOverview An AI-powered English language tutor.
 *
 * - englishTutor - A function that answers English language questions.
 * - EnglishTutorInput - The input type for the function.
 * - EnglishTutorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  EnglishTutorInputSchema,
  type EnglishTutorInput,
  EnglishTutorOutputSchema,
  type EnglishTutorOutput,
} from '@/ai/schemas/english-tutor-schemas';

export type { EnglishTutorInput, EnglishTutorOutput };

export async function englishTutor(input: EnglishTutorInput): Promise<EnglishTutorOutput> {
  return englishTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'englishTutorPrompt',
  input: { schema: EnglishTutorInputSchema },
  output: { schema: EnglishTutorOutputSchema },
  prompt: `You are Lexi, a friendly and knowledgeable English language tutor.
  {{#if username}}You are speaking to {{username}}.{{/if}}
  Your goal is to help users understand English vocabulary, grammar, usage, idioms, and concepts related to learning English.
  Answer the user's question: "{{question}}"
  Keep your answers concise, clear, and easy to understand, suitable for language learners.
  Provide examples when helpful.
  If the question is not related to English language learning, politely state that you can only help with English-related queries.`,
  config: {
    temperature: 0.6, 
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const englishTutorFlow = ai.defineFlow(
  {
    name: 'englishTutorFlow',
    inputSchema: EnglishTutorInputSchema,
    outputSchema: EnglishTutorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.answer) {
      return { answer: "I'm sorry, I couldn't come up with an answer right now. Please try asking differently." };
    }
    return output;
  }
);
