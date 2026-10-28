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
const addresses = {
  'TRON (TRC20)': 'TDHUCQ6Zp3bA5xkpYMDGStXNrbXxgAswrz',
  'BNB Smart Chain (BEP20)': '0xdb479140187481b5c68ea627cec7d989b2b75aa9',
  Plasma: '0xdb479140187481b5c68ea627cec7d989b2b75aa9',
  opBNB: '0xdb479140187481b5c68ea627cec7d989b2b75aa9',
};
const money = value => `$${Number(value || 0).toFixed(2)}`;
const dateText = value => value ? new Date(value).toLocaleString() : '—';

function Art({ tone = 'gold' }) {
  return (
    <div className={`product-art art-${tone}`}>
      <div className="art-glow" />
      <div className="art-ring"><div className="ring-inner" /></div>
      <div className="art-pedestal"><div className="pedestal-top" /></div>
      <div className="art-reflection" />
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
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
  const [adminApproved, setAdminApproved] = useState([]);
  const [productIndex, setProductIndex] = useState(0);
  const [walletSection, setWalletSection] = useState('deposit');
  const [depositNetwork, setDepositNetwork] = useState(networks[0]);
  const [depositAmount, setDepositAmount] = useState('5');
  const [txHash, setTxHash] = useState('');
  const [proof, setProof] = useState(null);
  const [withdrawNetwork, setWithdrawNetwork] = useState(networks[0]);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('10');
  const [adminMessage, setAdminMessage] = useState('Please wait up to 72 hours to receive your money.');
  const [paidPayout, setPaidPayout] = useState(null);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Member';
  const product = products[productIndex];
  const claimable = useMemo(() => rewards.filter(r => !r.claimed_at && r.available_on <= new Date().toISOString().slice(0, 10)), [rewards]);
  const dailyClaimCount = ledger.filter(x => x.kind === 'reward_claim').length;
  const maxClaimed = ledger.filter(x => x.kind === 'reward_claim').reduce((max, x) => Math.max(max, Number(x.amount || 0)), 0);
  const payoutTotal = withdrawals.filter(x => x.status === 'approved' || x.status === 'paid').reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const unclaimedMoney = rewards.filter(r => !r.claimed_at).reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const detectPaid = (rows, uid) => {
    const fresh = rows
      .filter(row => row.status === 'paid' && row.paid_at)
      .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
      .find(row => !localStorage.getItem(`novapool:payout-seen:${uid}:${row.id}`));
    if (fresh) setPaidPayout(fresh);
  };

  const refreshAdmin = async () => {
    const [depositsResult, pendingResult, approvedResult] = await Promise.all([
      supabase.from('np_deposit_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('np_withdrawal_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('np_withdrawal_requests').select('*').eq('status', 'approved').order('reviewed_at', { ascending: true }),
    ]);
    setAdminDeposits(depositsResult.data || []);
    setAdminWithdrawals(pendingResult.data || []);
    setAdminApproved(approvedResult.data || []);
  };

  const refreshAccount = async (currentSession = session) => {
    if (!currentSession?.user) return;
    const uid = currentSession.user.id;
    const [walletResult, purchaseResult, rewardResult, ledgerResult, depositResult, withdrawalResult, adminResult] = await Promise.all([
      supabase.from('np_wallets').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('np_purchases').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('np_rewards').select('*').eq('user_id', uid).order('available_on', { ascending: true }),
      supabase.from('np_ledger').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100),
      supabase.from('np_deposit_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('np_withdrawal_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('np_admin_users').select('user_id').eq('user_id', uid).maybeSingle(),
    ]);
    const rows = withdrawalResult.data || [];
    setWallet(walletResult.data || null);
    setBalance(Number(walletResult.data?.balance || 0));
    setPurchases(purchaseResult.data || []);
    setRewards(rewardResult.data || []);
    setLedger(ledgerResult.data || []);
    setDeposits(depositResult.data || []);
    setWithdrawals(rows);
    setIsAdmin(Boolean(adminResult.data));
    detectPaid(rows, uid);
    if (adminResult.data) await refreshAdmin();
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await refreshAccount(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) await refreshAccount(nextSession);
      else {
        setIsAdmin(false);
        setPaidPayout(null);
        setTab('home');
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    const timer = setInterval(() => refreshAccount(session), 3000);
    return () => clearInterval(timer);
  }, [session]);

  const authSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'signup') {
        if (!agreed) throw new Error('Please agree to the Terms and Privacy Policy.');
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
        });
        if (authError) throw authError;
        setNotice(data.session ? 'Account created.' : 'Account created. Check your email if confirmation is enabled.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const submitDeposit = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const amount = Number(depositAmount);
      if (amount < 5) throw new Error('Minimum deposit is $5.');
      if (!proof) throw new Error('Upload your payment screenshot.');
      const ext = proof.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage.from('np-deposit-proofs').upload(path, proof, { contentType: proof.type, upsert: false });
      if (upload.error) throw upload.error;
      const { error: rpcError } = await supabase.rpc('np_submit_deposit', {
        p_amount: amount, p_network: depositNetwork, p_screenshot_path: path, p_tx_hash: txHash.trim() || null,
      });
      if (rpcError) {
        await supabase.storage.from('np-deposit-proofs').remove([path]);
        throw rpcError;
      }
      setProof(null); setTxHash(''); setNotice('Deposit submitted for admin review.'); await refreshAccount();
    } catch (err) { setError(err.message || 'Deposit submission failed.'); }
    finally { setBusy(false); }
  };

  const buyProduct = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const { data, error: buyError } = await supabase.rpc('np_buy_product', { p_product_id: product.id, p_product_name: product.name, p_amount: product.price });
      if (buyError) throw buyError;
      const { error: rewardError } = await supabase.rpc('np_create_rewards_for_purchase', { p_purchase_id: data, p_amount: product.price });
      if (rewardError) throw rewardError;
      setNotice(`${product.name} purchased. Your daily claim schedule is now active.`); await refreshAccount();
    } catch (err) { setError(err.message || 'Purchase failed.'); }
    finally { setBusy(false); }
  };

  const claimRewards = async () => {
    setBusy(true); setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('np_claim_daily_reward');
      if (rpcError) throw rpcError;
      setNotice(`${money(data)} claimed and added to your balance.`); await refreshAccount();
    } catch (err) { setError(err.message || 'No reward is available today.'); }
    finally { setBusy(false); }
  };

  const submitWithdrawal = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: rpcError } = await supabase.rpc('np_submit_withdrawal', {
        p_network: withdrawNetwork, p_destination_address: withdrawAddress.trim(), p_amount: Number(withdrawAmount),
      });
      if (rpcError) throw rpcError;
      setWithdrawAddress(''); setNotice('Payout request sent to admin for review.'); await refreshAccount();
    } catch (err) { setError(err.message || 'Payout request failed.'); }
    finally { setBusy(false); }
  };

  const reviewDeposit = async (row, approve) => {
    setBusy(true); setError('');
    try {
      const { error: rpcError } = await supabase.rpc('np_admin_review_deposit', {
        p_request_id: row.id,
        p_approve: approve,
        p_note: approve ? 'Deposit verified and credited to your NovaPool balance.' : 'Deposit could not be verified.',
      });
      if (rpcError) throw rpcError;
      if (row.screenshot_path) await supabase.storage.from('np-deposit-proofs').remove([row.screenshot_path]);
      await refreshAdmin(); setNotice(approve ? 'Deposit approved and credited.' : 'Deposit rejected.');
    } catch (err) { setError(err.message || 'Review failed.'); }
    finally { setBusy(false); }
  };

  const reviewWithdrawal = async (row, approve) => {
    setBusy(true); setError('');
    try {
      const message = adminMessage.trim() || (approve ? 'Please wait up to 72 hours to receive your money.' : 'Your payout request was rejected and the amount was returned to your balance.');
      const { error: rpcError } = await supabase.rpc('np_admin_review_withdrawal', { p_request_id: row.id, p_approve: approve, p_message: message });
      if (rpcError) throw rpcError;
      await refreshAdmin(); setNotice(approve ? 'Payout approved. Send the crypto externally, then click Money Delivered.' : 'Payout rejected and refunded.');
    } catch (err) { setError(err.message || 'Review failed.'); }
    finally { setBusy(false); }
  };

  const markWithdrawalPaid = async row => {
    setBusy(true); setError('');
    try {
      const { error: rpcError } = await supabase.rpc('np_admin_mark_withdrawal_paid', { p_request_id: row.id, p_message: 'Payout successful. Your money has been sent and received.' });
      if (rpcError) throw rpcError;
      await refreshAdmin(); setNotice('Money Delivered. The user will receive the payout success screen.');
    } catch (err) { setError(err.message || 'Could not mark payout as delivered.'); }
    finally { setBusy(false); }
  };

  if (!session) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <div className="brand-lockup"><span className="brand-mark">N</span><span>NovaPool<small>THE DIGITAL ATELIER</small></span></div>
          <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'CREATE YOUR SPACE'}</p>
          <h1>{mode === 'login' ? 'Sign in to your pool.' : 'Start your NovaPool account.'}</h1>
          {error && <div className="app-message error">{error}</div>}
          {notice && <div className="app-message">{notice}</div>}
          <form onSubmit={authSubmit}>
            {mode === 'signup' && <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} required /></label>}
            <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required /></label>
            {mode === 'signup' && <label className="check-row"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /> I agree to the Terms and Privacy Policy.</label>}
            <button className="primary-btn" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button>
          </form>
          <button className="text-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}</button>
        </div>
      </main>
    );
  }

  const nav = isAdmin
    ? [{ id: 'admin', label: 'Admin', icon: '◆' }, { id: 'home', label: 'Home', icon: '⌂' }, { id: 'product', label: 'Products', icon: '◇' }, { id: 'wallet', label: 'Wallet', icon: '▣' }, { id: 'profile', label: 'Profile', icon: '◉' }]
    : [{ id: 'home', label: 'Home', icon: '⌂' }, { id: 'product', label: 'Products', icon: '◇' }, { id: 'wallet', label: 'Wallet', icon: '▣' }, { id: 'profile', label: 'Profile', icon: '◉' }];

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="app-header">
        <button className="wordmark" onClick={() => setTab(isAdmin ? 'admin' : 'home')}><span className="brand-mark">N</span><span>NovaPool<small>THE DIGITAL ATELIER</small></span></button>
        <div className="header-right"><div className="header-balance"><small>BALANCE</small><strong>{money(balance)}</strong></div><button className="avatar-button" onClick={() => setTab('profile')}>{userName.slice(0, 1).toUpperCase()}</button></div>
      </header>

      <div className="app-content">
        {notice && <div className="app-message">{notice}<button onClick={() => setNotice('')}>×</button></div>}
        {error && <div className="app-message error">{error}<button onClick={() => setError('')}>×</button></div>}

        {tab === 'admin' && isAdmin && <AdminPanel deposits={adminDeposits} withdrawals={adminWithdrawals} approved={adminApproved} message={adminMessage} setMessage={setAdminMessage} reviewDeposit={reviewDeposit} reviewWithdrawal={reviewWithdrawal} markPaid={markWithdrawalPaid} refresh={refreshAdmin} busy={busy} />}
        {tab === 'home' && <Home userName={userName} balance={balance} setTab={setTab} setProductIndex={setProductIndex} />}
        {tab === 'product' && <Products product={product} balance={balance} busy={busy} setProductIndex={setProductIndex} buyProduct={buyProduct} />}
        {tab === 'wallet' && <Wallet balance={balance} wallet={wallet} deposits={deposits} withdrawals={withdrawals} rewards={rewards} claimable={claimable} walletSection={walletSection} setWalletSection={setWalletSection} depositNetwork={depositNetwork} setDepositNetwork={setDepositNetwork} depositAmount={depositAmount} setDepositAmount={setDepositAmount} txHash={txHash} setTxHash={setTxHash} proof={proof} setProof={setProof} submitDeposit={submitDeposit} withdrawNetwork={withdrawNetwork} setWithdrawNetwork={setWithdrawNetwork} withdrawAddress={withdrawAddress} setWithdrawAddress={setWithdrawAddress} withdrawAmount={withdrawAmount} setWithdrawAmount={setWithdrawAmount} submitWithdrawal={submitWithdrawal} claimRewards={claimRewards} busy={busy} />}
        {tab === 'profile' && <Profile userName={userName} email={session.user.email} balance={balance} wallet={wallet} purchases={purchases} withdrawals={withdrawals} unclaimedMoney={unclaimedMoney} dailyClaimCount={dailyClaimCount} maxClaimed={maxClaimed} payoutTotal={payoutTotal} signOut={() => supabase.auth.signOut()} />}

        <nav className="bottom-nav">
          {nav.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}{item.id === 'admin' && adminDeposits.length + adminWithdrawals.length > 0 && <b className="nav-badge">{adminDeposits.length + adminWithdrawals.length}</b>}</button>)}
        </nav>
      </div>

      {paidPayout && <PayoutSuccess payout={paidPayout} userId={session.user.id} close={() => setPaidPayout(null)} />}
    </main>
  );
}

