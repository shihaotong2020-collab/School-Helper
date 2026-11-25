import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import ask from '../api/ask.mjs';

const assets = new Map();
for (const [name, type] of Object.entries({'index.html':'text/html','style.css':'text/css','page.js':'text/javascript','storage.js':'text/javascript','math.mjs':'text/javascript'})) {
  assets.set(name === 'index.html' ? '/' : '/' + name, [readFileSync(new URL('../public/' + name, import.meta.url)), type + '; charset=utf-8']);
}

createServer(async (req, res) => {
  if (req.method === 'GET' && assets.has(req.url)) {
    const [file, type] = assets.get(req.url);
    res.writeHead(200, { 'Content-Type': type }).end(file);
    return;
  }
  if (req.url === '/ask' || req.url === '/api/ask') return ask(req, res);
  res.writeHead(404).end();
}).listen(Number(process.env.PORT || 3000), '127.0.0.1');
