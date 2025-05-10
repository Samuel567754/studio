
import { z } from 'zod';

export const GenerateDefinitionMatchGameInputSchema = z.object({
  wordToDefine: z
    .string()
    .describe('The specific word for which a definition and distractors should be generated.'),
  readingLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The target reading level for the definitions (e.g., beginner, intermediate, advanced).'),
  wordList: z
    .array(z.string())
    .optional()
    .describe('An optional list of other words the user is practicing. Can be used for context or to inspire distractor definitions for related words.'),
  username: z.string().optional().describe("The learner's name, if available, for potential personalization (though less critical for this game)."),
});
export type GenerateDefinitionMatchGameInput = z.infer<typeof GenerateDefinitionMatchGameInputSchema>;

export const GenerateDefinitionMatchGameOutputSchema = z.object({
  word: z
    .string()
    .describe('The word that was defined.'),
  correctDefinition: z
    .string()
    .describe('The AI-generated, age-appropriate definition for the "word".'),
  options: z
    .array(z.string())
    .min(3)
    .max(4)
    .describe('An array of 3 to 4 definitions: the correctDefinition and 2-3 distractor definitions, shuffled.'),
  hint: z
    .string()
    .optional()
    .describe('An optional one-sentence hint about the word (e.g., "This word describes a feeling." or "This is a type of animal.").'),
});
export type GenerateDefinitionMatchGameOutput = z.infer<typeof GenerateDefinitionMatchGameOutputSchema>;