function Home({ userName, balance, setTab, setProductIndex }) {
  return <section className="page-content">
    <div className="welcome-line"><div><p className="eyebrow">PRIVATE MEMBER SPACE</p><h1>Good to see you, <span>{userName.split(' ')[0]}.</span></h1><p className="muted">Your balance, products and daily claims in one place.</p></div><div className="date-pill"><i /> Live account</div></div>
    <div className="hero-card"><div className="hero-card-copy"><p className="eyebrow">NOVAPOOL</p><h2>Build your balance.<br /><span>Claim with clarity.</span></h2><p>Deposit, purchase a product and manage your available daily rewards from one wallet.</p><button className="light-btn" onClick={() => setTab('product')}>Explore products ↗</button></div><div className="hero-product"><Art /></div></div>
    <div className="section-heading"><div><p className="eyebrow">COLLECTION</p><h2>Available products</h2></div><strong>{money(balance)}</strong></div>
    <div className="product-grid">{products.map((item, index) => <ProductCard key={item.id} item={item} onClick={() => { setProductIndex(index); setTab('product'); }} />)}</div>
  </section>;
}

function Products({ product, balance, busy, setProductIndex, buyProduct }) {
  return <section className="page-content">
    <div className="page-title-row"><div><p className="eyebrow">THE COLLECTION</p><h1>Objects of <span>quiet luxury.</span></h1><p className="muted">Choose a product and buy it directly from your verified wallet balance.</p></div></div>
    <div className="collection-feature"><div className="feature-art"><Art tone={product.tone} /></div><div className="feature-copy"><span className="product-tag">{product.tag}</span><p className="eyebrow">{product.category}</p><h2>{product.name}</h2><p>{product.description}</p><div className="price-line"><span>Price</span><strong>{money(product.price)}</strong></div><button className="primary-btn" disabled={busy || balance < product.price} onClick={buyProduct}>{balance < product.price ? 'Insufficient balance' : busy ? 'Processing…' : `Buy ${product.name}`} <span>→</span></button><p className="fine-print">Each product can only be purchased once per account.</p></div></div>
    <div className="section-heading"><div><p className="eyebrow">ALL PRODUCTS</p><h2>Choose your next piece</h2></div></div>
    <div className="product-grid three">{products.map((item, index) => <ProductCard key={item.id} item={item} onClick={() => setProductIndex(index)} />)}</div>
  </section>;
}

