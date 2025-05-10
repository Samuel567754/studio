
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-words.ts';
import '@/ai/flows/generate-reading-passage.ts';
import '@/ai/flows/generate-math-word-problem.ts';
import '@/ai/flows/generate-math-story-problem.ts';
import '@/ai/flows/generate-fill-in-the-blank-game.ts';

