import {plainMath} from './math.mjs';
import {load, save, loadChat, saveChat} from './storage.js';
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
let previous;
let turns = [];
const saveButton = document.querySelector('#save-chat');
const loadForm = document.querySelector('#load-chat');
const chatStatus = document.querySelector('#chat-status');
function showTurn(turn) {
  const exchange = document.createElement('section');
  exchange.className = 'answer';
  const heading = document.createElement('h2');
  heading.textContent = turn.question;
  const paragraph = document.createElement('p');
  paragraph.textContent = turn.answer;
  exchange.append(heading, paragraph);
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
    turns.slice(1).forEach(showTurn);
    const last = turns.at(-1);
    previous = {question:last.question, answer:last.answer.slice(0,20000)};
    follow.hidden = false;
    saveButton.disabled = false;
    chatStatus.textContent = 'Chat loaded. You can ask a follow-up.';
  } catch (error) {
    chatStatus.textContent = error.message;
  }
};
function resetThread() {
  previous = undefined;
  turns = [];
  saveButton.disabled = true;
  chatStatus.textContent = '';
  thread.replaceChildren();
  follow.hidden = true;
  continuation.hidden = true;
  next.value = '';
  status.textContent = '';
}
follow.onclick = () => {
  follow.hidden = true;
  continuation.hidden = false;
  next.focus();
};
function select(mode) {
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
async function submit(event) {
  event.preventDefault();
  const isFollow = event.currentTarget === continuation;
  const submitted = (isFollow ? next : question).value.trim();
  if (check.disabled || !submitted) return;
  if (!isFollow) resetThread();
  const output = isFollow ? status : result;
  const send = continuation.querySelector('button');
  saveButton.disabled = loadForm.querySelector('button').disabled = true;
  check.disabled = send.disabled = true;
  output.textContent = 'Thinking…';
  try {
    const reply = await fetch('/ask', {method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({mode:form.elements.mode.value,question:submitted,previous})});
    const data = await reply.json();
    if (!reply.ok || typeof data.answer !== 'string' || data.remember === false) {
      output.textContent = data.error ?? data.answer ?? 'Please try again.';
      return;
    }
    const turn = {question:submitted, answer:plainMath(data.answer)};
    turns.push(turn);
    previous = {question:submitted, answer:turn.answer.slice(0,20000)};
    if (isFollow) {
      showTurn(turn);
      continuation.hidden = true;
      next.value = '';
      status.textContent = '';
    } else {
      result.textContent = turn.answer;
    }
    follow.hidden = false;
    if (isFollow) follow.focus();
  } catch { output.textContent = 'Check your internet connection and try again.'; }
  finally {
    check.disabled = send.disabled = loadForm.querySelector('button').disabled = false;
    saveButton.disabled = turns.length === 0;
  }
}
form.onsubmit = continuation.onsubmit = submit;
