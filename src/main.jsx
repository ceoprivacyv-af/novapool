import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import './styles.css';

const products = [
  { id: 'halo', name: 'Aurum Halo', category: 'SIGNATURE SERIES', description: 'A sculptural gold halo with a refined gallery-inspired finish.', price: 5, tone: 'gold', tag: 'FEATURED' },
  { id: 'arc', name: 'Obsidian Arc', category: 'OBSIDIAN SERIES', description: 'A dark mineral silhouette with a subtle metallic edge.', price: 10, tone: 'silver', tag: 'LIMITED' },
  { id: 'orb', name: 'Solstice Orb', category: 'ATELIER SERIES', description: 'Warm ambient light and a minimal architectural form.', price: 15, tone: 'bronze', tag: 'ATELIER' },
];
const networks = ['TRON (TRC20)', 'BNB Smart Chain (BEP20)', 'Plasma', 'opBNB'];
const addresses = { 'TRON (TRC20)': 'TDHUCQ6Zp3bA5xkpYMDGStXNrbXxgAswrz', 'BNB Smart Chain (BEP20)': '0xdb479140187481b5c68ea627cec7d989b2b75aa9', Plasma: '0xdb479140187481b5c68ea627cec7d989b2b75aa9', opBNB: '0xdb479140187481b5c68ea627cec7d989b2b75aa9' };

const money = n => `$${Number(n || 0).toFixed(2)}`;
const dateText = v => v ? new Date(v).toLocaleString() : '—';

