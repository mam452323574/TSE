const fs = require('fs');
try {
    const data = require('./login.json');
    fs.writeFileSync('login_parsed.txt', data.testResults[0].message);
} catch (e) {
    console.error("error", e);
}
