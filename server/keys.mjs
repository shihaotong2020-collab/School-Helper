let cached;
let pending;

export class DisplayError extends Error {}

async function lookup() {
  const { KEYGEN_URL, KEYGEN_TOKEN } = process.env;
  if (!KEYGEN_URL || !KEYGEN_TOKEN || [KEYGEN_URL, KEYGEN_TOKEN].includes('paste-here')) {
    throw new DisplayError('Fill in both MindDo settings in .env and restart the server.');
  }
  const url = new URL(KEYGEN_URL.replace(/\/+$/, '') + '/api/lookup-key');
  if (url.protocol !== 'https:') throw new DisplayError('Use an HTTPS MindDo URL.');
  const reply = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEYGEN_TOKEN },
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
  const data = await reply.json();
  if (!reply.ok || data.error) {
    if (typeof data.error?.fix === 'string') console.error(data.error.fix);
    throw new DisplayError(typeof data.error?.message === 'string'
      ? data.error.message : 'MindDo could not provide a key.');
  }
  const expires = Date.parse(data.expiresAt);
  if (typeof data.apiKey !== 'string' || !data.apiKey.trim() || !(expires > Date.now())) {
    throw new DisplayError('MindDo returned an invalid or expired key.');
  }
  cached = { key: data.apiKey, expires };
  return cached.key;
}

export async function getKey() {
  if (cached?.expires > Date.now()) return cached.key;
  pending ??= lookup().finally(() => { pending = undefined; });
  return pending;
}

export function rejectKey(key) {
  if (cached?.key === key) cached = undefined;
}