function Art({ tone = 'gold' }) {
  return <div className={`product-art art-${tone}`}><div className="art-glow" /><div className="art-ring"><div className="ring-inner" /></div><div className="art-pedestal"><div className="pedestal-top" /></div><div className="art-reflection" /></div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [balance, setBalance] = useState(0);
  const [wallet, setWallet] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [adminDeposits, setAdminDeposits] = useState([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState([]);
  const [chosenProduct, setChosenProduct] = useState(0);
  const [walletSection, setWalletSection] = useState('deposit');
  const [depositNetwork, setDepositNetwork] = useState(networks[0]);
  const [depositAmount, setDepositAmount] = useState('5');
  const [txHash, setTxHash] = useState('');
  const [proof, setProof] = useState(null);
  const [withdrawNetwork, setWithdrawNetwork] = useState(networks[0]);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('10');
  const [busy, setBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState('Please wait up to 72 hours to receive your money.');

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Member';
  const product = products[chosenProduct];
  const claimable = useMemo(() => rewards.filter(r => !r.claimed_at && r.available_on <= new Date().toISOString().slice(0, 10)), [rewards]);

  async function refreshAccount(s = session) {
    if (!s?.user) return;
    const uid = s.user.id;
    const [w, pu, rw, le, de, wd, ad] = await Promise.all([
      supabase.from('np_wallets').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('np_purchases').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('np_rewards').select('*').eq('user_id', uid).order('available_on', { ascending: true }),
      supabase.from('np_ledger').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
      supabase.from('np_deposit_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('np_withdrawal_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('np_admin_users').select('user_id').eq('user_id', uid).maybeSingle(),
    ]);
    setWallet(w.data || null); setBalance(Number(w.data?.balance || 0)); setPurchases(pu.data || []); setRewards(rw.data || []); setLedger(le.data || []); setDeposits(de.data || []); setWithdrawals(wd.data || []); setIsAdmin(!!ad.data);
    if (ad.data) { setTab('admin'); await refreshAdmin(); }
  }

  async function refreshAdmin() {
    const { data: d } = await supabase.from('np_deposit_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true });
    const { data: w } = await supabase.from('np_withdrawal_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true });
    setAdminDeposits(d || []); setAdminWithdrawals(w || []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => { setSession(data.session); if (data.session) await refreshAccount(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => { setSession(next); if (next) await refreshAccount(next); else { setIsAdmin(false); setTab('home'); } });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function authSubmit(e) {
    e.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      if (mode === 'signup') {
        if (!agreed) throw new Error('Please agree to the Terms and Privacy Policy.');
        const { data, error: e1 } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin } });
        if (e1) throw e1; setNotice(data.session ? 'Account created.' : 'Account created. Check your email if confirmation is enabled.');
      } else {
        const { error: e1 } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (e1) throw e1;
      }
    } catch (e2) { setError(e2.message || 'Authentication failed.'); } finally { setLoading(false); }
  }

  async function submitDeposit() {
    if (!session?.user) return; setBusy(true); setError(''); setNotice('');
    try {
      const amount = Number(depositAmount); if (amount < 5) throw new Error('Minimum deposit is $5.'); if (!proof) throw new Error('Upload your payment screenshot.');
      const ext = proof.name.split('.').pop()?.toLowerCase() || 'jpg'; const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from('np-deposit-proofs').upload(path, proof, { contentType: proof.type, upsert: false }); if (up.error) throw up.error;
      const { error: rpcError } = await supabase.rpc('np_submit_deposit', { p_amount: amount, p_network: depositNetwork, p_screenshot_path: path, p_tx_hash: txHash.trim() || null }); if (rpcError) { await supabase.storage.from('np-deposit-proofs').remove([path]); throw rpcError; }
      setProof(null); setTxHash(''); setNotice('Deposit submitted. An admin will verify the transaction and credit your balance.'); await refreshAccount();
    } catch (e) { setError(e.message || 'Deposit submission failed.'); } finally { setBusy(false); }
  }

  async function buyProduct() {
    setBusy(true); setError(''); setNotice('');
    try { const { data, error: e } = await supabase.rpc('np_buy_product', { p_product_id: product.id, p_product_name: product.name, p_amount: product.price }); if (e) throw e; await supabase.rpc('np_create_rewards_for_purchase', { p_purchase_id: data, p_amount: product.price }); setNotice(`${product.name} purchased. Your daily claim schedule is now active.`); await refreshAccount(); } catch (e) { setError(e.message || 'Purchase failed.'); } finally { setBusy(false); }
  }

  async function claimRewards() {
    setBusy(true); setError('');
    try { const { data, error: e } = await supabase.rpc('np_claim_daily_reward'); if (e) throw e; setNotice(`${money(data)} claimed and added to your balance.`); await refreshAccount(); } catch (e) { setError(e.message || 'No reward is available yet.'); } finally { setBusy(false); }
  }

  async function submitWithdrawal() {
    setBusy(true); setError(''); setNotice('');
    try { const amount = Number(withdrawAmount); const { error: e } = await supabase.rpc('np_submit_withdrawal', { p_network: withdrawNetwork, p_destination_address: withdrawAddress.trim(), p_amount: amount }); if (e) throw e; setNotice('Payout request sent to admin for review.'); setWithdrawAddress(''); await refreshAccount(); } catch (e) { setError(e.message || 'Payout request failed.'); } finally { setBusy(false); }
  }

  async function proofUrl(path) { const { data, error: e } = await supabase.storage.from('np-deposit-proofs').createSignedUrl(path, 300); if (e) throw e; return data.signedUrl; }

  async function reviewDeposit(row, approve) {
    setBusy(true); setError('');
    try { const { error: e } = await supabase.rpc('np_admin_review_deposit', { p_request_id: row.id, p_approve: approve, p_note: approve ? 'Deposit verified and credited to your NovaPool balance.' : 'Deposit could not be verified.' }); if (e) throw e; if (row.screenshot_path) await supabase.storage.from('np-deposit-proofs').remove([row.screenshot_path]); await refreshAdmin(); setNotice(approve ? 'Deposit approved and credited.' : 'Deposit rejected.'); } catch (e) { setError(e.message || 'Review failed.'); } finally { setBusy(false); }
  }

  async function reviewWithdrawal(row, approve) {
    setBusy(true); setError('');
    try { const { error: e } = await supabase.rpc('np_admin_review_withdrawal', { p_request_id: row.id, p_approve: approve, p_message: approve ? (adminMessage.trim() || 'Please wait up to 72 hours to receive your money.') : (adminMessage.trim() || 'Your payout request was rejected and the amount was returned to your balance.') }); if (e) throw e; await refreshAdmin(); setNotice(approve ? 'Payout approved. Send the payout externally and the user will see the 72-hour message.' : 'Payout rejected and refunded.'); } catch (e) { setError(e.message || 'Review failed.'); } finally { setBusy(false); }
  }

  async function signOut() { await supabase.auth.signOut(); }

  if (!session) return <main className="auth-shell"><div className="auth-card"><div className="brand-lockup"><span className="brand-mark">N</span><span>NovaPool<small>THE DIGITAL ATELIER</small></span></div><p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'CREATE YOUR SPACE'}</p><h1>{mode === 'login' ? 'Sign in to your pool.' : 'Start your NovaPool account.'}</h1>{error && <div className="app-message error">{error}</div>}{notice && <div className="app-message">{notice}</div>}<form onSubmit={authSubmit}>{mode === 'signup' && <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} required /></label>}<label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></label>{mode === 'signup' && <label className="check-row"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /> I agree to the Terms and Privacy Policy.</label>}<button className="primary-btn" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button></form><button className="text-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}</button></div></main>;

  const nav = isAdmin ? [{ id: 'admin', label: 'Admin', icon: '◆' }, { id: 'home', label: 'Home', icon: '⌂' }, { id: 'product', label: 'Products', icon: '◇' }, { id: 'wallet', label: 'Wallet', icon: '▣' }, { id: 'profile', label: 'Profile', icon: '◉' }] : [{ id: 'home', label: 'Home', icon: '⌂' }, { id: 'product', label: 'Products', icon: '◇' }, { id: 'wallet', label: 'Wallet', icon: '▣' }, { id: 'profile', label: 'Profile', icon: '◉' }];

  return <main className="app-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><header className="app-header"><button className="wordmark" onClick={() => setTab(isAdmin ? 'admin' : 'home')}><span className="brand-mark">N</span><span>NovaPool<small>THE DIGITAL ATELIER</small></span></button><div className="header-right"><div className="header-balance"><small>BALANCE</small><strong>{money(balance)}</strong></div><button className="avatar-button" onClick={() => setTab('profile')}>{userName.slice(0, 1).toUpperCase()}</button></div></header>
    <div className="app-content">{notice && <div className="app-message">{notice}<button onClick={() => setNotice('')}>×</button></div>}{error && <div className="app-message error">{error}<button onClick={() => setError('')}>×</button></div>}
      {tab === 'admin' && isAdmin && <AdminPanel deposits={adminDeposits} withdrawals={adminWithdrawals} reviewDeposit={reviewDeposit} reviewWithdrawal={reviewWithdrawal} refresh={refreshAdmin} proofUrl={proofUrl} adminMessage={adminMessage} setAdminMessage={setAdminMessage} />}
      {tab === 'home' && <section className="page-content"><div className="welcome-line"><div><p className="eyebrow">PRIVATE MEMBER SPACE</p><h1>Good to see you, <span>{userName.split(' ')[0]}.</span></h1><p className="muted">Your balance, products and daily claims in one place.</p></div><div className="date-pill"><i /> Live account</div></div><div className="hero-card"><div className="hero-card-copy"><p className="eyebrow">NOVAPOOL</p><h2>Build your balance.<br /><span>Claim with clarity.</span></h2><p>Deposit, purchase a product and manage your available daily rewards from one wallet.</p><button className="light-btn" onClick={() => setTab('product')}>Explore products ↗</button></div><div className="hero-product"><Art /></div></div><div className="section-heading"><div><p className="eyebrow">COLLECTION</p><h2>Available products</h2></div></div><div className="product-grid">{products.map((p, i) => <ProductCard key={p.id} item={p} onClick={() => { setChosenProduct(i); setTab('product'); }} />)}</div></section>}
      {tab === 'product' && <section className="page-content"><div className="page-title-row"><div><p className="eyebrow">THE COLLECTION</p><h1>Objects of <span>quiet luxury.</span></h1><p className="muted">Choose a product and buy it directly from your verified wallet balance.</p></div></div><div className="collection-feature"><div className="feature-art"><Art tone={product.tone} /></div><div className="feature-copy"><span className="product-tag">{product.tag}</span><p className="eyebrow">{product.category}</p><h2>{product.name}</h2><p>{product.description}</p><div className="price-line"><span>Price</span><strong>{money(product.price)}</strong></div><button className="primary-btn" disabled={busy || balance < product.price} onClick={buyProduct}>{balance < product.price ? 'Insufficient balance' : busy ? 'Processing…' : `Buy ${product.name}`} <span>→</span></button><p className="fine-print">Purchase is processed by Supabase and the balance is deducted atomically.</p></div></div><div className="section-heading"><div><p className="eyebrow">ALL PRODUCTS</p><h2>Choose your next piece</h2></div></div><div className="product-grid three">{products.map((p, i) => <ProductCard key={p.id} item={p} onClick={() => setChosenProduct(i)} />)}</div></section>}
      {tab === 'wallet' && <Wallet balance={balance} wallet={wallet} deposits={deposits} withdrawals={withdrawals} rewards={rewards} claimable={claimable} walletSection={walletSection} setWalletSection={setWalletSection} depositNetwork={depositNetwork} setDepositNetwork={setDepositNetwork} depositAmount={depositAmount} setDepositAmount={setDepositAmount} txHash={txHash} setTxHash={setTxHash} proof={proof} setProof={setProof} submitDeposit={submitDeposit} withdrawNetwork={withdrawNetwork} setWithdrawNetwork={setWithdrawNetwork} withdrawAddress={withdrawAddress} setWithdrawAddress={setWithdrawAddress} withdrawAmount={withdrawAmount} setWithdrawAmount={setWithdrawAmount} submitWithdrawal={submitWithdrawal} claimRewards={claimRewards} busy={busy} />}
      {tab === 'profile' && <section className="page-content profile-page"><div className="page-title-row"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Personal <span>space.</span></h1></div></div><div className="profile-card"><div className="profile-top"><div className="profile-avatar">{userName.slice(0, 1).toUpperCase()}</div><div><h2>{userName}</h2><p>{session.user.email}</p><span className="verified-pill">◇ Authenticated</span></div></div><div className="profile-detail"><span>Available balance</span><strong>{money(balance)}</strong></div><div className="profile-detail"><span>Total deposited</span><strong>{money(wallet?.total_deposited)}</strong></div><div className="profile-detail"><span>Total spent</span><strong>{money(wallet?.total_spent)}</strong></div><div className="profile-detail"><span>Total rewards claimed</span><strong>{money(wallet?.total_rewards_claimed)}</strong></div><div className="profile-detail"><span>Purchases</span><strong>{purchases.length}</strong></div><div className="profile-detail"><span>Pending deposits</span><strong>{deposits.filter(d => d.status === 'pending').length}</strong></div><button className="signout-btn" onClick={signOut}>↗ Sign out</button></div><div className="wallet-panel"><h3>Purchase history</h3>{purchases.length ? purchases.map(p => <div className="profile-detail" key={p.id}><span>{p.product_name}<small>{dateText(p.created_at)}</small></span><strong>{money(p.amount)}</strong></div>) : <p className="muted">No purchases yet.</p>}<h3 style={{ marginTop: 24 }}>Daily claim history</h3>{ledger.filter(x => x.kind === 'reward_claim').slice(0, 10).map(x => <div className="profile-detail" key={x.id}><span>Daily reward<small>{dateText(x.created_at)}</small></span><strong>+{money(x.amount)}</strong></div>)}</div></section>}
      <nav className="bottom-nav">{nav.map(n => <button key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => setTab(n.id)}><span>{n.icon}</span>{n.label}{n.id === 'admin' && (adminDeposits.length + adminWithdrawals.length > 0) && <b className="nav-badge">{adminDeposits.length + adminWithdrawals.length}</b>}</button>)}</nav>
    </div></main>;
}

function ProductCard({ item, onClick }) { return <button className="product-card" onClick={onClick}><div className="product-card-art"><Art tone={item.tone} /><span className="product-tag">{item.tag}</span></div><div className="product-card-copy"><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{item.description}</p><div className="card-price"><span>Price</span><strong>{money(item.price)}</strong></div><div className="card-buy">Buy now →</div></div></button>; }

function Wallet(p) { return <section className="page-content"><div className="page-title-row"><div><p className="eyebrow">YOUR WALLET</p><h1>Balance <span>control.</span></h1><p className="muted">Deposit with proof, buy products and claim verified daily rewards.</p></div></div><div className="wallet-panel"><div className="wallet-balance"><div><p className="eyebrow">AVAILABLE BALANCE</p><strong>{money(p.balance)}</strong><small>Verified wallet balance</small></div><span className="wallet-symbol">＄</span></div><div className="wallet-tabs"><button className={p.walletSection === 'deposit' ? 'active' : ''} onClick={() => p.setWalletSection('deposit')}>Deposit</button><button className={p.walletSection === 'claim' ? 'active' : ''} onClick={() => p.setWalletSection('claim')}>Daily claim</button><button className={p.walletSection === 'withdraw' ? 'active' : ''} onClick={() => p.setWalletSection('withdraw')}>Payout</button></div>{p.walletSection === 'deposit' && <div className="wallet-form"><h3>Deposit & payment proof</h3><p className="muted">Send the amount to the selected network address, then upload your screenshot. Admin verification is required before credit.</p><label>Amount (USD)<input type="number" min="5" step="0.01" value={p.depositAmount} onChange={e => p.setDepositAmount(e.target.value)} /></label><label>Network<select value={p.depositNetwork} onChange={e => p.setDepositNetwork(e.target.value)}>{networks.map(n => <option key={n}>{n}</option>)}</select></label><div className="address-box"><span>{addresses[p.depositNetwork]}</span><button type="button" onClick={() => navigator.clipboard?.writeText(addresses[p.depositNetwork])}>Copy</button></div><label>Transaction hash (optional)<input value={p.txHash} onChange={e => p.setTxHash(e.target.value)} placeholder="Paste transaction hash" /></label><label>Payment screenshot<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => p.setProof(e.target.files?.[0] || null)} /></label>{p.proof && <p className="fine-print">Selected: {p.proof.name} · will be removed from storage after admin review.</p>}<button className="primary-btn" disabled={p.busy} onClick={p.submitDeposit}>{p.busy ? 'Submitting…' : 'Submit deposit for review'} <span>→</span></button><p className="fine-print">Never send funds until you have independently verified the destination address and network.</p></div>}{p.walletSection === 'claim' && <div className="wallet-form"><h3>Daily claim</h3><p className="muted">Your purchase creates a 30-day claim schedule. Only rewards whose date has arrived can be claimed.</p><div className="claim-math"><div><span>Available today</span><strong>{money(p.claimable.reduce((a, r) => a + Number(r.amount), 0))}</strong></div><div><span>Scheduled rewards</span><strong>{p.rewards.length}</strong></div></div><button className="primary-btn" disabled={p.busy || !p.claimable.length} onClick={p.claimRewards}>{p.busy ? 'Claiming…' : p.claimable.length ? 'Claim today’s money' : 'Nothing available today'} <span>→</span></button><div className="history-list">{p.rewards.slice(0, 12).map(r => <div className="profile-detail" key={r.id}><span>{r.available_on}<small>{r.claimed_at ? 'Claimed' : 'Scheduled'}</small></span><strong>{money(r.amount)}</strong></div>)}</div></div>}{p.walletSection === 'withdraw' && <div className="wallet-form"><h3>Request payout</h3><p className="muted">Payout requests are sent to admin. Approval means the request is authorized; the actual crypto transfer is completed separately by the operator.</p><label>Network<select value={p.withdrawNetwork} onChange={e => p.setWithdrawNetwork(e.target.value)}>{networks.map(n => <option key={n}>{n}</option>)}</select></label><label>Destination address<input value={p.withdrawAddress} onChange={e => p.setWithdrawAddress(e.target.value)} placeholder="Recipient wallet address" /></label><label>Amount (USD)<input type="number" min="10" step="0.01" value={p.withdrawAmount} onChange={e => p.setWithdrawAmount(e.target.value)} /></label><button className="primary-btn" disabled={p.busy} onClick={p.submitWithdrawal}>{p.busy ? 'Sending…' : 'Request payout'} <span>→</span></button><div className="history-list">{p.withdrawals.map(w => <div className="profile-detail" key={w.id}><span>{w.network}<small>{w.admin_message || dateText(w.created_at)}</small></span><strong>{money(w.amount)} · {w.status}</strong></div>)}</div></div>}</div></section>; }

function AdminPanel({ deposits, withdrawals, reviewDeposit, reviewWithdrawal, refresh, proofUrl, adminMessage, setAdminMessage }) { const [proofs, setProofs] = useState({}); const [open, setOpen] = useState('deposits'); const loadProof = async row => { if (proofs[row.id]) return; try { const url = await proofUrl(row.screenshot_path); setProofs(x => ({ ...x, [row.id]: url })); } catch {} }; return <section className="page-content"><div className="page-title-row"><div><p className="eyebrow">PRIVATE ADMIN CONSOLE</p><h1>Manage <span>NovaPool.</span></h1><p className="muted">Review deposits, approve payouts, monitor activity and keep the wallet ledger controlled.</p></div><button className="text-link" onClick={refresh}>Refresh ↻</button></div><div className="admin-grid"><div className="admin-stat"><span>Pending deposits</span><strong>{deposits.length}</strong></div><div className="admin-stat"><span>Pending payouts</span><strong>{withdrawals.length}</strong></div><div className="admin-stat"><span>Action queue</span><strong>{deposits.length + withdrawals.length}</strong></div></div><div className="wallet-panel"><div className="wallet-tabs"><button className={open === 'deposits' ? 'active' : ''} onClick={() => setOpen('deposits')}>Deposits ({deposits.length})</button><button className={open === 'withdrawals' ? 'active' : ''} onClick={() => setOpen('withdrawals')}>Payouts ({withdrawals.length})</button></div>{open === 'deposits' && <div className="admin-list">{deposits.length ? deposits.map(row => <article className="admin-item" key={row.id}><div className="admin-item-head"><div><strong>{money(row.amount)} · {row.network}</strong><small>{dateText(row.created_at)}</small></div><span className="pending-pill">PENDING</span></div><p>TX: {row.tx_hash || 'Not supplied'}</p><p>User: {row.user_id}</p>{row.screenshot_path && <div><button className="text-link" onClick={() => loadProof(row)}>View payment screenshot</button>{proofs[row.id] && <img src={proofs[row.id]} alt="Deposit proof" style={{ display: 'block', width: '100%', maxWidth: 520, maxHeight: 420, objectFit: 'contain', marginTop: 12, borderRadius: 16 }} />}</div>}<div className="admin-actions"><button className="primary-btn" onClick={() => reviewDeposit(row, true)}>Approve & credit</button><button className="signout-btn" onClick={() => reviewDeposit(row, false)}>Reject</button></div></article>) : <p className="muted">No pending deposits.</p>}</div>}{open === 'withdrawals' && <div className="admin-list"><label>Message shown to approved user<textarea value={adminMessage} onChange={e => setAdminMessage(e.target.value)} rows={3} /></label>{withdrawals.length ? withdrawals.map(row => <article className="admin-item" key={row.id}><div className="admin-item-head"><div><strong>{money(row.amount)} · {row.network}</strong><small>{dateText(row.created_at)}</small></div><span className="pending-pill">PENDING</span></div><p>Destination: {row.destination_address}</p><p>User: {row.user_id}</p><div className="admin-actions"><button className="primary-btn" onClick={() => reviewWithdrawal(row, true)}>Approve payout</button><button className="signout-btn" onClick={() => reviewWithdrawal(row, false)}>Reject & refund</button></div></article>) : <p className="muted">No pending payouts.</p>}</div>}</div><div className="note-banner"><span className="note-icon">◆</span><div><strong>Admin safety</strong><p>Approval does not falsely claim that a blockchain transfer happened. Verify the transaction externally before crediting a deposit, and complete approved payouts separately.</p></div></div></section>; }

createRoot(document.getElementById('root')).render(<App />);
