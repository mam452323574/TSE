const fs = require('fs');
let content = fs.readFileSync('i18n/translations.ts', 'utf8');

const t = {
    'de': `        "tabs": {
            "home": "Startseite",
            "analytics": "Analysen",
            "scanner": "Scannen"
        },`,
    'es': `        "tabs": {
            "home": "Inicio",
            "analytics": "Análisis",
            "scanner": "Escáner"
        },`
};

for (const lang of ['de', 'es']) {
    if (!content.includes('"' + lang + '": {\n        "tabs":')) {
        content = content.replace(new RegExp('"' + lang + '": {\\s*'), '"' + lang + '": {\n' + t[lang] + '\n');
    }
}

fs.writeFileSync('i18n/translations.ts', content, 'utf8');
console.log('Injected tabs object.');
