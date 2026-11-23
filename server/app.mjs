import { createServer } from 'node:http';
import { answer, DisplayError } from './ai.mjs';

const page = `<!doctype html><html lang="en"><meta charset="utf-8"><title>School Helper</title>
<h1>School Helper</h1><form><label>What would you like help understanding?
<input name="question" required maxlength="4000"></label> <button>Ask</button></form>
<p role="status"></p><script>
document.querySelector('form').onsubmit = async function(event) {
  event.preventDefault();
  const status = document.querySelector('[role=status]');
  status.textContent = 'Thinking…';
  try {
    const reply = await fetch('/ask', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question:this.elements.question.value})});
    const result = await reply.json();
    status.textContent = result.answer ?? result.error;
  } catch { status.textContent = 'Could not reach School Helper.'; }
};
</script></html>`;

createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page);
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST' || req.url !== '/ask') return res.writeHead(404).end('{}');
  if (req.headers['content-type'] !== 'application/json') return res.writeHead(415).end('{}');
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 32000) return res.writeHead(413).end('{"error":"Question is too long."}');
      chunks.push(chunk);
    }
    let question;
    try { question = JSON.parse(Buffer.concat(chunks).toString())?.question; } catch {}
    if (typeof question !== 'string' || !question.trim() || question.length > 4000) {
      return res.writeHead(400).end('{"error":"Enter a question of up to 4000 characters."}');
    }
    res.end(JSON.stringify({ answer: await answer(question) }));
  } catch (error) {
    res.writeHead(502).end(JSON.stringify({ error: error instanceof DisplayError
      ? error.message : 'School Helper could not reach the AI service.' }));
  }
}).listen(3000, '127.0.0.1');
