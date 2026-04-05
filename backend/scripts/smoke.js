/**
 * Smoke test: expects backend already running (npm start).
 * Usage: node scripts/smoke.js [baseUrl]
 * Example: node scripts/smoke.js http://127.0.0.1:5000
 */
const http = require('http');

const base = process.argv[2] || 'http://127.0.0.1:5000';
const url = new URL('/health', base);
const appKey = process.env.MENTOR_APP_KEY || '';

function request(method, pathUrl, bodyObj) {
  const u = new URL(pathUrl, base);
  const data = bodyObj ? JSON.stringify(bodyObj) : null;
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          Accept: 'application/json',
          ...(appKey ? { 'x-app-key': appKey } : {}),
          ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => {
          buf += c;
        });
        res.on('end', () => {
          let json;
          try {
            json = buf ? JSON.parse(buf) : null;
          } catch {
            json = { _raw: buf };
          }
          resolve({ status: res.statusCode, json });
        });
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const health = await request('GET', url.pathname);
    if (health.status !== 200 || !health.json?.ok) {
      console.error('smoke: /health failed', health);
      process.exit(1);
    }
    console.log('smoke: /health ok');

    const chat = await request('POST', '/api/mentor/chat', { message: 'Say OK in one word.' });
    if (chat.status >= 200 && chat.status < 300 && chat.json?.reply) {
      console.log('smoke: /api/mentor/chat ok (reply length)', String(chat.json.reply).length);
      process.exit(0);
    }
    console.warn(
      'smoke: chat not fully ok (set NVIDIA_API_KEY in .env and retry). Status:',
      chat.status,
      'body:',
      chat.json,
    );
    process.exit(0);
  } catch (e) {
    console.error('smoke: request failed — is the server running? (npm start)', e.message);
    process.exit(1);
  }
})();
