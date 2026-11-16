const fs = require('fs');
const path = 'src/pages/RealTimeInsights.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');
const fixed = lines.slice(0, 268).join('\n') + '\n';
const temp = fs.readFileSync('src/pages/temp.jsx', 'utf8');
fs.writeFileSync(path, fixed + temp, 'utf8');
console.log('Fixed successfully!');
