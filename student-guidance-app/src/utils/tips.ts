const TIPS = [
  'Break large tasks into tiny wins to reduce friction.',
  'Focus on one concept deeply instead of skimming many.',
  'Write down one takeaway after each task.',
  'Use a timer: 25 minutes focused, 5 minutes break.',
  'When stuck, explain your problem out loud in simple words.',
  'Practice beats perfection; ship a small version first.',
  'Review yesterday’s notes for 2 minutes before starting.',
  'Try one hard thing first while your energy is high.',
  'Turn vague goals into a checklist of 3 actions.',
  'Compare your progress to last week, not other people.',
  'Save examples of your best work for your portfolio.',
  'Ask “why does this work?” to deepen understanding.',
  'Replace “I can’t” with “I’m learning how to.”',
  'Keep your learning environment distraction-free.',
  'Write one question you still have at the end of each session.',
  'Consistency compounds: even 20 minutes daily matters.',
  'Teach what you learned to lock in understanding.',
  'Celebrate small milestones to stay motivated.',
  'Track your streak and protect it.',
  'Use feedback as data, not as judgment.',
  'Refactor your notes so future-you can use them.',
  'Pause and breathe when frustration spikes.',
  'Reconnect each task to your long-term goal.',
  'Mistakes are signals for where to practice next.',
  'Finish with a “next step” so tomorrow starts easily.',
];

export function getTipForDate(date = new Date()): string {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % TIPS.length;
  return TIPS[idx];
}

