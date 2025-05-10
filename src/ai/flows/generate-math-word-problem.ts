
'use server';
/**
 * @fileOverview AI-powered math word problem generation flow.
 *
 * - generateMathWordProblem - A function that generates a math word problem.
 * - GenerateMathWordProblemInput - The input type for the generateMathWordProblem function.
 * - GenerateMathWordProblemOutput - The return type for the generateMathWordProblem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMathWordProblemInputSchema = z.object({
  difficultyLevel: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level of the math problem (easy, medium, or hard).'),
  operation: z
    .enum(['addition', 'subtraction', 'multiplication', 'division'])
    .describe('The mathematical operation for the problem (addition, subtraction, multiplication, or division).'),
   username: z.string().optional().describe("The learner's name, if available, to personalize the problem."),
});
export type GenerateMathWordProblemInput = z.infer<
  typeof GenerateMathWordProblemInputSchema
>;

const GenerateMathWordProblemOutputSchema = z.object({
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
});
export type GenerateMathWordProblemOutput = z.infer<
  typeof GenerateMathWordProblemOutputSchema
>;

export async function generateMathWordProblem(
  input: GenerateMathWordProblemInput
): Promise<GenerateMathWordProblemOutput> {
  return generateMathWordProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMathWordProblemPrompt',
  input: {schema: GenerateMathWordProblemInputSchema},
  output: {schema: GenerateMathWordProblemOutputSchema},
  prompt: `You are an AI assistant that creates age-appropriate math word problems for children.
  The user is at a '{{difficultyLevel}}' level and is practicing '{{operation}}'.
  {{#if username}}The learner's name is {{username}}. You can use their name in the problem if it feels natural.{{/if}}

  Generate a short, engaging word problem.
  The problem should involve a single step of {{operation}}.
  - If difficulty is 'easy': Use numbers typically up to 20 for addition/subtraction. For multiplication, factors should be small (e.g., up to 5x5). For division, dividends should be small and result in whole numbers (e.g., 10 ÷ 2).
  - If difficulty is 'medium': Use numbers up to 100 for addition/subtraction. For multiplication, factors can be up to 10x10. For division, dividends can be up to 100 and result in whole numbers (e.g., 81 ÷ 9).
  - If difficulty is 'hard': Use numbers up to 200 for addition/subtraction, potentially involving carrying/borrowing. For multiplication, factors can be up to 12x12. For division, dividends can be up to 144 and result in whole numbers (e.g., 132 ÷ 11).

  The word problem should be clear, unambiguous, and 1-2 sentences long.
  Provide the problem text and the numerical answer.
  Optionally, provide a brief, simple explanation (1 sentence) of how to solve it.

  Ensure your entire output is structured according to the requested format, including only 'problemText', 'numericalAnswer', and optionally 'explanation'.
  The numericalAnswer MUST be a number, not a string. The problemText should end with a question mark.`,
   config: {
    temperature: 0.8, // Allow for some creativity in problem generation
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

const generateMathWordProblemFlow = ai.defineFlow(
  {
    name: 'generateMathWordProblemFlow',
    inputSchema: GenerateMathWordProblemInputSchema,
    outputSchema: GenerateMathWordProblemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
