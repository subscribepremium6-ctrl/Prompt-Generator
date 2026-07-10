// providers/geminiProvider.js
//
// Talks to Google's Gemini generateContent endpoint. Implements the same
// three methods every provider must implement — see providers/index.js.
// Adding a future provider means creating one more file exactly like this one.

const { buildSystemInstruction, buildUserInstruction, parsePromptArray } = require('./promptEngine');

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.0-flash';

function classifyError(status, bodyText) {
  if (status === 400 && /API key not valid/i.test(bodyText)) return { code: 'invalid_key', message: 'That API key was rejected by Gemini. Double-check it and try again.' };
  if (status === 401 || status === 403) return { code: 'invalid_key', message: 'That API key was rejected by Gemini. Double-check it and try again.' };
  if (status === 429) return { code: 'rate_limited', message: 'Gemini is rate-limiting this key right now. Wait a moment and retry.' };
  if (status >= 500) return { code: 'provider_error', message: 'Gemini is having trouble on its end. Try again shortly.' };
  return { code: 'unknown_error', message: `Gemini returned an unexpected error (${status}). ${bodyText || ''}`.trim() };
}

async function testConnection(apiKey) {
  const res = await fetch(`${BASE_URL}/models?key=${encodeURIComponent(apiKey)}`);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const err = classifyError(res.status, bodyText);
    return { connected: false, ...err };
  }
  return { connected: true, code: 'ok', message: 'Connected to Gemini.' };
}

async function generatePrompts(apiKey, input) {
  const { medium, count, model } = input;
  const modelName = model || DEFAULT_MODEL;
  const systemInstruction = buildSystemInstruction({ medium, count });
  const userInstruction = buildUserInstruction(input);

  const res = await fetch(`${BASE_URL}/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userInstruction }] }],
      generationConfig: { temperature: 0.9 },
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const err = classifyError(res.status, bodyText);
    const e = new Error(err.message);
    e.code = err.code;
    e.status = res.status;
    throw e;
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return parsePromptArray(raw);
}

module.exports = { id: 'gemini', label: 'Gemini', testConnection, generatePrompts };
