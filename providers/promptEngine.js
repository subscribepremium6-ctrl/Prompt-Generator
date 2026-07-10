// providers/promptEngine.js
//
// Shared "developing" logic used by every provider. Keeping this here means
// swapping or adding a provider never touches the rules that make the output
// good — only how the raw text gets fetched from the network.

const VARIATION_AXES = [
  'composition and framing',
  'camera or viewing perspective',
  'lighting condition and time of day',
  'color palette and mood',
  'subject arrangement and staging',
  'season or environment',
  'artistic medium or rendering style',
  'narrative or conceptual angle',
];

/**
 * Builds the instruction payload sent to any LLM to produce a batch of
 * prompts that are meaningfully different from one another — not the same
 * sentence with a synonym swapped in.
 */
function buildSystemInstruction({ medium, count }) {
  const subject = medium === 'video' ? 'AI video generation' : 'AI image generation';
  return [
    `You are the exposure engine inside Darkroom, a studio tool that turns a rough idea into a contact sheet of ready-to-use prompts for ${subject}.`,
    `You will receive one seed concept and a set of creative constraints. Produce exactly ${count} distinct prompts.`,
    ``,
    `Hard rules:`,
    `1. Every prompt must clearly be a variation of the SAME seed concept — do not drift to unrelated subjects.`,
    `2. No two prompts may share the same composition, lighting, perspective, palette, and staging combination. Vary at least three of the following axes between any two prompts: ${VARIATION_AXES.join(', ')}.`,
    `3. Never produce near-duplicates created by swapping a single adjective. Each prompt should feel like a different photograph or frame of the same idea, not a reworded copy.`,
    `4. Each prompt is a single, self-contained paragraph of 25-55 words, written in plain descriptive language suitable for pasting directly into an image or video generator. No numbering, no labels, no quotation marks inside the text.`,
    `5. Do not reference real, named public figures, branded products, or copyrighted characters.`,
    ``,
    `Respond with ONLY a JSON array of ${count} strings, nothing else — no markdown fences, no preamble.`,
  ].join('\n');
}

function buildUserInstruction({ concept, medium, style, lighting, perspective, palette, season, count }) {
  const lines = [`Seed concept: ${concept}`, `Medium: ${medium === 'video' ? 'video generation' : 'image generation'}`];
  if (style) lines.push(`Preferred style: ${style}`);
  if (lighting) lines.push(`Preferred lighting: ${lighting}`);
  if (perspective) lines.push(`Preferred perspective: ${perspective}`);
  if (palette) lines.push(`Preferred palette: ${palette}`);
  if (season) lines.push(`Preferred season/setting: ${season}`);
  lines.push(`Generate ${count} prompts now, following every hard rule.`);
  return lines.join('\n');
}

/** Extracts a JSON array of strings from raw model text, tolerating stray fences or preamble. */
function parsePromptArray(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response from model.');
  let text = raw.trim();
  text = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Model did not return a JSON array of prompts.');
  }
  const jsonSlice = text.slice(start, end + 1);
  const parsed = JSON.parse(jsonSlice);
  if (!Array.isArray(parsed)) throw new Error('Parsed value is not an array.');
  return parsed.filter((p) => typeof p === 'string' && p.trim().length > 0).map((p) => p.trim());
}

/** Cheap word-overlap similarity so we can flag near-duplicates the model slipped through. */
function jaccardSimilarity(a, b) {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Tags any prompts in the batch that are suspiciously close to an earlier one. */
function flagNearDuplicates(prompts, threshold = 0.55) {
  return prompts.map((text, i) => {
    let similarTo = null;
    for (let j = 0; j < i; j++) {
      if (jaccardSimilarity(text, prompts[j]) >= threshold) {
        similarTo = j;
        break;
      }
    }
    return { text, flagged: similarTo !== null, similarTo };
  });
}

module.exports = {
  VARIATION_AXES,
  buildSystemInstruction,
  buildUserInstruction,
  parsePromptArray,
  flagNearDuplicates,
};
