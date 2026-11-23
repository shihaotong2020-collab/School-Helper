const key = 'school-helper-v1';
const samples = [
  {mode:'simple', title:'Moving particles', question:'Why do particles in a gas move faster on average when the gas gets hotter?'},
  {mode:'summary', title:'The water cycle', question:'Sunlight warms water in lakes. Some water evaporates and rises as vapor. As the air cools, water condenses into droplets. Droplets fall as precipitation. Water flows back into lakes and oceans.'},
  {mode:'steps', title:'A fraction problem', question:'How do I start adding 1/3 and 1/4?'},
];
const allowed = ['simple','summary','detail','homework','steps'];
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
