import Constants from 'expo-constants';

export const AI_API_FRIENDLY_ERROR = 'AI is currently unavailable. Please try again.';

/**
 * LAN mentor proxy on your PC (port 5000, not Metro 8082).
 * If the app cannot reach the mentor, set MENTOR_BACKEND_URL in student-guidance-app/.env to
 * http://<your_WiFi_IP>:5000 (Windows: ipconfig → IPv4; never use localhost on a physical phone).
 */
export const DEFAULT_MENTOR_BACKEND_URL = 'http://192.168.31.161:5000';

type ExtraConfig = {
  mentorBackendUrl?: string;
  /** Shared with backend MENTOR_APP_KEY (not the NVIDIA API key). */
  mentorAppKey?: string;
};

export type SendMentorMessageOptions = {
  contextualHint?: string;
};

/** Merge expoConfig.extra + manifest.extra (web/dev may split fields across both). */
function getRawExtra(): Record<string, unknown> | undefined {
  const parts: Record<string, unknown>[] = [];
  const fromConfig = Constants.expoConfig?.extra;
  if (fromConfig && typeof fromConfig === 'object' && !Array.isArray(fromConfig)) {
    parts.push(fromConfig as Record<string, unknown>);
  }
  const man = Constants.manifest as Record<string, unknown> | null | undefined;
  const fromManifest = man?.extra;
  if (fromManifest && typeof fromManifest === 'object' && !Array.isArray(fromManifest)) {
    parts.push(fromManifest as Record<string, unknown>);
  }
  if (!parts.length) return undefined;
  return Object.assign({}, ...parts);
}

function readExtra(): ExtraConfig {
  const extra = getRawExtra();
  if (!extra) return {};
  return {
    mentorBackendUrl:
      typeof extra.mentorBackendUrl === 'string' ? extra.mentorBackendUrl : undefined,
    mentorAppKey: typeof extra.mentorAppKey === 'string' ? extra.mentorAppKey : undefined,
  };
}

function normalizeBackendBase(url: string): string {
  return url.replace(/\/+$/, '');
}

function extractAssistantText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  if (typeof d.reply === 'string' && d.reply.trim()) return d.reply.trim();

  const choices = d.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === 'object') {
    const msg = (choices[0] as Record<string, unknown>).message;
    if (msg && typeof msg === 'object') {
      const content = (msg as Record<string, unknown>).content;
      if (typeof content === 'string' && content.trim()) return content.trim();
      if (Array.isArray(content)) {
        const joined = content
          .map((p) =>
            p && typeof p === 'object' && typeof (p as { text?: string }).text === 'string'
              ? (p as { text: string }).text
              : '',
          )
          .join('');
        if (joined.trim()) return joined.trim();
      }
    }
  }

  for (const key of ['message', 'text', 'output']) {
    const v = d[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }

  return null;
}

/**
 * POST to LAN mentor backend only. API key stays on the server.
 */
export async function sendMessageToAI(
  message: string,
  options?: SendMentorMessageOptions,
): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error(AI_API_FRIENDLY_ERROR);
  }

  const { mentorBackendUrl, mentorAppKey } = readExtra();
  const backendBase = (
    (mentorBackendUrl ?? '').trim() || DEFAULT_MENTOR_BACKEND_URL
  ).trim();
  const url = `${normalizeBackendBase(backendBase)}/api/mentor/chat`;
  const xAppKey = (mentorAppKey ?? '').trim();

  const payload = {
    message: trimmed,
    contextualHint: options?.contextualHint?.trim() || undefined,
  };

  if (__DEV__) {
    console.log('[Mentor] request', url, { messageLen: trimmed.length, hasHint: Boolean(payload.contextualHint) });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-app-key': xAppKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (e: unknown) {
    if (__DEV__) {
      console.warn('[Mentor] network error:', e instanceof Error ? e.message : e);
    }
    throw new Error(AI_API_FRIENDLY_ERROR);
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch (e: unknown) {
    if (__DEV__) {
      console.warn('[Mentor] invalid JSON:', res.status);
    }
    throw new Error(AI_API_FRIENDLY_ERROR);
  }

  const text = extractAssistantText(parsed);

  if (__DEV__) {
    console.log('[Mentor] response', res.status, text ? `${text.length} chars` : 'no reply');
  }

  if (!res.ok || !text) {
    if (__DEV__) {
      console.warn('[Mentor] failed', { status: res.status, ok: res.ok, hasReply: Boolean(text) });
    }
    throw new Error(AI_API_FRIENDLY_ERROR);
  }

  return text;
}
