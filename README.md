# Darkroom

A prompt-crafting studio for image and video generative AI. Describe an idea
once; Darkroom develops it into a "contact sheet" of prompts that are
meaningfully different from one another — different lighting, composition,
perspective, palette, staging, or season — instead of the same sentence with
one word swapped.

## Why "Darkroom"

The product is framed around the darkroom, not around any existing AI tool's
interface: a seed idea goes into an exposure setup, gets "developed" into a
roll of frames, and can be pulled into a library. That gives the design its
own vocabulary (frames, rolls, exposures, the safelight accent) instead of
borrowing the dashboard/chat conventions of other AI products.

## Architecture

```
promptdarkroom/
├── server.js              Express backend proxy — the only thing that talks to providers
├── providers/
│   ├── index.js           Provider registry / factory (the abstraction layer)
│   ├── groqProvider.js     Groq implementation of the common provider interface
│   ├── geminiProvider.js   Gemini implementation of the common provider interface
│   └── promptEngine.js     Shared prompt-building + near-duplicate detection
└── public/                 Static frontend — plain HTML/CSS/JS, no build step
    ├── index.html
    ├── css/styles.css      Full design system (tokens, components, layout)
    └── js/
        ├── icons.js         Original inline-SVG icon set
        └── app.js           View logic, BYOK settings, generation flow
```

### Provider abstraction

Every provider module exports the same three things:

```js
{
  id: 'groq',
  label: 'Groq',
  async testConnection(apiKey) { ... },        // -> { connected, code, message }
  async generatePrompts(apiKey, input) { ... }, // -> string[]
}
```

`providers/index.js` is a small registry keyed by `id`. The server and the
frontend never import a provider file directly — they ask the registry for
one by `providerId`. Adding a third provider (say, a future `claude` or
`openai` entry) means writing one new file with those three exports and
adding one line to the registry. Nothing else changes.

### BYOK security model

- API keys are entered in the browser and stored **only** in that browser's
  `localStorage` — never sent to any database, never logged.
- Every generation or test-connection call goes through this server's
  `/api/*` routes. The server forwards the key to the chosen provider for
  that single request and does not persist it anywhere.
- `/api/test-connection` makes a lightweight request (listing available
  models) so a bad or expired key is caught before a real generation call is
  attempted.
- Invalid, expired, and rate-limited keys are classified into distinct error
  codes (`invalid_key`, `rate_limited`, `provider_error`, `unknown_error`) so
  the UI can show an accurate status instead of a generic failure.
- A basic per-IP rate limiter on the proxy itself prevents accidental bursts
  from burning through a user's own provider quota.

### Anti-duplication

`providers/promptEngine.js` builds the system instruction sent to whichever
model is generating prompts, requiring variation across composition,
lighting, perspective, palette, staging, season, and medium — then, once the
prompts come back, runs a cheap Jaccard word-overlap check across the batch
and flags any pair that still ended up too similar, so the UI can be honest
about it rather than silently presenting near-duplicates as distinct.

## Running it

```bash
npm install
cp .env.example .env
npm start
```

Then open `http://localhost:3000`, go to **Settings**, paste a Groq or
Gemini API key, and click **Test connection** before generating.
