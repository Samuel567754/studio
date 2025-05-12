
import { z } from 'zod';

export const MathTutorInputSchema = z.object({
  question: z.string().min(1, "Question cannot be empty.").describe("The user's question about a math problem or concept."),
  username: z.string().optional().describe("The user's name for personalized responses, if available."),
});
export type MathTutorInput = z.infer<typeof MathTutorInputSchema>;

export const MathTutorOutputSchema = z.object({
  answer: z.string().describe("The AI Math Tutor's answer, explanation, or solution to the math question."),
});
export type MathTutorOutput = z.infer<typeof MathTutorOutputSchema>;

