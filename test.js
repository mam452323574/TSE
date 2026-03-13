const fs = require('fs');
const content = fs.readFileSync('i18n/translations.ts', 'utf8');
const lines = content.split(/\r?\n/);
let inFr = false;
lines.forEach((l, i) => {
  if (l.includes('"fr": {')) inFr = true;
  if (l.includes('"en": {')) inFr = false;
  if (inFr && l.includes('Premium-Funktionen')) {
    console.log('FOUND IN FR', l);
  }
  if (inFr && l.includes('features_title')) {
    console.log('features_title in FR at line ' + (i + 1) + ': ' + l.trim());
  }
});
