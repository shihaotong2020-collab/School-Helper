import {load, save} from './storage.js';
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
function resetThread() {
  previous = undefined;
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
    previous = {question:submitted, answer:data.answer.slice(0,20000)};
    if (isFollow) {
      const exchange = document.createElement('section');
      exchange.className = 'answer';
      const heading = document.createElement('h2');
      heading.textContent = submitted;
      const paragraph = document.createElement('p');
      paragraph.textContent = data.answer;
      exchange.append(heading, paragraph);
      thread.append(exchange);
      continuation.hidden = true;
      next.value = '';
      status.textContent = '';
    } else {
      result.textContent = data.answer;
    }
    follow.hidden = false;
    if (isFollow) follow.focus();
  } catch { output.textContent = 'Check your internet connection and try again.'; }
  finally { check.disabled = send.disabled = false; }
}
form.onsubmit = continuation.onsubmit = submit;
