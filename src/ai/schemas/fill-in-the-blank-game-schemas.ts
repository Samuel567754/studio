
import { z } from 'zod';

export const GenerateFillInTheBlankGameInputSchema = z.object({
  wordToPractice: z
    .string()
    .describe('The specific word that should be the correct answer and be blanked out in the sentence.'),
  readingLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The target reading level for the sentence complexity (e.g., beginner, intermediate, advanced).'),
  wordList: z
    .array(z.string())
    .optional()
    .describe('An optional list of other words the user is practicing. Can be used for context or to generate distractors.'),
   username: z.string().optional().describe("The learner's name, if available, for personalization."),
});
export type GenerateFillInTheBlankGameInput = z.infer<typeof GenerateFillInTheBlankGameInputSchema>;

export const GenerateFillInTheBlankGameOutputSchema = z.object({
  sentenceWithBlank: z
    .string()
    .describe('The generated sentence with the wordToPractice replaced by a blank (e.g., "The cat sat on the ____.").'),
  correctWord: z
    .string()
    .describe('The correct word that fills the blank (this will be the same as wordToPractice).'),
  options: z
    .array(z.string())
    .min(3)
    .max(4)
    .describe('An array of 3 to 4 words, including the correctWord and 2-3 distractor words.'),
  hint: z
    .string()
    .optional()
    .describe('An optional one-sentence hint for the correct word, if the AI deems it necessary.'),
});
export type GenerateFillInTheBlankGameOutput = z.infer<typeof GenerateFillInTheBlankGameOutputSchema>;
