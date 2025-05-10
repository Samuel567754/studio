
'use server';
/**
 * @fileOverview AI-powered reading passage generation flow.
 *
 * - generateReadingPassage - A function that generates a reading passage.
 * - GenerateReadingPassageInput - The input type for the generateReadingPassage function.
 * - GenerateReadingPassageOutput - The return type for the generateReadingPassage function.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateReadingPassageInputSchema,
  type GenerateReadingPassageInput,
  GenerateReadingPassageOutputSchema,
  type GenerateReadingPassageOutput
} from '@/ai/schemas/reading-passage-schemas';

export type { GenerateReadingPassageInput, GenerateReadingPassageOutput };

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

  {{#if masteredWords}}
  The learner has already mastered the following words:
  {{#each masteredWords}}
  - {{{this}}}
  {{/each}}
  Given this, you can subtly increase the complexity of the surrounding text or use a slightly richer vocabulary, while staying true to the overall '{{{readingLevel}}}' reading level. The primary goal is still to use the 'Words to include' list.
  {{/if}}

  {{#if favoriteTopics}}
  The learner is interested in the following topics: {{{favoriteTopics}}}.
  Please try to create a story related to one or more of these topics. If the topics are very diverse, pick one that fits well with the words to include.
  {{/if}}

  Please generate a passage that is 10-15 sentences long. Ensure the vocabulary and sentence structure are suitable for the reading level.
  The passage should make sense and be interesting for a learner.
  Ensure your entire output is structured according to the requested format, including only the 'passage'.`,
  config: {
    temperature: 0.7, 
     safetySettings: [ 
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
        return { 
          passage: "Please learn some words first to generate a reading passage.",
        };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
