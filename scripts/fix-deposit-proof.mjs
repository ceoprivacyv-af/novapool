import fs from 'node:fs';

const path = 'src/main.jsx';
let source = fs.readFileSync(path, 'utf8');

const oldRefresh = `  const refreshAdmin = async () => {
    const [depositsResult, pendingResult, approvedResult] = await Promise.all([
      supabase.from('np_deposit_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('np_withdrawal_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('np_withdrawal_requests').select('*').eq('status', 'approved').order('reviewed_at', { ascending: true }),
    ]);
    setAdminDeposits(depositsResult.data || []);
    setAdminWithdrawals(pendingResult.data || []);
    setAdminApproved(approvedResult.data || []);
  };`;

const newRefresh = `  const refreshAdmin = async () => {
    const [depositsResult, pendingResult, approvedResult] = await Promise.all([
      supabase.from('np_deposit_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('np_withdrawal_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('np_withdrawal_requests').select('*').eq('status', 'approved').order('reviewed_at', { ascending: true }),
    ]);
    const depositRows = depositsResult.data || [];
    const depositsWithProofs = await Promise.all(depositRows.map(async row => {
      if (!row.screenshot_path) return { ...row, screenshot_url: null, screenshot_error: 'No screenshot attached.' };
      const { data, error } = await supabase.storage.from('np-deposit-proofs').createSignedUrl(row.screenshot_path, 3600);
      return { ...row, screenshot_url: data?.signedUrl || null, screenshot_error: error?.message || null };
    }));
    setAdminDeposits(depositsWithProofs);
    setAdminWithdrawals(pendingResult.data || []);
    setAdminApproved(approvedResult.data || []);
  };`;

if (!source.includes(oldRefresh)) throw new Error('refreshAdmin block not found');
source = source.replace(oldRefresh, newRefresh);

const oldDelete = `      if (row.screenshot_path) await supabase.storage.from('np-deposit-proofs').remove([row.screenshot_path]);\n`;
source = source.replace(oldDelete, '');

const oldDepositForm = `<button className="primary-btn" disabled={p.busy} onClick={p.submitDeposit}>{p.busy ? 'Submitting…' : 'Submit deposit for review'} <span>→</span></button></div>}`;
const newDepositForm = `<button className="primary-btn" disabled={p.busy || p.deposits.some(row => row.status === 'pending')} onClick={p.submitDeposit}>{p.busy ? 'Submitting…' : p.deposits.some(row => row.status === 'pending') ? 'Deposit pending approval' : 'Submit deposit for review'} <span>→</span></button><div className="history-list"><h3>Deposit history</h3>{p.deposits.length ? p.deposits.map(row => <div className="profile-detail" key={row.id}><span><strong>{money(row.amount)}</strong><small>{row.network} · {dateText(row.created_at)}</small></span><strong>{row.status === 'pending' ? 'PENDING' : row.status === 'approved' ? 'APPROVED' : row.status.toUpperCase()}</strong></div>) : <p className="muted">No deposits submitted yet.</p>}</div></div>}`;
if (!source.includes(oldDepositForm)) throw new Error('deposit form block not found');
source = source.replace(oldDepositForm, newDepositForm);

const start = source.indexOf('function AdminPanel(p) {');
const end = source.indexOf('function PayoutSuccess(', start);
if (start < 0 || end < 0) throw new Error('AdminPanel block not found');

