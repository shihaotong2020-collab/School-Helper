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
  button.onclick = () => { select(item.mode); question.value = item.question; question.focus(); };
  document.querySelector('#samples').append(button);
}
form.onsubmit = async event => {
  event.preventDefault();
  if (check.disabled || !question.value.trim()) return;
  check.disabled = true;
  result.textContent = 'Thinking…';
  try {
    const reply = await fetch('/ask', {method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({mode:form.elements.mode.value,question:question.value.trim()})});
    const data = await reply.json();
    result.textContent = data.answer ?? data.error;
  } catch { result.textContent = 'Check your internet connection and try again.'; }
  finally { check.disabled = false; }
};
