
'use server';
/**
 * @fileOverview An AI-powered math tutor.
 *
 * - mathTutor - A function that answers math-related questions and solves problems.
 * - MathTutorInput - The input type for the function.
 * - MathTutorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  MathTutorInputSchema,
  type MathTutorInput,
  MathTutorOutputSchema,
  type MathTutorOutput,
} from '@/ai/schemas/math-tutor-schemas';

export type { MathTutorInput, MathTutorOutput };

export async function mathTutor(input: MathTutorInput): Promise<MathTutorOutput> {
  return mathTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mathTutorPrompt',
  input: { schema: MathTutorInputSchema },
  output: { schema: MathTutorOutputSchema },
  prompt: `You are Matteo, a friendly, patient, and expert math tutor.
  {{#if username}}You are speaking to {{username}}.{{/if}}
  Your goal is to help users understand mathematical concepts, solve math problems, and learn math effectively.
  
  When a user asks a question or presents a problem: "{{question}}"
  1. If it's a math problem, solve it step-by-step.
  2. Explain the concepts clearly and concisely.
  3. Provide examples if they help illustrate the point.
  4. If the question involves a calculation, provide the numerical answer clearly.
  5. Encourage the user and maintain a positive tone.
  6. If the question is not related to mathematics, politely state that you can only help with math-related queries.
  
  Keep your answers suitable for learners of various ages, adapting complexity as needed if implied by the question.
  For example, if asked "What is 2+2?", a simple "2 + 2 equals 4." is fine.
  If asked "How do I solve for x in 2x + 5 = 11?", provide steps:
  "To solve for x in 2x + 5 = 11:
  1. Subtract 5 from both sides: 2x + 5 - 5 = 11 - 5, which simplifies to 2x = 6.
  2. Divide both sides by 2: 2x / 2 = 6 / 2, which gives x = 3.
  So, x equals 3."`,
  config: {
    temperature: 0.5, 
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const mathTutorFlow = ai.defineFlow(
  {
    name: 'mathTutorFlow',
    inputSchema: MathTutorInputSchema,
    outputSchema: MathTutorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.answer) {
      return { answer: "I'm sorry, I couldn't come up with an answer for that math question right now. Please try asking differently or check your question." };
    }
    return output;
  }
);

