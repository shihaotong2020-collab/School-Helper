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

export async function answer(question) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const key = await getKey();
    const reply = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }] }),
      signal: AbortSignal.timeout(60000),
    });
    if (reply.status === 401) {
      if (cached?.key === key) cached = undefined;
      if (attempt === 0) continue;
    }
    if (!reply.ok) throw new DisplayError('OpenAI could not answer this question.');
    const text = (await reply.json()).choices?.[0]?.message?.content;
    if (typeof text !== 'string') throw new DisplayError('OpenAI returned no answer.');
    return text;
  }
}
