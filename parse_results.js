const fs = require('fs');
const path = require('path');
const results = require('./test_results.json');
let failures = [];
results.testResults.forEach(tr => {
    tr.assertionResults.forEach(ar => {
        if (ar.status === 'failed') {
            failures.push({
                file: path.basename(tr.name),
                title: ar.title,
                error: ar.failureMessages[0].substring(0, 300)
            });
        }
    });
});
console.log(`Total failures: ${failures.length}`);
failures.slice(0, 10).forEach(f => {
    console.log(`\nFILE: ${f.file}\nTEST: ${f.title}\nERROR: ${f.error}`);
});
console.log('\n--- Showing first 10 failures ---');
