// server.js
//
// Darkroom's backend proxy. It exists so a user's API key is only ever sent
// from their browser to THIS server over HTTPS, and from this server
// straight to the provider — it is never written to disk, never logged,
// and never stored in any database. Each request is stateless.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getProvider, listProviders } = require('./providers');
const { flagNearDuplicates } = require('./providers/promptEngine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

// Simple in-memory rate limiter per IP so one client can't hammer a
// provider (and burn through the user's own quota) by accident.
const rateBuckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const bucket = rateBuckets.get(key) || [];
  const recent = bucket.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ ok: false, code: 'local_rate_limited', message: 'Too many requests from this browser. Wait a minute and try again.' });
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  next();
}

function validateKeyShape(apiKey) {
  return typeof apiKey === 'string' && apiKey.trim().length >= 10 && apiKey.trim().length <= 200;
}

app.get('/api/providers', (_req, res) => {
  res.json({ ok: true, providers: listProviders() });
});

app.post('/api/test-connection', rateLimit, async (req, res) => {
  const { providerId, apiKey } = req.body || {};
  if (!validateKeyShape(apiKey)) {
    return res.status(400).json({ ok: false, code: 'invalid_key_shape', message: 'That does not look like a valid API key.' });
  }
  try {
    const provider = getProvider(providerId);
    const result = await provider.testConnection(apiKey.trim());
    res.json({ ok: result.connected, ...result });
  } catch (err) {
    const status = err.code === 'unknown_provider' ? 400 : 502;
    res.status(status).json({ ok: false, code: err.code || 'unknown_error', message: err.message });
  }
});

app.post('/api/generate', rateLimit, async (req, res) => {
  const { providerId, apiKey, concept, medium, style, lighting, perspective, palette, season, count, model } = req.body || {};

  if (!validateKeyShape(apiKey)) {
    return res.status(400).json({ ok: false, code: 'invalid_key_shape', message: 'That does not look like a valid API key.' });
  }
  if (typeof concept !== 'string' || concept.trim().length < 3) {
    return res.status(400).json({ ok: false, code: 'invalid_concept', message: 'Describe your idea in at least a few words first.' });
  }
  const safeCount = Math.min(Math.max(parseInt(count, 10) || 6, 1), 12);

  try {
    const provider = getProvider(providerId);
    const prompts = await provider.generatePrompts(apiKey.trim(), {
      concept: concept.trim(),
      medium: medium === 'video' ? 'video' : 'image',
      style, lighting, perspective, palette, season,
      count: safeCount,
      model,
    });

    const withFlags = flagNearDuplicates(prompts);
    res.json({ ok: true, providerId, count: withFlags.length, prompts: withFlags });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : (err.code === 'unknown_provider' ? 400 : 502);
    res.status(status).json({ ok: false, code: err.code || 'unknown_error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Darkroom proxy listening on http://localhost:${PORT}`);
});
