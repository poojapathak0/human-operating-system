import { collectData } from '../ml/service';

export type Prompt = { id: string; text: string };

// Lightweight reflective prompts grounded in values and emotion processing
export async function generatePrompts(): Promise<Prompt[]> {
  const ctx = await collectData();
  const moods = ctx.checkIns.slice(-10).map(c => c.mood);
  const low = moods.filter(m => m === 'sad' || m === 'tired').length;
  const prompts: string[] = [];
  if (low >= 3) {
    prompts.push(
      'What emotion is most present right now? Where do you feel it in your body?',
      'What small act of kindness can you offer yourself today?'
    );
  } else {
    prompts.push(
      'What value matters most to you this week? How can you honor it tomorrow?',
      'Name one thing you’re grateful for and why it mattered today.'
    );
  }
  prompts.push(
    'If a wise friend advised you now, what would they suggest?',
    'What is a 2‑minute action that moves you toward your values?'
  );
  return prompts.map((p, i) => ({ id: `${Date.now()}-${i}`, text: p }));
}