function ProductCard({ item, onClick }) {
  return <button className="product-card" onClick={onClick}><div className="product-card-art"><Art tone={item.tone} /><span className="product-tag">{item.tag}</span></div><div className="product-card-copy"><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{item.description}</p><div className="card-price"><span>Price</span><strong>{money(item.price)}</strong></div><div className="card-buy">Buy now →</div></div></button>;
}

function Wallet(p) {
  return <section className="page-content"><div className="page-title-row"><div><p className="eyebrow">YOUR WALLET</p><h1>Balance <span>control.</span></h1><p className="muted">Deposit with proof, buy products and claim verified daily rewards.</p></div></div>
    <div className="wallet-panel"><div className="wallet-balance"><div><p className="eyebrow">AVAILABLE BALANCE</p><strong>{money(p.balance)}</strong><small>Verified wallet balance</small></div><span className="wallet-symbol">＄</span></div>
      <div className="wallet-tabs"><button className={p.walletSection === 'deposit' ? 'active' : ''} onClick={() => p.setWalletSection('deposit')}>Deposit</button><button className={p.walletSection === 'claim' ? 'active' : ''} onClick={() => p.setWalletSection('claim')}>Daily claim</button><button className={p.walletSection === 'withdraw' ? 'active' : ''} onClick={() => p.setWalletSection('withdraw')}>Payout</button></div>
      {p.walletSection === 'deposit' && <div className="wallet-form"><h3>Deposit & payment proof</h3><p className="muted">Send the amount to the selected network address, then upload your screenshot. Admin verification is required before credit.</p><label>Amount (USD)<input type="number" min="5" step="0.01" value={p.depositAmount} onChange={e => p.setDepositAmount(e.target.value)} /></label><label>Network<select value={p.depositNetwork} onChange={e => p.setDepositNetwork(e.target.value)}>{networks.map(n => <option key={n}>{n}</option>)}</select></label><div className="address-box"><span>{addresses[p.depositNetwork]}</span><button type="button" onClick={() => navigator.clipboard?.writeText(addresses[p.depositNetwork])}>Copy</button></div><label>Transaction hash (optional)<input value={p.txHash} onChange={e => p.setTxHash(e.target.value)} placeholder="Paste transaction hash" /></label><label>Payment screenshot<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => p.setProof(e.target.files?.[0] || null)} /></label>{p.proof && <p className="fine-print">Selected: {p.proof.name}</p>}<button className="primary-btn" disabled={p.busy} onClick={p.submitDeposit}>{p.busy ? 'Submitting…' : 'Submit deposit for review'} <span>→</span></button></div>}
      {p.walletSection === 'claim' && <div className="wallet-form"><h3>Daily claim</h3><p className="muted">Claims are available Monday–Friday only. Your purchase creates a scheduled reward.</p><div className="claim-math"><div><span>Available today</span><strong>{money(p.claimable.reduce((sum, r) => sum + Number(r.amount), 0))}</strong></div><div><span>Scheduled rewards</span><strong>{p.rewards.length}</strong></div></div><button className="primary-btn" disabled={p.busy || !p.claimable.length} onClick={p.claimRewards}>{p.busy ? 'Claiming…' : p.claimable.length ? 'Claim today’s money' : 'Nothing available today'} <span>→</span></button><div className="history-list">{p.rewards.slice(0, 12).map(r => <div className="profile-detail" key={r.id}><span>{r.available_on}<small>{r.claimed_at ? 'Claimed' : 'Scheduled'}</small></span><strong>{money(r.amount)}</strong></div>)}</div></div>}
      {p.walletSection === 'withdraw' && <div className="wallet-form"><h3>Request payout</h3><p className="muted">Approval authorizes the payout. The admin sends crypto externally, then clicks Money Delivered after the transfer is complete.</p><label>Network<select value={p.withdrawNetwork} onChange={e => p.setWithdrawNetwork(e.target.value)}>{networks.map(n => <option key={n}>{n}</option>)}</select></label><label>Destination address<input value={p.withdrawAddress} onChange={e => p.setWithdrawAddress(e.target.value)} placeholder="Recipient wallet address" /></label><label>Amount (USD)<input type="number" min="10" step="0.01" value={p.withdrawAmount} onChange={e => p.setWithdrawAmount(e.target.value)} /></label><button className="primary-btn" disabled={p.busy} onClick={p.submitWithdrawal}>{p.busy ? 'Sending…' : 'Request payout'} <span>→</span></button><div className="history-list">{p.withdrawals.map(row => <div className="profile-detail" key={row.id}><span>{row.network}<small>{row.admin_message || dateText(row.created_at)}</small></span><strong>{money(row.amount)} · {row.status}</strong></div>)}</div></div>}
    </div>
  </section>;
}

