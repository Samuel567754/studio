
'use server';
/**
 * @fileOverview AI-powered math word problem generation flow.
 *
 * - generateMathWordProblem - A function that generates a math word problem.
 * - GenerateMathWordProblemInput - The input type for the generateMathWordProblem function.
 * - GenerateMathWordProblemOutput - The return type for the generateMathWordProblem function.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateMathWordProblemInputSchema,
  type GenerateMathWordProblemInput,
  PromptInputSchema,
  type PromptInput,
  GenerateMathWordProblemOutputSchema,
  type GenerateMathWordProblemOutput
} from '@/ai/schemas/math-word-problem-schemas';

export type { GenerateMathWordProblemInput, GenerateMathWordProblemOutput };

export async function generateMathWordProblem(
  input: GenerateMathWordProblemInput
): Promise<GenerateMathWordProblemOutput> {
  return generateMathWordProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMathWordProblemPrompt',
  input: {schema: PromptInputSchema}, 
  output: {schema: GenerateMathWordProblemOutputSchema},
  prompt: `You are an AI assistant that creates age-appropriate math word problems for children.
  The user is at a '{{difficultyLevel}}' level.
  {{#if username}}The learner's name is {{username}}. You can use their name in the problem if it feels natural.{{/if}}

  {{#if isRandomOperation}}
  You should choose one of the following operations: addition, subtraction, multiplication, or division.
  You MUST indicate the operation you chose in the 'operationUsed' field of your output.
  {{else}}
  The user is practicing '{{operation}}'. You must use this operation.
  Set the 'operationUsed' field in the output to '{{operation}}'.
  {{/if}}

  Generate a short, engaging word problem. Strive for variety in themes and scenarios. Avoid creating problems that are too similar to common examples or ones you might have generated previously.
  The problem should involve a single step of the chosen or specified operation.
  - If difficulty is 'easy': Use numbers typically up to 20 for addition/subtraction. For multiplication, factors should be small (e.g., up to 5x5). For division, dividends should be small and result in whole numbers (e.g., 10 ÷ 2).
  - If difficulty is 'medium': Use numbers up to 100 for addition/subtraction. For multiplication, factors can be up to 10x10. For division, dividends can be up to 100 and result in whole numbers (e.g., 81 ÷ 9).
  - If difficulty is 'hard': Use numbers up to 200 for addition/subtraction, potentially involving carrying/borrowing. For multiplication, factors can be up to 12x12. For division, dividends can be up to 144 and result in whole numbers (e.g., 132 ÷ 11).

  The word problem should be clear, unambiguous, and 1-2 sentences long.
  Provide the problem text and the numerical answer.
  Optionally, provide a brief, simple explanation (1 sentence) of how to solve it.
  
  Ensure your entire output is structured according to the requested format, including 'problemText', 'numericalAnswer', 'operationUsed', and optionally 'explanation'.
  The numericalAnswer MUST be a number, not a string. The problemText should end with a question mark.`,
   config: {
    temperature: 0.9, 
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
  async (input: GenerateMathWordProblemInput): Promise<GenerateMathWordProblemOutput> => {
    const promptInput: PromptInput = {
      ...input,
      isRandomOperation: input.operation === 'random',
    };
    const {output} = await prompt(promptInput);
    return output!;
  }
);
