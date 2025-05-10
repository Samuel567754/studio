
import { z } from 'zod';

const MathQuestionSchema = z.object({
  questionText: z.string().describe('The text of a single math question related to the story.'),
  numericalAnswer: z.number().describe('The numerical answer to this specific question.'),
  explanation: z.string().optional().describe('An optional brief explanation of how to solve this specific question.'),
});

export const GenerateMathStoryProblemInputSchema = z.object({
  difficultyLevel: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level of the math problems in the story (easy, medium, or hard).'),
  topics: z
    .string()
    .optional()
    .describe('Optional comma-separated topics to inspire the story (e.g., "animals, park, snacks"). The AI will try to incorporate these.'),
  username: z.string().optional().describe("The learner's name, if available, to personalize the story."),
});
export type GenerateMathStoryProblemInput = z.infer<typeof GenerateMathStoryProblemInputSchema>;

export const GenerateMathStoryProblemOutputSchema = z.object({
  storyProblemText: z
    .string()
    .describe('The text of the generated math story problem.'),
  questions: z
    .array(MathQuestionSchema)
    .min(1)
    .max(3)
    .describe('An array of 1 to 3 math questions based on the story.'),
  overallTheme: z
    .string()
    .optional()
    .describe('A brief description of the story\'s theme or context.'),
});
export type GenerateMathStoryProblemOutput = z.infer<typeof GenerateMathStoryProblemOutputSchema>;
