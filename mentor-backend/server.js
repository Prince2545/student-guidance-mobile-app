/* eslint-disable no-console */
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

const UPSTREAM_URL =
  process.env.AI_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = process.env.AI_MODEL || 'meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT =
  'You are an AI career mentor helping students.\n' +
  'Give clear, practical, and actionable advice.\n' +
  'Keep answers concise but helpful.';

const app = express();

// Chrome / Edge: Web on http://localhost:8082 calling LAN IP needs this on responses (Private Network Access).
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  }),
);
app.use(express.json({ limit: '256kb' }));

function extractAssistantText(data) {
  if (!data || typeof data !== 'object') return null;
  const choices = data.choices;
  if (Array.isArray(choices) && choices[0]?.message?.content != null) {
    const c = choices[0].message.content;
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (Array.isArray(c)) {
      const text = c
        .map((p) => (typeof p?.text === 'string' ? p.text : ''))
        .join('');
      if (text.trim()) return text.trim();
    }
  }
  for (const key of ['message', 'text', 'reply', 'output']) {
    const v = data[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'mentor-backend',
    hint: 'POST /api/mentor/chat with JSON { message, contextualHint? }',
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mentor-backend' });
});

app.post('/api/mentor/chat', async (req, res) => {
  const { message, contextualHint } = req.body || {};
  console.log('[mentor] incoming POST /api/mentor/chat body:', {
    messagePreview:
      typeof message === 'string' ? `${message.slice(0, 200)}${message.length > 200 ? '…' : ''}` : typeof message,
    contextualHintPreview:
      typeof contextualHint === 'string'
        ? `${contextualHint.slice(0, 160)}${contextualHint.length > 160 ? '…' : ''}`
        : typeof contextualHint,
    contentLength: req.headers['content-length'],
  });

  if (typeof message !== 'string' || !message.trim()) {
    console.error('[mentor] validation error: missing message');
    return res.status(400).json({ error: 'message is required' });
  }

  const apiKey = process.env.NVIDIA_API_KEY || process.env.API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    console.error('[mentor] server misconfiguration: NVIDIA_API_KEY or API_KEY not set in .env');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  let userContent = message.trim();
  if (typeof contextualHint === 'string' && contextualHint.trim()) {
    userContent +=
      '\n\n---\nOptional context from the student app (read-only):\n' +
      contextualHint.trim();
  }

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  };

  let upstreamRes;
  try {
    upstreamRes = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[mentor] upstream fetch failed:', err?.message || err);
    return res.status(502).json({ error: 'Upstream unreachable' });
  }

  let parsed;
  try {
    parsed = await upstreamRes.json();
  } catch (err) {
    console.error('[mentor] upstream JSON parse failed:', err?.message || err);
    return res.status(502).json({ error: 'Invalid upstream response' });
  }

  if (!upstreamRes.ok) {
    const errMsg =
      parsed?.error?.message ||
      parsed?.error ||
      `upstream status ${upstreamRes.status}`;
    console.error('[mentor] upstream error:', upstreamRes.status, String(errMsg).slice(0, 200));
    console.error('[mentor] upstream payload keys:', parsed && typeof parsed === 'object' ? Object.keys(parsed) : []);
    return res.status(502).json({ error: 'Upstream request failed' });
  }

  const reply = extractAssistantText(parsed);
  if (!reply) {
    console.error('[mentor] could not extract assistant text; upstream keys:', parsed && typeof parsed === 'object' ? Object.keys(parsed) : []);
    return res.status(502).json({ error: 'Bad upstream shape' });
  }

  console.log('[mentor] upstream OK; reply length:', reply.length, 'preview:', reply.slice(0, 120) + (reply.length > 120 ? '…' : ''));
  return res.json({ reply });
});

app.use((err, _req, res, _next) => {
  console.error('[mentor] unhandled error:', err?.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log('Server running on port 5000');
  console.log(`[mentor] bound ${HOST}:${PORT} — LAN: http://192.168.31.161:${PORT}`);
});