function Profile(p) {
  return <section className="page-content profile-page"><div className="page-title-row"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Personal <span>space.</span></h1></div></div><div className="profile-card"><div className="profile-top"><div className="profile-avatar">{p.userName.slice(0, 1).toUpperCase()}</div><div><h2>{p.userName}</h2><p>{p.email}</p><span className="verified-pill">◇ Authenticated</span></div></div><div className="profile-stats"><Stat label="Total balance" value={money(p.balance)} /><Stat label="Deposited" value={money(p.wallet?.total_deposited)} /><Stat label="Payout" value={money(p.payoutTotal)} /><Stat label="Claimed" value={money(p.wallet?.total_rewards_claimed)} /><Stat label="Unclaimed" value={money(p.unclaimedMoney)} /><Stat label="Daily claimed" value={p.dailyClaimCount} /><Stat label="Max claimed" value={money(p.maxClaimed)} /><Stat label="Products" value={p.purchases.length} /></div><button className="signout-btn" onClick={p.signOut}>↗ Sign out</button></div><div className="wallet-panel"><h3>Purchase history</h3>{p.purchases.length ? p.purchases.map(row => <div className="profile-detail" key={row.id}><span>{row.product_name}<small>{dateText(row.created_at)}</small></span><strong>{money(row.amount)}</strong></div>) : <p className="muted">No purchases yet.</p>}<h3 style={{ marginTop: 24 }}>Payout history</h3>{p.withdrawals.length ? p.withdrawals.map(row => <div className="profile-detail" key={row.id}><span>{row.network}<small>{row.admin_message || dateText(row.created_at)}</small></span><strong>{money(row.amount)} · {row.status}</strong></div>) : <p className="muted">No payouts yet.</p>}</div></section>;
}

