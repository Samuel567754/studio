
import { z } from 'zod';

export const EnglishTutorInputSchema = z.object({
  question: z.string().min(1, "Question cannot be empty.").describe("The user's question about English language."),
  username: z.string().optional().describe("The user's name for personalized responses, if available."),
});
export type EnglishTutorInput = z.infer<typeof EnglishTutorInputSchema>;

export const EnglishTutorOutputSchema = z.object({
  answer: z.string().describe("The AI tutor's answer to the question."),
});
export type EnglishTutorOutput = z.infer<typeof EnglishTutorOutputSchema>;
