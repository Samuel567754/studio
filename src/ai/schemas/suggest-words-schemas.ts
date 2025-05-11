import { z } from 'zod';

export const SuggestWordsInputSchema = z.object({
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
  masteredWords: z
    .array(z.string())
    .optional()
    .describe(
      'An optional list of words the user has already mastered. The AI should try to suggest different words or related concepts.'
    ),
});
export type SuggestWordsInput = z.infer<typeof SuggestWordsInputSchema>;

export const SuggestWordsOutputSchema = z.object({
  suggestedWords: z
    .array(z.string())
    .describe('An array of suggested sight words tailored to the user.'),
});
export type SuggestWordsOutput = z.infer<typeof SuggestWordsOutputSchema>;