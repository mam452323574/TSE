const fs = require('fs');

try {
    // Read the utf8 file, removing a potential BOM signature if Get-Content added it
    let content = fs.readFileSync('test-results-utf8.json', 'utf8');
    content = content.replace(/^\uFEFF/, '');

    // Jest output when mixed with console logs might not completely be valid JSON
    // Let's try to extract the first JSON object using a simple regex or just parse
    // actually, let's just parse it and if it fails, fallback to regex
    const firstBrace = content.indexOf('{');
    if (firstBrace !== -1) {
        content = content.substring(firstBrace);
    }

    const data = JSON.parse(content);

    const failingSuites = data.testResults.filter(r => r.status === 'failed');
    console.log(`Total test suites: ${data.numTotalTestSuites}`);
    console.log(`Failing test suites: ${data.numFailedTestSuites}`);
    console.log('--- FAILING TESTS ---');

    failingSuites.forEach(suite => {
        console.log(`=============`);
        console.log(`File: ${suite.name}`);
        console.log(`Error Message: \n${suite.message}`);
    });
} catch (error) {
    console.error('Failed to parse JSON:', error.message);
}
