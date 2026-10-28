import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/main.jsx';
let source = readFileSync(file, 'utf8');

// The payout banner introduced an invalid JSX expression in the current source.
// Remove that optional banner before Vite parses the file; the authenticated payout
// success overlay is injected into the production bundle by payout-ui-patch.mjs.
source = source.replace(/\n  const payoutBanner = latestPayout &&[\s\S]*?;\n\n  return <main/, '\n\n  return <main');
source = source.replace(/\{payoutBanner\}/g, '');

writeFileSync(file, source);
