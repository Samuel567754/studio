'use server';

/**
 * @fileOverview AI-powered sight word suggestion flow.
 *
 * - suggestWords - A function that suggests sight words based on the user's reading level.
 * - SuggestWordsInput - The input type for the suggestWords function.
 * - SuggestWordsOutput - The return type for the suggestWords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWordsInputSchema = z.object({
  readingLevel: z
    .string()
    .describe(
      'The reading level of the user, e.g., beginner, intermediate, advanced.'
    ),
  wordLength: z
    .number()
    .describe(
      'The desired length of the words to suggest. Must be an integer, such as 3, 4, or 5.'
    ),
});
export type SuggestWordsInput = z.infer<typeof SuggestWordsInputSchema>;

const SuggestWordsOutputSchema = z.object({
  suggestedWords: z
    .array(z.string())
    .describe('An array of suggested sight words tailored to the user.'),
});
export type SuggestWordsOutput = z.infer<typeof SuggestWordsOutputSchema>;

export async function suggestWords(input: SuggestWordsInput): Promise<SuggestWordsOutput> {
  return suggestWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWordsPrompt',
  input: {schema: SuggestWordsInputSchema},
  output: {schema: SuggestWordsOutputSchema},
  prompt: `You are an AI assistant designed to suggest sight words to users based on their reading level and desired word length.

  Suggest sight words that are appropriate for the user's reading level and the specified word length. Focus on words that are commonly used and helpful for improving reading skills.

  Reading Level: {{{readingLevel}}}
  Word Length: {{{wordLength}}}

  Please provide an array of sight words.
  `,
});

const suggestWordsFlow = ai.defineFlow(
  {
    name: 'suggestWordsFlow',
    inputSchema: SuggestWordsInputSchema,
    outputSchema: SuggestWordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
