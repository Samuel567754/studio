
'use server';
/**
 * @fileOverview Zod schemas for generating comprehension questions for a reading passage.
 */
import { z } from 'zod';

export const QuestionSchema = z.object({
  questionText: z.string().describe('The text of the comprehension question.'),
  questionType: z.enum(['mcq', 'true_false']).default('mcq').describe('The type of question (multiple choice or true/false).'),
  options: z.array(z.string()).min(2).max(4).describe('An array of 2 to 4 options for multiple-choice questions. The correct answer should be one of these options. For true/false, this will be ["True", "False"].'),
  correctAnswer: z.string().describe('The correct answer to the question. For true/false, this will be "True" or "False". For MCQ, it will be the text of the correct option.'),
  explanation: z.string().optional().describe('A brief explanation for why the answer is correct or to provide context.')
});
export type Question = z.infer<typeof QuestionSchema>;

export const GenerateComprehensionQuestionsInputSchema = z.object({
  passageText: z.string().min(50, "Passage text must be at least 50 characters long.").describe('The reading passage for which to generate comprehension questions.'),
  readingLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('The target reading level for the questions.'),
  numberOfQuestions: z.number().min(2).max(5).optional().default(3).describe('The desired number of comprehension questions (2-5).')
});
export type GenerateComprehensionQuestionsInput = z.infer<typeof GenerateComprehensionQuestionsInputSchema>;

export const GenerateComprehensionQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).min(1).describe('An array of comprehension questions based on the passage.')
});
export type GenerateComprehensionQuestionsOutput = z.infer<typeof GenerateComprehensionQuestionsOutputSchema>;
