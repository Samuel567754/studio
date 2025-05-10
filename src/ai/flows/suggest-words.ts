
'use server';

/**
 * @fileOverview AI-powered sight word suggestion flow.
 *
 * - suggestWords - A function that suggests sight words based on the user's reading level.
 * - SuggestWordsInput - The input type for the suggestWords function.
 * - SuggestWordsOutput - The return type for the suggestWords function.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestWordsInputSchema,
  type SuggestWordsInput,
  SuggestWordsOutputSchema,
  type SuggestWordsOutput
} from '@/ai/schemas/suggest-words-schemas';

export type { SuggestWordsInput, SuggestWordsOutput };

export async function suggestWords(input: SuggestWordsInput): Promise<SuggestWordsOutput> {
  return suggestWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWordsPrompt',
  input: {schema: SuggestWordsInputSchema},
  output: {schema: SuggestWordsOutputSchema},
  prompt: `You are an AI assistant designed to suggest sight words to users based on their reading level, desired word length, and already mastered words.

Suggest sight words that are appropriate for the user's reading level and the specified word length. Focus on words that are commonly used and helpful for improving reading skills.
If a list of mastered words is provided, try to suggest new words that are different from the mastered ones, or words that build upon similar phonetic patterns or concepts if appropriate for the reading level.

Reading Level: {{{readingLevel}}}
Word Length: {{{wordLength}}}

{{#if masteredWords}}
Already Mastered Words (try to suggest different words or related concepts):
{{#each masteredWords}}
- {{{this}}}
{{/each}}
{{/if}}

Please provide an array of 5 to 10 sight words.
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
