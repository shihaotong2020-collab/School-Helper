import { answer, hasPersonalDetails, modes, DisplayError } from '../server/ai.mjs';

export default async function ask(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.writeHead(405).end('{}');
  if (req.headers['content-type'] !== 'application/json') return res.writeHead(415).end('{}');
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 520000) return res.writeHead(413).end('{"error":"Question is too long."}');
      chunks.push(chunk);
    }
    let question, mode, previous, history;
    try { ({question, mode, previous, history} = JSON.parse(Buffer.concat(chunks).toString())); } catch {}
    if (typeof question !== 'string' || !question.trim() || question.length > 20000 || !Object.hasOwn(modes, mode)) {
      return res.writeHead(400).end('{"error":"Choose a help style and enter up to 20,000 characters."}');
    }
    const context = history === undefined ? (previous == null ? [] : [previous]) : history;
    if (!Array.isArray(context) || context.length > 12 || context.some(turn =>
      typeof turn?.question !== 'string' || turn.question.length > 20000 ||
      typeof turn.answer !== 'string' || turn.answer.length > 20000)) {
      return res.writeHead(400).end('{"error":"Please start a new question."}');
    }
    if (hasPersonalDetails(question) || context.some(turn => hasPersonalDetails(turn.question) || hasPersonalDetails(turn.answer))) {
      return res.end(JSON.stringify({answer:'Please remove personal details such as your address or email, then press Check again.', remember:false}));
    }
    res.end(JSON.stringify({ answer: await answer(question, mode, context) }));
  } catch (error) {
    res.writeHead(502).end(JSON.stringify({ error: error instanceof DisplayError
      ? error.message : 'Check your internet connection and try again.' }));
  }
}
