import fs from 'node:fs';

const path = 'src/main.jsx';
let source = fs.readFileSync(path, 'utf8');

const oldRefresh = `  const refreshAdmin = async () => {\n    const [depositsResult, pendingResult, approvedResult] = await Promise.all([\n      supabase.from('np_deposit_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),\n      supabase.from('np_withdrawal_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),\n      supabase.from('np_withdrawal_requests').select('*').eq('status', 'approved').order('reviewed_at', { ascending: true }),\n    ]);\n    setAdminDeposits(depositsResult.data || []);\n    setAdminWithdrawals(pendingResult.data || []);\n    setAdminApproved(approvedResult.data || []);\n  };`;
const newRefresh = `  const refreshAdmin = async () => {\n    const [depositsResult, pendingResult, approvedResult] = await Promise.all([\n      supabase.from('np_deposit_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),\n      supabase.from('np_withdrawal_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),\n      supabase.from('np_withdrawal_requests').select('*').eq('status', 'approved').order('reviewed_at', { ascending: true }),\n    ]);\n\n    const depositRows = depositsResult.data || [];\n    const depositsWithProofs = await Promise.all(depositRows.map(async row => {\n      if (!row.screenshot_path) return { ...row, screenshot_url: null, screenshot_error: null };\n      const { data, error } = await supabase.storage\n        .from('np-deposit-proofs')\n        .createSignedUrl(row.screenshot_path, 3600);\n      return {\n        ...row,\n        screenshot_url: data?.signedUrl || null,\n        screenshot_error: error?.message || null,\n      };\n    }));\n\n    setAdminDeposits(depositsWithProofs);\n    setAdminWithdrawals(pendingResult.data || []);\n    setAdminApproved(approvedResult.data || []);\n  };`;
if (!source.includes(oldRefresh)) throw new Error('refreshAdmin block not found');
source = source.replace(oldRefresh, newRefresh);

const oldDelete = `      if (row.screenshot_path) await supabase.storage.from('np-deposit-proofs').remove([row.screenshot_path]);\n`;
if (!source.includes(oldDelete)) throw new Error('deposit proof deletion line not found');
source = source.replace(oldDelete, '');

function findBalancedExpression(text, start) {
  const open = text.indexOf('{adminDeposits.map', start);
  if (open < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && n === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

const start = source.indexOf('{adminDeposits.map');
if (start < 0) throw new Error('adminDeposits.map not found');
const end = findBalancedExpression(source, start);
if (end < 0) throw new Error('could not find end of adminDeposits.map expression');

const replacement = `{adminDeposits.map(row => (\n            <div key={row.id} className="admin-deposit-card" style={{ marginBottom: 16, padding: 16, border: '1px solid rgba(212,175,55,.25)', borderRadius: 18, background: 'rgba(255,255,255,.025)' }}>\n              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>\n                <div>\n                  <strong>{money(row.amount)} · {row.network}</strong>\n                  <div style={{ opacity: .72, marginTop: 6 }}>{dateText(row.created_at)}</div>\n                  <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12, opacity: .8 }}>TX: {row.tx_hash || '—'}</div>\n                  <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12, opacity: .72 }}>User: {row.user_id}</div>\n                </div>\n                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>\n                  <button type="button" onClick={() => reviewDeposit(row, true)} disabled={busy}>Approve & credit</button>\n                  <button type="button" onClick={() => reviewDeposit(row, false)} disabled={busy}>Reject</button>\n                </div>\n              </div>\n              <div style={{ marginTop: 16 }}>\n                <div style={{ fontSize: 12, letterSpacing: '.08em', opacity: .72, marginBottom: 8 }}>PAYMENT SCREENSHOT</div>\n                {row.screenshot_url ? (\n                  <div>\n                    <a href={row.screenshot_url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>\n                      <img src={row.screenshot_url} alt="Deposit payment proof" style={{ display: 'block', width: '100%', maxWidth: 520, maxHeight: 520, objectFit: 'contain', borderRadius: 14, border: '1px solid rgba(212,175,55,.2)', background: '#080808' }} />\n                    </a>\n                    <a href={row.screenshot_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8 }}>View full screenshot ↗</a>\n                  </div>\n                ) : (\n                  <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,.04)', opacity: .75 }}>\n                    {row.screenshot_error ? 'Could not load proof: ' + row.screenshot_error : 'No screenshot attached to this deposit.'}\n                  </div>\n                )}\n              </div>\n            </div>\n          ))}`;
source = source.slice(0, start) + replacement + source.slice(end);

fs.writeFileSync(path, source);
console.log('NovaPool deposit-proof frontend patch applied.');