function Stat({ label, value }) { return <div className="stat-box"><span>{label}</span><strong>{value}</strong></div>; }

function AdminPanel(p) {
  const [section, setSection] = useState('deposits');
  return <section className="page-content"><div className="page-title-row"><div><p className="eyebrow">PRIVATE ADMIN CONSOLE</p><h1>Manage <span>NovaPool.</span></h1><p className="muted">Approve payouts first. Send crypto externally. Then click Money Delivered only after the transfer is complete.</p></div><button className="text-link" onClick={p.refresh}>Refresh ↻</button></div><div className="admin-grid"><div className="admin-stat"><span>Pending deposits</span><strong>{p.deposits.length}</strong></div><div className="admin-stat"><span>Pending payouts</span><strong>{p.withdrawals.length}</strong></div><div className="admin-stat"><span>Approved payouts</span><strong>{p.approved.length}</strong></div></div><div className="wallet-panel"><div className="wallet-tabs"><button className={section === 'deposits' ? 'active' : ''} onClick={() => setSection('deposits')}>Deposits ({p.deposits.length})</button><button className={section === 'payouts' ? 'active' : ''} onClick={() => setSection('payouts')}>Payouts ({p.withdrawals.length + p.approved.length})</button></div>{section === 'deposits' && <div className="admin-list">{p.deposits.length ? p.deposits.map(row => <article className="admin-item" key={row.id}><div className="admin-item-head"><div><strong>{money(row.amount)} · {row.network}</strong><small>{dateText(row.created_at)}</small></div><span className="pending-pill">PENDING</span></div><p>TX: {row.tx_hash || 'Not supplied'}</p><p>User: {row.user_id}</p><div className="admin-actions"><button className="primary-btn" disabled={p.busy} onClick={() => p.reviewDeposit(row, true)}>Approve & credit</button><button className="signout-btn" disabled={p.busy} onClick={() => p.reviewDeposit(row, false)}>Reject</button></div></article>) : <p className="muted">No pending deposits.</p>}</div>}{section === 'payouts' && <div className="admin-list"><label>Message shown to approved user<textarea value={p.message} onChange={e => p.setMessage(e.target.value)} rows={3} /></label>{p.withdrawals.length ? p.withdrawals.map(row => <article className="admin-item" key={row.id}><div className="admin-item-head"><div><strong>{money(row.amount)} · {row.network}</strong><small>{dateText(row.created_at)}</small></div><span className="pending-pill">PENDING</span></div><p>Destination: {row.destination_address}</p><p>User: {row.user_id}</p><div className="admin-actions"><button className="primary-btn" disabled={p.busy} onClick={() => p.reviewWithdrawal(row, true)}>Approve payout</button><button className="signout-btn" disabled={p.busy} onClick={() => p.reviewWithdrawal(row, false)}>Reject & refund</button></div></article>) : <p className="muted">No pending payouts.</p>}{p.approved.length > 0 && <><h3 style={{ marginTop: 26 }}>Approved — send externally</h3>{p.approved.map(row => <article className="admin-item" key={row.id}><div className="admin-item-head"><div><strong>{money(row.amount)} · {row.network}</strong><small>Approved {dateText(row.reviewed_at)}</small></div><span className="pending-pill">APPROVED</span></div><p>Destination: {row.destination_address}</p><p>User: {row.user_id}</p><p className="muted">Send the crypto externally, then click Money Delivered. This is the only action that tells the user their payout was delivered.</p><div className="admin-actions"><button className="primary-btn" disabled={p.busy} onClick={() => p.markPaid(row)}>Money Delivered</button></div></article>)}</>}</div>}</div><div className="note-banner"><span className="note-icon">◆</span><div><strong>Admin safety</strong><p>Never click Money Delivered before the external transfer is actually complete.</p></div></div></section>;
}

