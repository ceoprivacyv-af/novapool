import fs from 'node:fs';

const path = 'src/main.jsx';
let source = fs.readFileSync(path, 'utf8');
const marker = "import './styles.css';";
const importLine = "import './referral.jsx';";
if (!source.includes(importLine)) {
  if (!source.includes(marker)) throw new Error('NovaPool styles import not found.');
  source = source.replace(marker, `${marker}\n${importLine}`);
  fs.writeFileSync(path, source);
}
console.log('NovaPool standalone referral frontend enabled.');
