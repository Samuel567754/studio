
'use server';
/**
 * @fileOverview AI-powered fill-in-the-blank game generation flow.
 *
 * - generateFillInTheBlankGame - A function that generates a sentence with a blank and options.
 * - GenerateFillInTheBlankGameInput - The input type for the function.
 * - GenerateFillInTheBlankGameOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function generateFillInTheBlankGame(
  input: GenerateFillInTheBlankGameInput
): Promise<GenerateFillInTheBlankGameOutput> {
  return generateFillInTheBlankGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFillInTheBlankGamePrompt',
  input: {schema: GenerateFillInTheBlankGameInputSchema},
  output: {schema: GenerateFillInTheBlankGameOutputSchema},
  prompt: `You are an AI assistant that creates fill-in-the-blank questions for children learning vocabulary.
  The target reading level is '{{readingLevel}}'.
  The word to practice and use as the correct answer is: '{{wordToPractice}}'.
  {{#if username}}The learner's name is {{username}}. You can use their name in the sentence if it feels natural, but it's not required.{{/if}}
  {{#if wordList}}The learner is also familiar with these words: {{#each wordList}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}. You can use these to generate plausible distractors.{{/if}}

  Instructions:
  1. Create a single, coherent, and engaging sentence that is appropriate for the '{{readingLevel}}'.
  2. The sentence MUST naturally include the '{{wordToPractice}}'.
  3. In the 'sentenceWithBlank' output, replace the '{{wordToPractice}}' with a visible blank, like "____" or "_____". Make the blank distinct.
  4. The 'correctWord' output MUST be '{{wordToPractice}}'.
  5. Generate 2 or 3 unique distractor words for the 'options' array. These distractors should be:
     - Plausible for the sentence's context but incorrect.
     - Similar in type (e.g., if '{{wordToPractice}}' is a noun, distractors should ideally be nouns).
     - Appropriate for the '{{readingLevel}}'.
     - Different from '{{wordToPractice}}'.
     - If 'wordList' is provided, consider using words from it as distractors if they fit, otherwise generate new ones.
  6. The 'options' array must contain the '{{correctWord}}' and the distractors, totaling 3 to 4 options. Shuffle these options.
  7. Optionally, provide a short, one-sentence 'hint' for the '{{wordToPractice}}' if you think it's helpful for the learner. The hint should not give away the answer directly.
  8. Ensure the sentence provides enough context to reasonably infer the '{{wordToPractice}}'.

  Example for wordToPractice "happy" (beginner):
  - sentenceWithBlank: "{{#if username}}{{username}} feels ____ when they get a new toy.{{else}}The child feels ____ when they get a new toy.{{/if}}"
  - correctWord: "happy"
  - options: ["happy", "sleepy", "green"] (shuffled)
  - hint: "A feeling when something good happens."

  Strive for variety in sentence structure and themes.
  Ensure your entire output is structured according to the requested format.
  The blank in 'sentenceWithBlank' should be clearly visible (e.g., using underscores).`,
  config: {
    temperature: 0.8,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const generateFillInTheBlankGameFlow = ai.defineFlow(
  {
    name: 'generateFillInTheBlankGameFlow',
    inputSchema: GenerateFillInTheBlankGameInputSchema,
    outputSchema: GenerateFillInTheBlankGameOutputSchema,
  },
  async input => {
    // Ensure the word to practice is passed directly to the prompt
    const promptInput = {
      ...input,
      wordToPractice: input.wordToPractice, 
    };
    const {output} = await prompt(promptInput);
    
    // Post-processing to ensure the correct word is in options if AI forgets.
    // And ensure options are unique and of the correct length.
    if (output) {
      if (!output.options.map(o => o.toLowerCase()).includes(output.correctWord.toLowerCase())) {
        output.options.pop(); // Remove one distractor
        output.options.push(output.correctWord); // Add correct word
      }
      // Shuffle again just in case
      for (let i = output.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [output.options[i], output.options[j]] = [output.options[j], output.options[i]];
      }
      // Ensure correct number of options
       if (output.options.length > 4) output.options = output.options.slice(0, 4);
       // Deduplicate options by lowercasing
       const uniqueOptions = Array.from(new Set(output.options.map(o => o.toLowerCase())))
                                .map(lowerO => output.options.find(o => o.toLowerCase() === lowerO)!);
       output.options = uniqueOptions;

       while(output.options.length < 3 && input.wordList && input.wordList.length > 0) {
         const potentialDistractor = input.wordList.find(w => !output!.options.map(o => o.toLowerCase()).includes(w.toLowerCase()) && w.toLowerCase() !== output!.correctWord.toLowerCase());
         if (potentialDistractor) {
           output.options.push(potentialDistractor);
         } else {
           break; // No more distractors from list
         }
       }
       // If still not enough options, this indicates an issue with AI generation or word list diversity
       // For simplicity, we'll let Zod validation catch this if it's still under 3.
    }
    return output!;
  }
);

    