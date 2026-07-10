// providers/groqProvider.js
//
// Talks to Groq's OpenAI-compatible endpoint. Implements the same three
// methods every provider must implement — see providers/index.js.

const { buildSystemInstruction, buildUserInstruction, parsePromptArray } = require('./promptEngine');

const BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

function classifyError(status, bodyText) {
  if (status === 401 || status === 403) return { code: 'invalid_key', message: 'That API key was rejected by Groq. Double-check it and try again.' };
  if (status === 429) return { code: 'rate_limited', message: 'Groq is rate-limiting this key right now. Wait a moment and retry.' };
  if (status >= 500) return { code: 'provider_error', message: 'Groq is having trouble on its end. Try again shortly.' };
  return { code: 'unknown_error', message: `Groq returned an unexpected error (${status}). ${bodyText || ''}`.trim() };
}

async function testConnection(apiKey) {
  const res = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const err = classifyError(res.status, bodyText);
    return { connected: false, ...err };
  }
  return { connected: true, code: 'ok', message: 'Connected to Groq.' };
}

async function generatePrompts(apiKey, input) {
  const { concept, medium, count, model } = input;
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      temperature: 0.9,
      messages: [
        { role: 'system', content: buildSystemInstruction({ medium, count }) },
        { role: 'user', content: buildUserInstruction(input) },
      ],
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
  const raw = data?.choices?.[0]?.message?.content || '';
  return parsePromptArray(raw);
}

module.exports = { id: 'groq', label: 'Groq', testConnection, generatePrompts };
