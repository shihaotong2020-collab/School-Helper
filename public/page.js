import {plainMath} from './math.mjs';
import {load, save, loadChat, saveChat, loadFavorites, saveFavorite, removeFavorite, reportReasons, saveReport, loadReports, looksPersonal} from './storage.js';
const styles = {
  simple:['Simpler words','What would you like to understand?'],
  summary:['Summary','Paste your text or name a concept to summarize.'],
  detail:['In detail','What school topic would you like to explore?'],
  homework:['Homework hint','Which homework question has you stuck?'],
  steps:['Step by step','Which problem would you like to work through?'],
};
const state = load();
const form = document.querySelector('#study');
const question = document.querySelector('#question');
const check = document.querySelector('#check');
const result = document.querySelector('#result');
const follow = document.querySelector('#follow');
const continuation = document.querySelector('#continuation');
const next = document.querySelector('#next');
const thread = document.querySelector('#thread');
const status = continuation.querySelector('[role=status]');
const replies = document.querySelector('#replies');
const replyStatus = document.querySelector('#reply-status');
// Keep the original assignment and the latest student-written progress even after many hint clicks.
const quickReplies = {quiz:'Quiz me on this topic.', homework:'Give me one more hint for this problem.', example:'Give me an example of that.', analogy:'Explain that with an analogy.'};
function hintHistory(turns) {
  const progress = turns.findLastIndex(turn => !Object.values(quickReplies).includes(turn.question));
  const indices = new Set([0, progress, turns.length - 1].filter(i => i >= 0 && i < turns.length));
  for (let i = turns.length - 2; i >= 0 && indices.size < 12; i--) indices.add(i);
  return [...indices].sort((a,b) => a-b).map(i => ({
    question: turns[i].question.slice(0, i === 0 || i === progress ? 20000 : 1000),
    answer: turns[i].answer.slice(0, 2000),
  }));
}
let previous;
let turns = [];
let answeringQuiz = false;
function openQuizAnswer() {
  openReply(false);
  answeringQuiz = true;
  continuation.querySelector('label').textContent = 'Your answer to the quiz question';
  replies.hidden = false;
}
const saveButton = document.querySelector('#save-chat');
const loadForm = document.querySelector('#load-chat');
const chatStatus = document.querySelector('#chat-status');
const firstFavorite = document.querySelector('#first-favorite');
const buttonTurns = new WeakMap();
function syncFavoriteButton(button, items) {
  const turn = buttonTurns.get(button);
  button.disabled = items.some(item => item.question === turn.question && item.answer === turn.answer);
  button.textContent = button.disabled ? 'Saved to favorites' : 'Save to favorites';
}
function renderFavorites() {
  const list = document.querySelector('#favorites');
  list.replaceChildren();
  try {
    const items = loadFavorites();
    for (const button of document.querySelectorAll('.favorite-save')) syncFavoriteButton(button, items);
    if (!items.length) list.textContent = 'Your saved explanations will appear here.';
    for (const item of items) {
      const entry = document.createElement('details');
      const title = document.createElement('summary');
      title.textContent = item.question;
      const body = document.createElement('p');
      body.textContent = item.answer;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove from favorites';
      remove.onclick = () => {
        try {
          removeFavorite(item);
          renderFavorites();
          chatStatus.textContent = 'Removed from favorites.';
        } catch { chatStatus.textContent = 'Could not remove this favorite in your browser.'; }
      };
      entry.append(title, body, remove, reportControl(item));
      list.append(entry);
    }
  } catch { list.textContent = 'Favorites could not be opened in this browser.'; }
}
function favoriteButton(turn) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'submit favorite-save';
  buttonTurns.set(button, turn);
  try { syncFavoriteButton(button, loadFavorites()); } catch { button.textContent = 'Save to favorites'; }
  button.onclick = () => {
    try {
      saveFavorite(turn);
      button.textContent = 'Saved to favorites';
      button.disabled = true;
      renderFavorites();
    } catch (error) {
      chatStatus.textContent = error.message.startsWith('Remove personal details') ? error.message : 'Could not save this favorite in your browser.';
    }
  };
  return button;
}
renderFavorites();
function renderReports() {
  const list = document.querySelector('#reports');
  list.replaceChildren();
  try {
    const reports = loadReports();
    if (!reports.length) list.textContent = 'No reports on this device.';
    for (const report of reports) {
      const entry = document.createElement('details');
      const heading = document.createElement('summary');
      heading.textContent = report.reason + ' · ' + new Date(report.time).toLocaleString();
      const body = document.createElement('p');
      body.textContent = report.answer ?? 'Reply text omitted for privacy.';
      entry.append(heading, body);
      if (report.note) {
        const note = document.createElement('p');
        note.textContent = 'Your concern: ' + report.note;
        entry.append(note);
      }
      list.append(entry);
    }
  } catch { list.textContent = 'Reports could not be opened.'; }
}
function reportControl(turn) {
  const panel = document.createElement('details');
  const toggle = document.createElement('summary');
  toggle.textContent = 'Report response';
  const reason = document.createElement('select');
  reason.setAttribute('aria-label', 'Reason for reporting');
  reason.add(new Option('Choose a reason', ''));
  for (const name of reportReasons) reason.add(new Option(name, name));
  const send = document.createElement('button');
  send.type = 'button';
  send.textContent = 'Save report on this device';
  send.disabled = true;
  const label = document.createElement('label');
  label.hidden = true;
  label.textContent = 'Describe your concern (optional). Leave out your full name, home address, email, and phone number.';
  const note = document.createElement('textarea');
  note.maxLength = 500;
  label.append(note);
  reason.onchange = () => {
    send.disabled = !reason.value;
    label.hidden = reason.value !== 'Other safety concern';
    message.textContent = '';
    if (!label.hidden) note.focus();
  };
  const message = document.createElement('span');
  message.setAttribute('role', 'status');
  send.onclick = () => {
    try {
      saveReport(reason.value, turn.answer, note.value);
      send.disabled = reason.disabled = note.disabled = true;
      message.textContent = ' Report saved. You can show it to a trusted adult in Safety reports.';
      renderReports();
    } catch (error) {
      message.textContent = error instanceof RangeError ? error.message : ' Could not save this report. You can show the reply to a trusted adult.';
    }
  };
  panel.append(toggle, reason, label, send, message);
  return panel;
}
renderReports();
function showTurn(turn) {
  const exchange = document.createElement('section');
  exchange.className = 'answer';
  const heading = document.createElement('h2');
  heading.textContent = turn.question;
  const paragraph = document.createElement('p');
  paragraph.textContent = turn.answer;
  exchange.append(heading, paragraph, favoriteButton(turn), reportControl(turn));
  thread.append(exchange);
}
saveButton.onclick = () => {
  try {
    const code = saveChat(turns, form.elements.mode.value);
    chatStatus.textContent = 'Saved in this browser. Your code is ' + code;
  } catch (error) {
    chatStatus.textContent = error.message;
  }
};
loadForm.onsubmit = event => {
  event.preventDefault();
  if (check.disabled) return;
  try {
    const chat = loadChat(loadForm.elements.code.value);
    resetThread();
    turns = chat.turns.map(turn => ({...turn, answer:plainMath(turn.answer)}));
    select(chat.mode);
    question.value = turns[0].question;
    result.textContent = turns[0].answer;
    firstFavorite.replaceChildren(favoriteButton(turns[0]), reportControl(turns[0]));
    turns.slice(1).forEach(showTurn);
    const last = turns.at(-1);
    previous = {question:last.question, answer:last.answer.slice(0,20000)};
    replies.hidden = false;
    if (last.mode === 'quiz') openQuizAnswer();
    saveButton.disabled = false;
    chatStatus.textContent = 'Chat loaded. You can ask a follow-up.';
  } catch (error) {
    chatStatus.textContent = error.message;
  }
};
function resetThread() {
  firstFavorite.replaceChildren();
  previous = undefined;
  turns = [];
  replyStatus.textContent = '';
  saveButton.disabled = true;
  chatStatus.textContent = '';
  thread.replaceChildren();
  replies.hidden = true;
  continuation.hidden = true;
  next.value = '';
  status.textContent = '';
}
const clarify = document.querySelector('#clarify');
let clarifying = false;
let selectedContext;
function captureTerm() {
  if (!clarifying || continuation.hidden || check.disabled) return;
  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  const answerText = element.closest?.('.answer p');
  const term = selection.toString().trim();
  if (!answerText || !term || term.length > next.maxLength) return;
  const index = answerText === result ? 0 : Array.from(thread.children).indexOf(answerText.closest('.answer')) + 1;
  const turn = turns[index];
  if (!turn) return;
  selectedContext = {question:turn.question, answer:turn.answer.slice(0,20000)};
  next.value = term;
}
document.addEventListener('selectionchange', captureTerm);
next.addEventListener('input', () => { selectedContext = undefined; });
function openReply(askForTerm) {
  answeringQuiz = false;
  clarifying = askForTerm;
  selectedContext = undefined;
  continuation.querySelector('label').textContent = clarifying ? 'Highlight a word or phrase in any answer above, or type it here. Then press Check.' : 'Your follow-up question';
  replies.hidden = true;
  continuation.hidden = false;
  next.focus();
}
follow.onclick = () => openReply(false);
clarify.onclick = () => openReply(true);
function select(mode) {
  if (!Object.hasOwn(styles, mode)) mode = 'simple';
  form.elements.mode.value = mode;
  document.querySelector('#prompt').textContent = styles[mode][1];
  save(mode);
}
for (const [value, [name]] of Object.entries(styles)) {
  const label = document.createElement('label');
  const radio = document.createElement('input');
  Object.assign(radio,{type:'radio',name:'mode',value});
  radio.onchange = () => select(value);
  const caption = document.createElement('span');
  caption.textContent = name;
  label.append(radio,caption);
  document.querySelector('#modes').append(label);
}
select(state.mode);
const subjects = {
  "Math": [
    ["Fractions","How do I compare two fractions?"],
    ["Equations","How do I keep an equation balanced?"],
    ["Ratios","How can a ratio help me scale a recipe?"],
    ["Percentages","How do I find a percent of a number?"],
    ["Area","How can I find the area of an L-shaped room?"],
  ],
  "Science": [
    ["Forces","How does friction affect motion?"],
    ["Ecosystems","How does energy move through a food web?"],
    ["Moon phases","Why does the Moon look different throughout the month?"],
    ["Circuits","Why does a bulb need a complete circuit to light up?"],
    ["States of matter","What happens to water particles when ice melts?"],
  ],
  "English language arts": [
    ["Theme","How can I find the theme of a story?"],
    ["Persuasive writing","What makes evidence support a claim?"],
    ["Point of view","How does the narrator change what I know about a story?"],
    ["Metaphors","How can I tell when a writer is using a metaphor?"],
    ["Paragraphs","How do I choose details that support my topic sentence?"],
  ],
  "Social studies": [
    ["Primary sources","How can a diary help us understand history?"],
    ["Geography","How do rivers affect where cities grow?"],
    ["Trade","Why did trading towns grow along busy routes?"],
    ["Civics","How do local governments decide which services to provide?"],
    ["Historical timelines","How can a timeline help me understand a historical event?"],
  ],
  "Art": [
    ["Perspective","How do artists show distance on a flat page?"],
    ["Color","What are complementary colors?"],
    ["Shading","How can shading make a circle look like a sphere?"],
    ["Texture","How can I draw a surface so it looks rough?"],
    ["Composition","How can an artist draw attention to one part of a picture?"],
  ],
};
const subject = document.querySelector('#subject');
const topic = document.querySelector('#topic');
for (const name of Object.keys(subjects)) subject.add(new Option(name, name));
subject.onchange = () => {
  topic.replaceChildren(new Option('Choose a topic', ''));
  for (const [label, prompt] of subjects[subject.value] ?? []) topic.add(new Option(label, prompt));
  document.querySelector('#topic-field').hidden = !subject.value;
};
topic.onchange = () => {
  if (!topic.value) return;
  question.value = topic.value;
  question.focus();
};
for (const item of state.samples) {
  const button = document.createElement('button');
  const title = document.createElement('strong');
  title.textContent = item.title;
  const mode = document.createElement('small');
  mode.textContent = styles[item.mode][0];
  button.append(title,mode);
  button.onclick = () => { if (check.disabled) return; resetThread(); select(item.mode); question.value = item.question; question.focus(); };
  document.querySelector('#samples').append(button);
}
async function submit(isFollow, submitted, mode, output) {
  if (check.disabled || !submitted) return;
  if (looksPersonal(submitted)) {
    const field = isFollow ? next : question;
    const reminder = document.getElementById(field.getAttribute('aria-describedby'));
    const original = reminder.dataset.original ?? reminder.textContent;
    reminder.dataset.original = original;
    field.oninput = () => { reminder.textContent = original; field.oninput = null; };
    reminder.textContent = 'Please remove personal details such as your address or email, then press Check again.';
    field.focus();
    return;
  }
  if (!isFollow) resetThread();
  replyStatus.textContent = '';
  for (const button of replies.querySelectorAll('button')) button.disabled = true;
  const send = continuation.querySelector('button');
  saveButton.disabled = loadForm.querySelector('button').disabled = true;
  check.disabled = send.disabled = true;
  output.textContent = 'Thinking…';
  try {
    const reply = await fetch('/ask', {method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({mode,question:submitted, ...(isFollow && mode === 'homework' ? {history:hintHistory(turns)} : {previous:mode === 'clarify' ? selectedContext ?? previous : previous})})});
    const data = await reply.json();
    if (!reply.ok || typeof data.answer !== 'string' || data.remember === false) {
      output.textContent = data.error ?? data.answer ?? 'Please try again.';
      return;
    }
    const turn = {question:submitted, answer:plainMath(data.answer)};
    if (mode === 'quiz') turn.mode = 'quiz';
    turns.push(turn);
    previous = {question:submitted, answer:turn.answer.slice(0,20000)};
    if (isFollow) {
      showTurn(turn);
      replyStatus.textContent = '';
      continuation.hidden = true;
      next.value = '';
      status.textContent = '';
    } else {
      result.textContent = turn.answer;
      firstFavorite.replaceChildren(favoriteButton(turn), reportControl(turn));
    }
    replies.hidden = false;
    if (mode === 'quiz') openQuizAnswer();
    else if (isFollow) follow.focus();
  } catch { output.textContent = 'Check your internet connection and try again.'; }
  finally {
    for (const button of replies.querySelectorAll('button')) button.disabled = false;
    check.disabled = send.disabled = loadForm.querySelector('button').disabled = false;
    saveButton.disabled = turns.length === 0;
  }
}
form.onsubmit = continuation.onsubmit = event => {
  event.preventDefault();
  const isFollow = event.currentTarget === continuation;
  submit(isFollow, (isFollow ? next : question).value.trim(), isFollow && answeringQuiz ? 'quizFeedback' : isFollow && clarifying ? 'clarify' : form.elements.mode.value, isFollow ? status : result);
};
for (const [mode, prompt] of Object.entries(quickReplies)) {
  document.getElementById(mode).onclick = () => submit(true, prompt, mode, replyStatus);
}

import {loadLook, saveLook} from './storage.js';
const panel = document.querySelector('#look');
const toggle = document.querySelector('#customize');
const choices = [...panel.querySelectorAll('select')];
const layout = document.querySelector('.layout');
const sidebar = layout.querySelector('aside');
function applyLook() {
  for (const choice of choices) document.body.dataset[choice.name] = choice.value;
  if (document.body.dataset.side === 'before') layout.prepend(sidebar);
  else layout.append(sidebar);
  sidebar.prepend(document.querySelector(document.body.dataset.first === 'chats' ? '#chats' : '#practice'));
}
function rememberLook() {
  applyLook();
  saveLook(Object.fromEntries(choices.map(choice => [choice.name, choice.value])));
}
const savedLook = loadLook();
for (const choice of choices) {
  if ([...choice.options].some(option => option.value === savedLook[choice.name])) {
    choice.value = savedLook[choice.name];
  }
  choice.onchange = rememberLook;
}
applyLook();
toggle.onclick = () => {
  panel.hidden = !panel.hidden;
  toggle.setAttribute('aria-expanded', String(!panel.hidden));
};
document.querySelector('#reset-look').onclick = () => {
  for (const choice of choices) choice.selectedIndex = 0;
  rememberLook();
};
