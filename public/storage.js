const key = 'school-helper-v1';
const samples = [
  {mode:'simple', title:'Moving particles', question:'Why do particles in a gas move faster on average when the gas gets hotter?'},
  {mode:'summary', title:'The water cycle', question:'Sunlight warms water in lakes. Some water evaporates and rises as vapor. As the air cools, water condenses into droplets. Droplets fall as precipitation. Water flows back into lakes and oceans.'},
  {mode:'steps', title:'A fraction problem', question:'How do I start adding 1/3 and 1/4?'},
];
const allowed = ['simple','summary','detail','homework','steps','example','analogy'];
export function save(mode) {
  try { localStorage.setItem(key, JSON.stringify({mode, samples: samples.map(item => item.title)})); } catch {}
}
export function load() {
  let mode = 'simple';
  try {
    const previous = JSON.parse(localStorage.getItem(key));
    if (allowed.includes(previous?.mode)) mode = previous.mode;
  } catch {}
  save(mode);
  return {mode, samples};
}

const chatPrefix = 'school-helper-chat:';
export function saveChat(turns, mode) {
  if (!turns.length) throw new Error('Ask a question before saving.');
  const personal = /\b(?:my (?:home )?address is|i live at)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{1,6}\s+(?:[\w.-]+\s+){1,4}(?:street|road|avenue|lane|drive|blvd|st|rd)\b/i;
  if (turns.some(turn => personal.test(turn.question) || personal.test(turn.answer))) {
    throw new Error('This chat looks like it contains personal details. Start a new chat without them.');
  }
  try {
    let code;
    do {
      code = crypto.randomUUID().slice(0,8).toUpperCase();
    } while (localStorage.getItem(chatPrefix + code) !== null);
    localStorage.setItem(chatPrefix + code, JSON.stringify({mode, turns}));
    return code;
  } catch {
    throw new Error('Could not save. Your browser storage may be full or turned off.');
  }
}
export function loadChat(input) {
  const code = input.trim().toUpperCase();
  let chat;
  try {
    if (/^[A-F0-9]{8}$/.test(code)) chat = JSON.parse(localStorage.getItem(chatPrefix + code));
  } catch {}
  if (!allowed.includes(chat?.mode) || !Array.isArray(chat.turns) || !chat.turns.length ||
      !chat.turns.every(turn => typeof turn?.question === 'string' && typeof turn.answer === 'string')) {
    throw new Error('No saved chat found. Check the code and use the same browser.');
  }
  return chat;
}

export function loadLook() {
  try { return JSON.parse(localStorage.getItem('school-helper-look')) ?? {}; }
  catch { return {}; }
}
export function saveLook(look) {
  try { localStorage.setItem('school-helper-look', JSON.stringify(look)); } catch {}
}
