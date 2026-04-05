const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const DEBUG_SESSION_LOG = path.join(__dirname, '..', 'debug-621f78.log');

function appendDebugLine(payload) {
  try {
    fs.appendFileSync(
      DEBUG_SESSION_LOG,
      `${JSON.stringify({ sessionId: '621f78', timestamp: Date.now(), ...payload })}\n`,
    );
  } catch (_) {
    /* ignore */
  }
}

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

const CAREER_REFLECTION_SYSTEM = `You analyze student-written career reflection answers. Identify interest areas and patterns.
Respond with ONLY valid JSON (no markdown fences, no extra text) in this exact shape:
{"careerMatches":[{"career":"<key>","score":<number>}]}
Rules:
- 3 to 6 items in careerMatches, sorted by score descending.
- score is an integer from 0 to 100.
- "career" must be exactly one of: cybersecurity, designer, data_analyst, software_engineer, ai_ml
  (use ai_ml for artificial intelligence, machine learning, or ML engineering interests).
- Robotics / automation / embedded interests: use software_engineer if programming or systems integration is central; use data_analyst if the emphasis is experimentation, modeling, or lab-style research; use cybersecurity if the emphasis is securing connected or industrial systems.
Base scores on evidence in the student's words; do not invent hobbies they did not mention.`;

const app = express();

/** Render (and similar) sit behind a reverse proxy; needed for correct client IP in rate limiting. */
if (process.env.RENDER === 'true' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

console.log('[Mentor proxy] NVIDIA credential configured:', API_KEY.length > 0);
console.log('NVIDIA KEY PRESENT:', !!String(process.env.NVIDIA_API_KEY || '').trim());
console.log('API_KEY (NVIDIA or legacy) CONFIGURED:', API_KEY.length > 0);
console.log('[Mentor proxy] Optional x-app-key gate:', APP_GATE_KEY.length > 0 ? 'enabled' : 'disabled');
appendDebugLine({
  hypothesisId: 'H_KEY',
  location: 'backend/server.js:startup',
  message: 'nvidia env presence',
  data: {
    nvidiaKeyPresent: !!String(process.env.NVIDIA_API_KEY || '').trim(),
    resolvedKeyLength: API_KEY.length,
  },
});

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

async function callNvidiaChat(messages) {
  const payload = {
    model: MODEL,
    messages,
  };

  const userChars = messages.reduce(
    (n, m) => n + (typeof m.content === 'string' ? m.content.length : 0),
    0,
  );
  console.log('[Mentor proxy] NVIDIA request:', {
    model: MODEL,
    userContentChars: userChars,
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

function extractJsonObject(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

const ALLOWED_CAREER_KEYS = new Set([
  'cybersecurity',
  'designer',
  'data_analyst',
  'software_engineer',
  'ai_ml',
]);

function normalizeCareerMatches(parsed) {
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.careerMatches)) {
    return [];
  }
  return parsed.careerMatches
    .filter((x) => x && typeof x === 'object')
    .map((x) => ({
      career: String(x.career || '')
        .toLowerCase()
        .trim(),
      score: Math.min(100, Math.max(0, Math.round(Number(x.score) || 0))),
    }))
    .filter((x) => ALLOWED_CAREER_KEYS.has(x.career))
    .slice(0, 8);
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
      console.log('AI REQUEST START [mentor/chat]');
      console.log('Message:', `${userContent.slice(0, 400)}${userContent.length > 400 ? '…' : ''}`);
      const nvidiaRes = await callNvidiaChat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ]);
      const rawData = nvidiaRes.data;
      console.log(
        'AI RESPONSE RAW [mentor/chat]:',
        typeof rawData === 'object' && rawData
          ? JSON.stringify(rawData).slice(0, 2500)
          : String(rawData).slice(0, 500),
      );
      const reply = extractReply(rawData);
      console.log(
        'PARSED AI REPLY:',
        reply ? `${reply.slice(0, 600)}${reply.length > 600 ? '…' : ''}` : null,
      );

      if (nvidiaRes.status < 200 || nvidiaRes.status >= 300 || !reply) {
        console.error('[Mentor proxy] bad NVIDIA response', {
          status: nvidiaRes.status,
          hasReply: Boolean(reply),
        });
        console.error('AI ERROR [mentor/chat]: bad status or empty reply');
        logNvidiaErrorSummary(nvidiaRes.data);
        return res.status(503).json({ error: 'AI unavailable' });
      }

      console.log('[Mentor proxy] reply chars:', reply.length);
      return res.json({ reply });
    } catch (err) {
      console.error('AI ERROR [mentor/chat]:', err.message);
      console.error('[Mentor proxy] axios error (message only):', err.message);
      if (err.response) {
        console.error('[Mentor proxy] axios error status:', err.response.status);
        logNvidiaErrorSummary(err.response.data);
      }
      return res.status(503).json({ error: 'AI unavailable' });
    }
  },
);

const careerReflectionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'AI unavailable' });
  },
});

const MAX_REFLECTION_TOTAL_CHARS = 14000;

/** Lets browsers / uptime checks confirm the path exists (POST is the real API). */
app.get('/api/career/analyze-reflections', (_req, res) => {
  res.json({
    ok: true,
    path: '/api/career/analyze-reflections',
    method: 'POST',
    body: { reflections: 'string[]' },
    note: 'Send JSON { reflections: [...] }. Optional x-app-key if MENTOR_APP_KEY is set on server.',
  });
});

app.post(
  '/api/career/analyze-reflections',
  careerReflectionLimiter,
  optionalAppGate,
  async (req, res) => {
    const { reflections } = req.body || {};
    if (!Array.isArray(reflections) || reflections.length === 0) {
      return res.status(400).json({ error: 'AI_FAILED' });
    }
    const texts = reflections
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter(Boolean);
    if (!texts.length) {
      return res.status(400).json({ error: 'AI_FAILED' });
    }
    const combined = texts.join('\n\n---\n\n');
    if (combined.length > MAX_REFLECTION_TOTAL_CHARS) {
      return res.status(400).json({ error: 'AI_FAILED' });
    }

    if (!API_KEY.trim()) {
      console.error('[Career analyze] 503: missing NVIDIA_API_KEY / API_KEY');
      console.error('AI ERROR [career]: no API key');
      appendDebugLine({
        hypothesisId: 'H_KEY',
        location: 'backend/career-analyze',
        message: 'blocked no api key',
        data: {},
      });
      return res.status(503).json({ error: 'AI_FAILED' });
    }

    const userMessage = `Student reflection answers (may be multiple):\n\n${combined}`;

    try {
      console.log('AI REQUEST START [career/analyze-reflections]');
      console.log(
        'Message:',
        `${userMessage.slice(0, 500)}${userMessage.length > 500 ? '…' : ''}`,
      );
      appendDebugLine({
        hypothesisId: 'H1',
        location: 'backend/career-analyze',
        message: 'request start',
        data: { textSlots: texts.length, combinedLen: combined.length },
      });

      const nvidiaRes = await callNvidiaChat([
        { role: 'system', content: CAREER_REFLECTION_SYSTEM },
        { role: 'user', content: userMessage },
      ]);
      const rawData = nvidiaRes.data;
      console.log(
        'AI RESPONSE RAW [career]:',
        typeof rawData === 'object' && rawData
          ? JSON.stringify(rawData).slice(0, 2500)
          : String(rawData).slice(0, 500),
      );

      const reply = extractReply(rawData);
      console.log(
        'PARSED AI REPLY:',
        reply ? `${reply.slice(0, 800)}${reply.length > 800 ? '…' : ''}` : null,
      );

      if (nvidiaRes.status < 200 || nvidiaRes.status >= 300 || !reply) {
        console.error('AI ERROR [career]: bad NVIDIA status or empty reply', nvidiaRes.status);
        logNvidiaErrorSummary(rawData);
        appendDebugLine({
          hypothesisId: 'H2',
          location: 'backend/career-analyze',
          message: 'nvidia bad response',
          data: { httpStatus: nvidiaRes.status, hasReply: Boolean(reply) },
        });
        return res.status(503).json({ error: 'AI_FAILED' });
      }
      const parsed = extractJsonObject(reply);
      const careerMatches = normalizeCareerMatches(parsed);
      if (!careerMatches.length) {
        console.error('[Career analyze] empty careerMatches after parse');
        console.error('AI ERROR [career]: empty careerMatches');
        appendDebugLine({
          hypothesisId: 'H3',
          location: 'backend/career-analyze',
          message: 'parse yielded no matches',
          data: { replyLen: reply.length },
        });
        return res.status(503).json({ error: 'AI_FAILED' });
      }
      appendDebugLine({
        hypothesisId: 'H_OK',
        location: 'backend/career-analyze',
        message: 'success',
        data: {
          matchCount: careerMatches.length,
          careers: careerMatches.map((m) => m.career),
        },
      });
      return res.json({ careerMatches });
    } catch (err) {
      console.error('AI ERROR [career]:', err.message);
      appendDebugLine({
        hypothesisId: 'H2',
        location: 'backend/career-analyze',
        message: 'exception',
        data: { err: String(err.message || err) },
      });
      return res.status(503).json({ error: 'AI_FAILED' });
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
    const nvidiaRes = await callNvidiaChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Reply with exactly: OK' },
    ]);
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
