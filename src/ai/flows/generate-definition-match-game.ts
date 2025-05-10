
'use server';
/**
 * @fileOverview AI-powered word definition matching game generation flow.
 *
 * - generateDefinitionMatchGame - A function that generates a word, its definition, and distractor definitions.
 * - GenerateDefinitionMatchGameInput - The input type for the function.
 * - GenerateDefinitionMatchGameOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateDefinitionMatchGameInputSchema,
  type GenerateDefinitionMatchGameInput,
  GenerateDefinitionMatchGameOutputSchema,
  type GenerateDefinitionMatchGameOutput
} from '@/ai/schemas/definition-match-game-schemas';

export type { GenerateDefinitionMatchGameInput, GenerateDefinitionMatchGameOutput };

export async function generateDefinitionMatchGame(
  input: GenerateDefinitionMatchGameInput
): Promise<GenerateDefinitionMatchGameOutput> {
  return generateDefinitionMatchGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDefinitionMatchGamePrompt',
  input: {schema: GenerateDefinitionMatchGameInputSchema},
  output: {schema: GenerateDefinitionMatchGameOutputSchema},
  prompt: `You are an AI assistant that creates word definition matching games for children learning vocabulary.
  The target reading level is '{{readingLevel}}'.
  The word to define is: '{{wordToDefine}}'.
  {{#if username}}The learner's name is {{username}}. This is just for context, no need to use it in the definitions.{{/if}}
  {{#if wordList}}The learner is also familiar with these words: {{#each wordList}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}. You can consider these for generating plausible distractor definitions for related words if suitable.{{/if}}

  Instructions:
  1. Your primary output for 'word' MUST be '{{wordToDefine}}'.
  2. Create one clear, concise, and age-appropriate definition for '{{wordToDefine}}'. This definition will be the value for the 'correctDefinition' output field.
  3. Generate 2 or 3 unique distractor definitions for the 'options' array. These distractors should be:
     - Plausible but incorrect definitions for '{{wordToDefine}}'.
     - They could be definitions for other words that are similar in type (e.g., if '{{wordToDefine}}' is a verb, distractors could be definitions for other verbs) or sound similar or are commonly confused.
     - Appropriate for the '{{readingLevel}}'.
     - Different from the 'correctDefinition'.
     - If 'wordList' is provided, you might get inspiration for distractor definitions for words from that list, if they are suitable.
  4. The 'options' array must contain the 'correctDefinition' and the generated distractor definitions, totaling 3 to 4 options. Ensure these options are shuffled.
  5. Optionally, provide a short, one-sentence 'hint' about the '{{wordToDefine}}'. The hint should give a clue about the word's category or usage, but not the definition itself (e.g., "This word is a type of animal," or "You do this when you are happy.").
  
  Example for wordToDefine "jump" (beginner):
  - word: "jump"
  - correctDefinition: "To push yourself up into the air using your legs and feet."
  - options: ["To push yourself up into the air using your legs and feet.", "To move very slowly.", "A type of sweet fruit."] (shuffled)
  - hint: "An action you can do with your body."

  Strive for clarity and ensure distractors are genuinely plausible but clearly wrong for '{{wordToDefine}}'.
  Ensure your entire output is structured according to the requested format.`,
  config: {
    temperature: 0.7,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const generateDefinitionMatchGameFlow = ai.defineFlow(
  {
    name: 'generateDefinitionMatchGameFlow',
    inputSchema: GenerateDefinitionMatchGameInputSchema,
    outputSchema: GenerateDefinitionMatchGameOutputSchema,
  },
  async input => {
    const promptInput = {
      ...input,
      wordToDefine: input.wordToDefine, 
    };
    const {output} = await prompt(promptInput);
    
    // Post-processing to ensure the correct definition is in options if AI forgets.
    // And ensure options are unique and of the correct length.
    if (output) {
      // Ensure the output 'word' field is correctly set to the input 'wordToDefine'
      output.word = input.wordToDefine;

      if (!output.options.map(o => o.toLowerCase()).includes(output.correctDefinition.toLowerCase())) {
        output.options.pop(); // Remove one distractor
        output.options.push(output.correctDefinition); // Add correct definition
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

       // If still not enough options after deduplication (e.g., AI generated identical distractors)
       // This part is tricky as regenerating just distractors is complex.
       // For now, we rely on the Zod validation to catch if it's under 3.
       // A more robust solution might involve a re-prompt or manual distractor generation if necessary.
    }
    return output!;
  }
);

