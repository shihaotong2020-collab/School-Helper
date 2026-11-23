import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { answer, modes, DisplayError } from './ai.mjs';

const assets = new Map();
for (const [name, type] of Object.entries({'index.html':'text/html','style.css':'text/css','page.js':'text/javascript','storage.js':'text/javascript'})) {
  assets.set(name === 'index.html' ? '/' : '/' + name, [readFileSync(new URL('../public/' + name, import.meta.url)), type + '; charset=utf-8']);
}

createServer(async (req, res) => {
  if (req.method === 'GET' && assets.has(req.url)) {
    const [file, type] = assets.get(req.url);
    res.writeHead(200, { 'Content-Type': type }).end(file);
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
      if (size > 120000) return res.writeHead(413).end('{"error":"Question is too long."}');
      chunks.push(chunk);
    }
    let question, mode;
    try { ({question, mode} = JSON.parse(Buffer.concat(chunks).toString())); } catch {}
    if (typeof question !== 'string' || !question.trim() || question.length > 20000 || !Object.hasOwn(modes, mode)) {
      return res.writeHead(400).end('{"error":"Choose a help style and enter up to 20,000 characters."}');
    }
    res.end(JSON.stringify({ answer: await answer(question, mode) }));
  } catch (error) {
    res.writeHead(502).end(JSON.stringify({ error: error instanceof DisplayError
      ? error.message : 'Check your internet connection and try again.' }));
  }
}).listen(3000, '127.0.0.1');
