
import { config } from 'dotenv';
config();

// Schemas (optional to import here, but good for awareness)
import '@/ai/schemas/suggest-words-schemas.ts';
import '@/ai/schemas/reading-passage-schemas.ts';
import '@/ai/schemas/math-word-problem-schemas.ts';
import '@/ai/schemas/math-story-problem-schemas.ts';
import '@/ai/schemas/fill-in-the-blank-game-schemas.ts';
import '@/ai/schemas/definition-match-game-schemas.ts';
import '@/ai/schemas/comprehension-questions-schemas.ts';
import '@/ai/schemas/english-tutor-schemas.ts';


// Flows
import '@/ai/flows/suggest-words.ts';
import '@/ai/flows/generate-reading-passage.ts';
import '@/ai/flows/generate-math-word-problem.ts';
import '@/ai/flows/generate-math-story-problem.ts';
import '@/ai/flows/generate-fill-in-the-blank-game.ts';
import '@/ai/flows/generate-definition-match-game.ts';
import '@/ai/flows/generate-comprehension-questions.ts';
import '@/ai/flows/english-tutor-flow.ts';

