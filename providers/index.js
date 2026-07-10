// providers/index.js
//
// Every provider module must export: { id, label, testConnection(apiKey),
// generatePrompts(apiKey, input) }. The rest of the server only ever talks
// to this registry, never to a provider file directly — that's what makes
// adding a new provider a one-file change.

const groq = require('./groqProvider');
const gemini = require('./geminiProvider');

const registry = {
  [groq.id]: groq,
  [gemini.id]: gemini,
};

function getProvider(id) {
  const provider = registry[id];
  if (!provider) {
    const e = new Error(`Unknown provider "${id}". Supported providers: ${Object.keys(registry).join(', ')}.`);
    e.code = 'unknown_provider';
    throw e;
  }
  return provider;
}

function listProviders() {
  return Object.values(registry).map(({ id, label }) => ({ id, label }));
}

module.exports = { getProvider, listProviders };
