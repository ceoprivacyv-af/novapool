import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/main.jsx';
let source = readFileSync(file, 'utf8');

// Keep the production source parse-safe. The old optional payout banner is removed
// before Vite sees the file; payout success is handled by the authenticated overlay
// injected after the build.
const bannerStart = source.indexOf('  const payoutBanner = latestPayout &&');
const bannerEnd = source.indexOf('\n\n  return <main', bannerStart);
if (bannerStart !== -1 && bannerEnd !== -1) {
  source = source.slice(0, bannerStart) + source.slice(bannerEnd);
}
source = source.replace(/\{payoutBanner\}/g, '');

// Use the final operator-facing wording directly in the React source as well.
source = source.replace(/Mark payout sent/g, 'Money Delivered');

if (source.includes('const payoutBanner = latestPayout &&')) {
  throw new Error('Could not remove payout banner before Vite build.');
}

writeFileSync(file, source);
