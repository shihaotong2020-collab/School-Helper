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
    let question, mode, previous;
    try { ({question, mode, previous} = JSON.parse(Buffer.concat(chunks).toString())); } catch {}
    if (typeof question !== 'string' || !question.trim() || question.length > 20000 || !Object.hasOwn(modes, mode)) {
      return res.writeHead(400).end('{"error":"Choose a help style and enter up to 20,000 characters."}');
    }
    if (previous != null && (typeof previous.question !== 'string' || previous.question.length > 20000 ||
        typeof previous.answer !== 'string' || previous.answer.length > 20000)) {
      return res.writeHead(400).end('{"error":"Please start a new question."}');
    }
    if ([question, previous?.question, previous?.answer].some(text => text && hasPersonalDetails(text))) {
      return res.end(JSON.stringify({answer:'Please remove personal details such as your address or email, then press Check again.', remember:false}));
    }
    res.end(JSON.stringify({ answer: await answer(question, mode, previous) }));
  } catch (error) {
    res.writeHead(502).end(JSON.stringify({ error: error instanceof DisplayError
      ? error.message : 'Check your internet connection and try again.' }));
  }
}
