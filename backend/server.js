const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const MAX_MESSAGE_LENGTH = Number(process.env.MENTOR_MAX_MESSAGE_LENGTH) || 8000;
const MAX_CONTEXT_HINT_LENGTH = Number(process.env.MENTOR_MAX_CONTEXT_HINT_LENGTH) || 4000;

/** Strip BOM, whitespace, optional surrounding quotes (common .env mistakes). */
function readApiKey() {
  const raw = process.env.NVIDIA_API_KEY || process.env.API_KEY || '';
  return raw
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function readAppGateKey() {
  const raw = process.env.MENTOR_APP_KEY || '';
  return raw.replace(/^\uFEFF/, '').trim().replace(/^["']|["']$/g, '');
}

const API_KEY = readApiKey();
const APP_GATE_KEY = readAppGateKey();
const MODEL =
  (process.env.AI_MODEL || 'meta/llama-3.1-8b-instruct').trim() ||
  'meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = 'You are a helpful AI career mentor.';

const app = express();

/** Render (and similar) sit behind a reverse proxy; needed for correct client IP in rate limiting. */
if (process.env.RENDER === 'true' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

console.log('[Mentor proxy] NVIDIA credential configured:', API_KEY.length > 0);
console.log('[Mentor proxy] Optional x-app-key gate:', APP_GATE_KEY.length > 0 ? 'enabled' : 'disabled');

app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

app.use(
  cors({
    origin: true,
    allowedHeaders: ['Content-Type', 'Accept', 'x-app-key'],
  }),
);
app.use(express.json({ limit: '256kb' }));

const mentorChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'AI unavailable' });
  },
});

app.get('/', (_req, res) => {
  res.send('Backend is running');
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

function optionalAppGate(req, res, next) {
  if (!APP_GATE_KEY) return next();
  const sent = req.get('x-app-key');
  if (typeof sent !== 'string' || !timingSafeEqualString(sent, APP_GATE_KEY)) {
    return res.status(403).json({ error: 'AI unavailable' });
  }
  next();
}

function timingSafeEqualString(a, b) {
  try {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Log safe summary of NVIDIA error bodies (no full payload). */
function logNvidiaErrorSummary(data) {
  if (data == null) return;
  if (typeof data === 'object' && data.error) {
    const e = data.error;
    if (typeof e === 'string') {
      console.error('[Mentor proxy] upstream error (redacted length):', e.length);
    } else if (e && typeof e === 'object' && typeof e.message === 'string') {
      console.error('[Mentor proxy] upstream error.message length:', e.message.length);
    } else {
      console.error('[Mentor proxy] upstream error object keys:', Object.keys(e || {}));
    }
  } else {
    console.error('[Mentor proxy] upstream body type:', typeof data);
  }
}

function buildUserContent(message, contextualHint) {
  const trimmed = String(message || '').trim();
  if (!contextualHint || !String(contextualHint).trim()) return trimmed;
  return (
    `${trimmed}\n\n` +
    '---\n' +
    'Optional context from the student app (read-only; use only to tailor your answer; do not invent details beyond this):\n' +
    String(contextualHint).trim()
  );
}

function extractReply(data) {
  if (!data || typeof data !== 'object') return null;
  const choices = data.choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object')
    return null;
  const msg = choices[0].message;
  if (!msg || typeof msg !== 'object') return null;
  const content = msg.content;
  if (typeof content === 'string' && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const joined = content
      .map((p) =>
        p && typeof p === 'object' && typeof p.text === 'string' ? p.text : '',
      )
      .join('');
    if (joined.trim()) return joined.trim();
  }
  return null;
}

async function callNvidiaChat(userContent) {
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  };

  console.log('[Mentor proxy] NVIDIA request:', {
    model: MODEL,
    userContentChars: userContent.length,
  });

  const nvidiaRes = await axios.post(NVIDIA_URL, payload, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
    validateStatus: () => true,
  });

  console.log('[Mentor proxy] NVIDIA HTTP status:', nvidiaRes.status);

  return nvidiaRes;
}

app.post(
  '/api/mentor/chat',
  mentorChatLimiter,
  optionalAppGate,
  async (req, res) => {
    const { message, contextualHint } = req.body || {};

    console.log('[Mentor proxy] incoming chat', {
      messageLen: typeof message === 'string' ? message.length : 0,
      hasContextualHint: Boolean(
        contextualHint && String(contextualHint).trim(),
      ),
    });

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'AI unavailable' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: 'AI unavailable' });
    }

    if (contextualHint != null && typeof contextualHint !== 'string') {
      return res.status(400).json({ error: 'AI unavailable' });
    }

    if (typeof contextualHint === 'string' && contextualHint.length > MAX_CONTEXT_HINT_LENGTH) {
      return res.status(400).json({ error: 'AI unavailable' });
    }

    if (!API_KEY.trim()) {
      console.error('[Mentor proxy] 503: missing NVIDIA_API_KEY / API_KEY in .env');
      return res.status(503).json({ error: 'AI unavailable' });
    }

    const userContent = buildUserContent(message, contextualHint);

    try {
      const nvidiaRes = await callNvidiaChat(userContent);
      const reply = extractReply(nvidiaRes.data);

      if (nvidiaRes.status < 200 || nvidiaRes.status >= 300 || !reply) {
        console.error('[Mentor proxy] bad NVIDIA response', {
          status: nvidiaRes.status,
          hasReply: Boolean(reply),
        });
        logNvidiaErrorSummary(nvidiaRes.data);
        return res.status(503).json({ error: 'AI unavailable' });
      }

      console.log('[Mentor proxy] reply chars:', reply.length);
      return res.json({ reply });
    } catch (err) {
      console.error('[Mentor proxy] axios error (message only):', err.message);
      if (err.response) {
        console.error('[Mentor proxy] axios error status:', err.response.status);
        logNvidiaErrorSummary(err.response.data);
      }
      return res.status(503).json({ error: 'AI unavailable' });
    }
  },
);

async function runStartupSelfTest() {
  if (!API_KEY.trim()) {
    console.log('[Mentor proxy] self-test skipped (no API key)');
    return;
  }
  console.log('[Mentor proxy] self-test: calling NVIDIA with sample message…');
  try {
    const nvidiaRes = await callNvidiaChat('Reply with exactly: OK');
    const reply = extractReply(nvidiaRes.data);
    console.log('[Mentor proxy] self-test: status', nvidiaRes.status, 'hasReply:', Boolean(reply));
  } catch (e) {
    console.error('[Mentor proxy] self-test failed:', e.message);
    if (e.response) logNvidiaErrorSummary(e.response.data);
  }
}

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.MENTOR_SELF_TEST === '1') {
    void runStartupSelfTest();
  }
});
