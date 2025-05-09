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
  masteredWords: z
    .array(z.string())
    .optional()
    .describe(
      'An optional list of words the user has already mastered. The AI can use this to subtly adjust complexity.'
    ),
});
export type GenerateReadingPassageInput = z.infer<
  typeof GenerateReadingPassageInputSchema
>;

const GenerateReadingPassageOutputSchema = z.object({
  passage: z
    .string()
    .describe('The generated reading passage.'),
  comprehensionQuestion: z.string().optional().describe('A simple comprehension question based *only* on the content of the generated passage. The question should test understanding of key information.'),
  comprehensionAnswer: z.string().optional().describe('A concise answer to the comprehension question, based *only* on the passage content.'),
});
export type GenerateReadingPassageOutput = z.infer<
  typeof GenerateReadingPassageOutputSchema
>;

export async function generateReadingPassage(
  input: GenerateReadingPassageInput
): Promise<GenerateReadingPassageOutput> {
  // The client should provide masteredWords if available.
  // This flow will use what's provided in the input.
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

  Please generate a passage that is 10-15 sentences long. Ensure the vocabulary and sentence structure are suitable for the reading level.
  The passage should make sense and be interesting for a learner.

  After the passage, if you are able to generate a relevant comprehension question:
  1. Provide a 'comprehensionQuestion' that is simple and tests understanding of key information *only* from the passage.
  2. Provide a concise 'comprehensionAnswer' for that question, also based *only* on the passage.
  If you provide a 'comprehensionQuestion', you MUST also provide a 'comprehensionAnswer'. If you cannot formulate a suitable question and answer pair, omit both fields or ensure they are empty.
  Ensure your entire output is structured according to the requested format, including the 'passage', and optionally 'comprehensionQuestion' and 'comprehensionAnswer'.`,
  config: {
    temperature: 0.7, // Allow for some creativity
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
          comprehensionQuestion: undefined,
          comprehensionAnswer: undefined,
        };
    }
    const {output} = await prompt(input);
    // Ensure that if a question is present but answer is missing (e.g. empty string from LLM, not caught by Zod optional),
    // we treat it as answer not available.
    // Zod handles optional: if field is missing, it's undefined. If present and empty string, it's "".
    // The component handles `null` or `""` for comprehensionAnswer gracefully.
    if (output && output.comprehensionQuestion && (output.comprehensionAnswer === undefined || output.comprehensionAnswer.trim() === "")) {
        return {
            ...output,
            comprehensionAnswer: undefined // Force undefined if question exists but answer is effectively missing
        };
    }
    return output!;
  }
);

