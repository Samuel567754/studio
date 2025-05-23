
'use server';
/**
 * @fileOverview AI-powered math story problem generation flow.
 *
 * - generateMathStoryProblem - A function that generates a math story problem with multiple questions.
 * - GenerateMathStoryProblemInput - The input type for the generateMathStoryProblem function.
 * - GenerateMathStoryProblemOutput - The return type for the generateMathStoryProblem function.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateMathStoryProblemInputSchema,
  type GenerateMathStoryProblemInput,
  GenerateMathStoryProblemOutputSchema,
  type GenerateMathStoryProblemOutput
} from '@/ai/schemas/math-story-problem-schemas';

export type { GenerateMathStoryProblemInput, GenerateMathStoryProblemOutput };

export async function generateMathStoryProblem(
  input: GenerateMathStoryProblemInput
): Promise<GenerateMathStoryProblemOutput> {
  return generateMathStoryProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMathStoryProblemPrompt',
  input: {schema: GenerateMathStoryProblemInputSchema},
  output: {schema: GenerateMathStoryProblemOutputSchema},
  prompt: `You are an AI assistant that creates engaging math story problems for children.
  The user is at a '{{difficultyLevel}}' level.
  {{#if username}}The learner's name is {{username}}. You can use their name in the story if it feels natural.{{/if}}
  {{#if topics}}The learner is interested in: {{topics}}. Try to weave these topics into the story.{{/if}}

  Instructions:
  1. Generate an interesting and coherent short story (3-5 sentences long) suitable for a child. Aim for unique scenarios and try to vary the context each time you generate a story, even if the topics are similar. Avoid creating stories that are too similar to common examples or ones you might have generated previously.
  2. Based on the story, create 1 to 3 math questions. Each question should be solvable using information from the story and should explore different aspects or calculations if multiple questions are generated for the same story. Ensure these questions are varied and not repetitive in style or what they ask.
  3. The difficulty of the math questions should match the '{{difficultyLevel}}' specified.
     - Easy: Single-step problems, small numbers (e.g., addition/subtraction within 20, simple multiplication/division).
     - Medium: Single or two-step problems, numbers up to 100, basic multi-digit operations.
     - Hard: Multi-step problems, larger numbers, possibly involving fractions or decimals if appropriate for older children at a 'hard' level, or more complex multi-digit operations.
  4. For each question, provide:
     - 'questionText': The question itself.
     - 'numericalAnswer': The numerical solution to the question.
     - 'explanation' (optional): A brief, simple explanation of how to solve it.
  5. Provide an 'overallTheme' for the story (e.g., "A Day at the Zoo", "Baking Cookies").
  
  Ensure your entire output is structured according to the requested format, including 'storyProblemText', 'questions' (as an array of objects), and 'overallTheme'.
  Each 'numericalAnswer' MUST be a number, not a string. Each 'questionText' should end with a question mark.
  The story should provide enough context for all questions to be answerable.`,
  config: {
    temperature: 0.9, // Increased temperature for more variety
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

const generateMathStoryProblemFlow = ai.defineFlow(
  {
    name: 'generateMathStoryProblemFlow',
    inputSchema: GenerateMathStoryProblemInputSchema,
    outputSchema: GenerateMathStoryProblemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
