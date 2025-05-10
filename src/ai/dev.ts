
import { config } from 'dotenv';
config();

// Schemas (optional to import here, but good for awareness)
import '@/ai/schemas/suggest-words-schemas.ts';
import '@/ai/schemas/reading-passage-schemas.ts';
import '@/ai/schemas/math-word-problem-schemas.ts';
import '@/ai/schemas/math-story-problem-schemas.ts';
import '@/ai/schemas/fill-in-the-blank-game-schemas.ts';

// Flows
import '@/ai/flows/suggest-words.ts';
import '@/ai/flows/generate-reading-passage.ts';
import '@/ai/flows/generate-math-word-problem.ts';
import '@/ai/flows/generate-math-story-problem.ts';
import '@/ai/flows/generate-fill-in-the-blank-game.ts';
