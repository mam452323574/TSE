const fs = require('fs');
const path = require('path');
const results = require('./test_results3.json');
let out = '';
let count = 0;
results.testResults.forEach(tr => {
    const file = path.basename(tr.name);
    tr.assertionResults.forEach(ar => {
        if (ar.status === 'failed') {
            count++;
            out += `FILE: ${file}\nTEST: ${ar.title}\nERROR: ${ar.failureMessages[0].split('\n').slice(0, 8).join('\n')}\n\n`;
        }
    });
});
out = `Total failures: ${count}\n\n` + out;
fs.writeFileSync('failures3.txt', out);
console.log(`Written ${count} failures`);
