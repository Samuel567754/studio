'use server';
/**
 * @fileOverview AI-powered reading passage generation flow.
 *
 * - generateReadingPassage - A function that generates a reading passage.
 * - GenerateReadingPassageInput - The input type for the generateReadingPassage function.
 * - GenerateReadingPassageOutput - The return type for the generateReadingPassage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReadingPassageInputSchema = z.object({
  words: z
    .array(z.string())
    .describe('A list of words to incorporate into the passage.'),
  readingLevel: z
    .string()
    .describe(
      'The target reading level for the passage (e.g., beginner, intermediate, advanced).'
    ),
});
export type GenerateReadingPassageInput = z.infer<
  typeof GenerateReadingPassageInputSchema
>;

const GenerateReadingPassageOutputSchema = z.object({
  passage: z
    .string()
    .describe('The generated reading passage.'),
});
export type GenerateReadingPassageOutput = z.infer<
  typeof GenerateReadingPassageOutputSchema
>;

export async function generateReadingPassage(
  input: GenerateReadingPassageInput
): Promise<GenerateReadingPassageOutput> {
  return generateReadingPassageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReadingPassagePrompt',
  input: {schema: GenerateReadingPassageInputSchema},
  output: {schema: GenerateReadingPassageOutputSchema},
  prompt: `You are an AI assistant tasked with creating short, engaging reading passages for language learners.
  The passage should be appropriate for the specified reading level and incorporate several of the provided words.

  Reading Level: {{{readingLevel}}}
  Words to include (try to use at least a few of these naturally):
  {{#each words}}
  - {{{this}}}
  {{/each}}

  Please generate a passage that is 5-8 sentences long. Ensure the vocabulary and sentence structure are suitable for the reading level.
  The passage should make sense and be interesting for a learner.
  Output only the passage itself.`,
  config: {
    temperature: 0.7, // Allow for some creativity
     safetySettings: [ // Add safety settings to prevent harmful content
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }
});

const generateReadingPassageFlow = ai.defineFlow(
  {
    name: 'generateReadingPassageFlow',
    inputSchema: GenerateReadingPassageInputSchema,
    outputSchema: GenerateReadingPassageOutputSchema,
  },
  async input => {
    if (input.words.length === 0) {
        return { passage: "Please learn some words first to generate a reading passage." };
    }
    const {output} = await prompt(input);
    return output!;
  }
);

