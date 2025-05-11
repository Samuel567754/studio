import { z } from 'zod';

export const GenerateReadingPassageInputSchema = z.object({
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
  favoriteTopics: z
    .string()
    .optional()
    .describe(
      'An optional string of comma-separated topics the user is interested in (e.g., "animals, space, sports").'
    ),
});
export type GenerateReadingPassageInput = z.infer<
  typeof GenerateReadingPassageInputSchema
>;

export const GenerateReadingPassageOutputSchema = z.object({
  passage: z
    .string()
    .describe('The generated reading passage.'),
});
export type GenerateReadingPassageOutput = z.infer<
  typeof GenerateReadingPassageOutputSchema
>;