const newAdminPanel = `function AdminPanel(p) {
  const [section, setSection] = useState('deposits');
  return <section className="page-content"><div className="page-title-row"><div><p className="eyebrow">PRIVATE ADMIN CONSOLE</p><h1>Manage <span>NovaPool.</span></h1><p className="muted">Approve payouts first. Send crypto externally. Then click Money Delivered only after the transfer is complete.</p></div><button className="text-link" onClick={p.refresh}>Refresh ↻</button></div><div className="admin-grid"><div className="admin-stat"><span>Pending deposits</span><strong>{p.deposits.length}</strong></div><div className="admin-stat"><span>Pending payouts</span><strong>{p.withdrawals.length}</strong></div><div className="admin-stat"><span>Approved payouts</span><strong>{p.approved.length}</strong></div></div><div className="wallet-panel"><div className="wallet-tabs"><button className={section === 'deposits' ? 'active' : ''} onClick={() => setSection('deposits')}>Deposits ({p.deposits.length})</button><button className={section === 'payouts' ? 'active' : ''} onClick={() => setSection('payouts')}>Payouts ({p.withdrawals.length + p.approved.length})</button></div>{section === 'deposits' && <div className="admin-list">{p.deposits.length ? p.deposits.map(row => <article className="admin-item" key={row.id}><div className="admin-item-head"><div><strong>{money(row.amount)} · {row.network}</strong><small>{dateText(row.created_at)}</small></div><span className="pending-pill">PENDING</span></div><p>TX: {row.tx_hash || 'Not supplied'}</p><p>User: {row.user_id}</p><div style={{ margin: '18px 0', padding: 14, border: '1px solid rgba(212,175,55,.28)', borderRadius: 16, background: 'rgba(255,255,255,.025)' }}><strong style={{ display: 'block', marginBottom: 10 }}>PAYMENT SCREENSHOT</strong>{row.screenshot_url ? <><img src={row.screenshot_url} alt="Payment proof" style={{ display: 'block', width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 12, background: '#050505', border: '1px solid rgba(255,255,255,.12)' }} /><a href={row.screenshot_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10 }}>View full screenshot ↗</a></> : <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,.04)', opacity: .75 }}>{row.screenshot_error || 'Screenshot could not be loaded. Refresh and try again.'}</div>}</div><div className="admin-actions"><button className="primary-btn" disabled={p.busy} onClick={() => p.reviewDeposit(row, true)}>Approve & credit</button><button className="signout-btn" disabled={p.busy} onClick={() => p.reviewDeposit(row, false)}>Reject</button></div></article>) : <p className="muted">No pending deposits.</p>}</div>}{section === 'payouts' && <div className="admin-list"><label>Message shown to approved user<textarea value={p.message} onChange={e => p.setMessage(e.target.value)} rows={3} /></label>{p.withdrawals.length ? p.withdrawals.map(row => <article className="admin-item" key={row.id}><div className="admin-item-head"><div><strong>{money(row.amount)} · {row.network}</strong><small>{dateText(row.created_at)}</small></div><span className="pending-pill">PENDING</span></div><p>Destination: {row.destination_address}</p><p>User: {row.user_id}</p><div className="admin-actions"><button className="primary-btn" disabled={p.busy} onClick={() => p.reviewWithdrawal(row, true)}>Approve payout</button><button className="signout-btn" disabled={p.busy} onClick={() => p.reviewWithdrawal(row, false)}>Reject & refund</button></div></article>) : <p className="muted">No pending payouts.</p>}{p.approved.length > 0 && <><h3 style={{ marginTop: 26 }}>Approved — send externally</h3>{p.approved.map(row => <article className="admin-item" key={row.id}><div className="admin-item-head"><div><strong>{money(row.amount)} · {row.network}</strong><small>Approved {dateText(row.reviewed_at)}</small></div><span className="pending-pill">APPROVED</span></div><p>Destination: {row.destination_address}</p><p>User: {row.user_id}</p><p className="muted">Send the crypto externally, then click Money Delivered. This is the only action that tells the user their payout was delivered.</p><div className="admin-actions"><button className="primary-btn" disabled={p.busy} onClick={() => p.markPaid(row)}>Money Delivered</button></div></article>)}</>}</div>}</div><div className="note-banner"><span className="note-icon">◆</span><div><strong>Admin safety</strong><p>Never click Money Delivered before the external transfer is actually complete.</p></div></div></section>;
}

`;
source = source.slice(0, start) + newAdminPanel + source.slice(end);
fs.writeFileSync(path, source);
console.log('NovaPool deposit proof, pending-lock, and deposit-history patch applied.');