function PayoutSuccess({ payout, userId, close }) {
  const dismiss = () => { localStorage.setItem(`novapool:payout-seen:${userId}:${payout.id}`, '1'); close(); };
  return <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'radial-gradient(circle at 50% 25%,rgba(212,175,55,.22),#050505 65%)', display: 'grid', placeItems: 'center', padding: 20, overflow: 'auto' }}><div style={{ width: 'min(720px,100%)', position: 'relative', textAlign: 'center', padding: '48px 24px 36px', borderRadius: 30, border: '1px solid rgba(212,175,55,.5)', background: '#090909', color: '#fff' }}><button aria-label="Close" onClick={dismiss} style={{ position: 'absolute', right: 14, top: 14, width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontSize: 28 }}>×</button><div style={{ fontSize: 78 }}>🎉</div><p className="eyebrow" style={{ color: '#d4af37' }}>PAYOUT SUCCESS</p><h1 style={{ fontSize: 'clamp(32px,7vw,60px)', lineHeight: 1.02 }}>YOUR MONEY HAS BEEN RECEIVED</h1><p style={{ opacity: .72 }}>Your payout was successfully delivered by the NovaPool admin.</p><div style={{ color: '#d4af37', fontSize: 'clamp(42px,9vw,70px)', fontWeight: 800, margin: '22px 0 8px' }}>{money(payout.amount)}</div><p style={{ opacity: .58 }}>{payout.network} · {dateText(payout.paid_at)}</p><button className="primary-btn" onClick={dismiss}>Back to dashboard →</button></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);
