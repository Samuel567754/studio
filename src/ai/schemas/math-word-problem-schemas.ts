
import { z } from 'zod';

export const GenerateMathWordProblemInputSchema = z.object({
  difficultyLevel: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level of the math problem (easy, medium, or hard).'),
  operation: z
    .enum(['addition', 'subtraction', 'multiplication', 'division', 'random'])
    .describe('The mathematical operation for the problem (addition, subtraction, multiplication, division, or random for AI to choose).'),
   username: z.string().optional().describe("The learner's name, if available, to personalize the problem."),
});
export type GenerateMathWordProblemInput = z.infer<
  typeof GenerateMathWordProblemInputSchema
>;

export const PromptInputSchema = GenerateMathWordProblemInputSchema.extend({
  isRandomOperation: z.boolean().describe('True if the AI should choose a random operation, false otherwise.'),
});
export type PromptInput = z.infer<typeof PromptInputSchema>;

export const GenerateMathWordProblemOutputSchema = z.object({
  problemText: z
    .string()
    .describe('The text of the generated math word problem.'),
  numericalAnswer: z
    .number()
    .describe('The numerical answer to the math word problem.'),
  explanation: z
    .string()
    .optional()
    .describe('An optional brief explanation of how to solve the problem.'),
  operationUsed: z
    .string() 
    .describe('The mathematical operation used or chosen by the AI for this problem (e.g., "addition", "subtraction", "multiplication", "division").'),
});
export type GenerateMathWordProblemOutput = z.infer<
  typeof GenerateMathWordProblemOutputSchema
>;
