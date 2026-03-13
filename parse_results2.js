const fs = require('fs');
const results = require('./test_results.json');
let out = `Total failures: ${results.testResults.reduce((acc, tr) => acc + tr.assertionResults.filter(ar => ar.status === 'failed').length, 0)}\n\n`;
results.testResults.forEach(tr => {
    const file = require('path').basename(tr.name);
    tr.assertionResults.forEach(ar => {
        if (ar.status === 'failed') {
            out += `FILE: ${file}\nTEST: ${ar.title}\nERROR: ${ar.failureMessages[0].split('\n').slice(0, 5).join('\n')}\n\n`;
        }
    });
});
fs.writeFileSync('failures_summary.txt', out);
