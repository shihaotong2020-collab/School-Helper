function fractionPart(value) {
  const part = value.trim();
  return /^[a-zA-Z0-9.]+$/.test(part) ? part : '(' + part + ')';
}

export function plainMath(answer) {
  let text = answer.replace(/\\[()[\]]/g, '')
    .replace(/\\(?:times|cdot)\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\(?:left|right)(?=[()[\]])/g, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1');
  // Convert inner fractions first so compound numerators stay grouped.
  const fraction = /\\(?:dfrac|tfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g;
  while (text.match(fraction)) {
    text = text.replace(fraction, (_, top, bottom) => fractionPart(top) + '/' + fractionPart(bottom));
  }
  return text;
}
