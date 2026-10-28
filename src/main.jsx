import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import './styles.css';

function App() {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);

  const isLogin = mode === 'login';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (!isLogin) {
        if (!agreed) throw new Error('Please agree to the Terms and Privacy Policy.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setMessage('Account created successfully. Welcome to NovaPool.');
        } else {
          setMessage('Account created. If email confirmation is enabled, check your email before signing in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        setMessage('Signed in successfully.');
      }
    } catch (authError) {
      setError(authError?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setMessage('');
    setError('');

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMessage('You have been signed out.');
  }

  const products = [
    { id: 'halo', name: 'Aurum Halo', category: 'SIGNATURE SERIES', description: 'A sculptural gold halo with a refined, gallery-inspired finish.', price: 5, tone: 'gold', tag: 'FEATURED' },
    { id: 'arc', name: 'Obsidian Arc', category: 'OBSIDIAN SERIES', description: 'A dark mineral silhouette with a subtle metallic edge.', price: 10, tone: 'silver', tag: 'LIMITED' },
    { id: 'orb', name: 'Solstice Orb', category: 'ATELIER SERIES', description: 'Warm ambient light and a minimal architectural form.', price: 15, tone: 'bronze', tag: 'ATELIER' }
  ];
  const [tab, setTab] = useState('home');
  const [chosenProduct, setChosenProduct] = useState(0);
  const [demoNotice, setDemoNotice] = useState('');
  const [walletSection, setWalletSection] = useState('deposit');
  const [depositNetwork, setDepositNetwork] = useState('TRON (TRC20)');
  const [withdrawNetwork, setWithdrawNetwork] = useState('TRON (TRC20)');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('10');
  const [walletBalance] = useState(0);
  const [claimDays, setClaimDays] = useState(30);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Member';
  const nav = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'product', label: 'Product', icon: '◇' },
    { id: 'other', label: 'Other', icon: '▦' },
    { id: 'profile', label: 'Profile', icon: '◉' }
  ];
  const product = products[chosenProduct];
  const demoAction = (label) => setDemoNotice(label + '.');
  const depositAddresses = { 'TRON (TRC20)': 'TDHUCQ6Zp3bA5xkpYMDGStXNrbXxgAswrz', 'BNB Smart Chain (BEP20)': '0xdb479140187481b5c68ea627cec7d989b2b75aa9', 'Plasma': '0xdb479140187481b5c68ea627cec7d989b2b75aa9', 'opBNB': '0xdb479140187481b5c68ea627cec7d989b2b75aa9' };
  const art = (tone = 'gold') => <div className={'product-art art-' + tone}><div className="art-glow" /><div className="art-ring"><div className="ring-inner" /></div><div className="art-pedestal"><div className="pedestal-top" /></div><div className="art-reflection" /></div>;
  const productCard = (item, index) => <button className="product-card" key={item.id} onClick={() => { setChosenProduct(index); setTab('product'); }}><div className="product-card-art">{art(item.tone)}<span className="product-tag">{item.tag}</span></div><div className="product-card-copy"><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{item.description}</p><div className="card-price"><span>Price</span><strong>{'$' + item.price.toFixed(2)}</strong></div></div></button>;

  if (session) {
    return (
      <main className="app-shell">
        <div className="ambient ambient-one" /><div className="ambient ambient-two" />
        <header className="app-header">
          <button className="wordmark" onClick={() => setTab('home')}><span className="brand-mark">N</span><span>NovaPool<small>THE DIGITAL ATELIER</small></span></button>
          <div className="header-right"><span className="sandbox-chip"><i /> Preview environment</span><button className="avatar-button" onClick={() => setTab('profile')}>{userName.slice(0,1).toUpperCase()}</button></div>
        </header>
        <div className="app-content">
          {demoNotice && <div className="app-message">{demoNotice}<button onClick={() => setDemoNotice('')}>×</button></div>}
          {tab === 'home' && <section className="page-content">
            <div className="welcome-line"><div><p className="eyebrow">YOUR PRIVATE SPACE</p><h1>Good to see you, <span>{userName.split(' ')[0]}.</span></h1><p className="muted">A clearer view of your NovaPool experience.</p></div><div className="date-pill"><i /> Account connected</div></div>
            <div className="hero-card"><div className="hero-card-copy"><p className="eyebrow">WELCOME TO THE ATELIER</p><h2>Designed to feel<br /><span>different.</span></h2><p>Discover sculptural forms, warm metallic finishes, and thoughtful digital experiences.</p><button className="light-btn" onClick={() => setTab('product')}>Explore collection <span>↗</span></button></div><div className="hero-product">{art()}</div><div className="hero-card-orbit" /></div>
            <div className="section-heading"><div><p className="eyebrow">DISCOVER</p><h2>Made to stand apart</h2></div><button className="text-link" onClick={() => setTab('product')}>View all ↗</button></div>
            <div className="product-grid">{products.slice(0,2).map((item,index) => productCard(item,index))}</div>
            <div className="note-banner"><span className="note-icon">✧</span><div><strong>Built for clarity</strong><p>Product prices are displayed for preview. No real purchase is processed from this page.</p></div></div>
          </section>}
          {tab === 'product' && <section className="page-content"><div className="page-title-row"><div><p className="eyebrow">THE COLLECTION</p><h1>Objects of <span>quiet luxury.</span></h1><p className="muted">Sculptural concepts in a warm black-and-gold world.</p></div><span className="collection-count">03 OBJECTS</span></div>
            <div className="collection-feature"><div className="feature-art">{art(product.tone)}</div><div className="feature-copy"><span className="product-tag">{product.tag}</span><p className="eyebrow">{product.category}</p><h2>{product.name}</h2><p>{product.description}</p><div className="price-line"><span>Illustrative price</span><strong>{'$' + product.price.toFixed(2)}</strong></div><button className="primary-btn" onClick={() => demoAction('Viewed ' + product.name)}>View product details <span>↗</span></button><p className="fine-print">Preview catalogue. Checkout is not connected yet.</p></div></div>
            <div className="section-heading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>The full collection</h2></div></div><div className="product-grid three">{products.map((item,index) => productCard(item,index))}</div>
          </section>}
          {tab === 'other' && <section className="page-content"><div className="page-title-row"><div><p className="eyebrow">BEYOND THE ORDINARY</p><h1>Explore <span>more.</span></h1><p className="muted">Helpful tools for your NovaPool experience.</p></div></div>
            <div className="service-grid">
              <button className="service-card" onClick={() => demoAction('Opened wallet overview')}><span className="service-icon">◈</span><span><strong>Wallet overview</strong><small>Preview account and wallet features</small></span><b>↗</b></button>
              <button className="service-card" onClick={() => demoAction('Opened security center')}><span className="service-icon">⬡</span><span><strong>Security center</strong><small>Authentication and account safety</small></span><b>↗</b></button>
              <button className="service-card" onClick={() => demoAction('Opened help center')}><span className="service-icon">?</span><span><strong>Help center</strong><small>Find your way around NovaPool</small></span><b>↗</b></button>
              <button className="service-card" onClick={() => setTab('profile')}><span className="service-icon">◉</span><span><strong>Account settings</strong><small>View your profile and session</small></span><b>↗</b></button>
            </div><div className="wallet-panel">
              <div className="wallet-balance"><div><p className="eyebrow">AVAILABLE BALANCE</p><strong>${walletBalance.toFixed(2)}</strong><small>Preview balance · no real funds connected</small></div><span className="wallet-symbol">＄</span></div>
              <div className="wallet-tabs"><button className={walletSection === "deposit" ? "active" : ""} onClick={() => setWalletSection("deposit")}>Deposit</button><button className={walletSection === "withdraw" ? "active" : ""} onClick={() => setWalletSection("withdraw")}>Withdraw</button><button className={walletSection === "claims" ? "active" : ""} onClick={() => setWalletSection("claims")}>Daily plan</button></div>
              {walletSection === "deposit" && <div className="wallet-form"><h3>Deposit address</h3><p className="muted">Choose a network to view the address. Confirm the network and supported asset before sending any crypto.</p><label>Network<select value={depositNetwork} onChange={e => setDepositNetwork(e.target.value)}>{Object.keys(depositAddresses).map(n => <option key={n}>{n}</option>)}</select></label><div className="address-box"><span>{depositAddresses[depositNetwork]}</span><button onClick={() => { setDemoNotice("Address selected for " + depositNetwork + ". Verify network support before sending."); }}>Select address</button></div><p className="fine-print">Deposits are not automatically credited. Network and address ownership/support have not been verified by this interface.</p></div>}
              {walletSection === "withdraw" && <div className="wallet-form"><h3>Withdraw crypto</h3><p className="muted">Minimum withdrawal: $10. A real withdrawal requires a connected wallet ledger and transaction service.</p><label>Network<select value={withdrawNetwork} onChange={e => setWithdrawNetwork(e.target.value)}>{Object.keys(depositAddresses).map(n => <option key={n}>{n}</option>)}</select></label><label>Destination address<input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder="Enter recipient wallet address" /></label><label>Amount (USD)<input type="number" min="10" step="0.01" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} /></label><button className="primary-btn" onClick={() => setDemoNotice(Number(withdrawAmount) < 10 ? "Minimum withdrawal is $10." : Number(withdrawAmount) > walletBalance ? "Insufficient balance. Available balance: $0.00." : !withdrawAddress.trim() ? "Enter a destination address." : "Withdrawal cannot be submitted until a real wallet ledger and transaction service are connected.")}>Confirm withdrawal <span>→</span></button></div>}
              {walletSection === "claims" && <div className="wallet-form"><h3>30-day calculation</h3><p className="muted">Planning calculator only. This is not a promised return or a claimable earning schedule.</p><label>Example purchase amount (USD)<input type="number" min="5" value={claimDays} onChange={e => setClaimDays(Math.max(0, Number(e.target.value)))} /></label><div className="claim-math"><div><span>Amount divided over 30 days</span><strong>${(Number(claimDays) / 30).toFixed(4)} / day</strong></div><div><span>30-day total of that amount</span><strong>${Number(claimDays).toFixed(2)}</strong></div></div><p className="fine-print">Daily claims and earnings cannot be enabled until a legitimate funded rewards model and server-side accounting are implemented.</p></div>}
            </div>
          </section>}
          {tab === 'profile' && <section className="page-content profile-page"><div className="page-title-row"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Personal <span>space.</span></h1><p className="muted">Manage your signed-in NovaPool session.</p></div></div>
            <div className="profile-card"><div className="profile-top"><div className="profile-avatar">{userName.slice(0,1).toUpperCase()}</div><div><h2>{userName}</h2><p>{session.user.email}</p><span className="verified-pill">◇ Supabase authenticated</span></div></div>
              <div className="profile-detail"><span>Full name</span><strong>{session.user.user_metadata?.full_name || 'Not provided'}</strong></div><div className="profile-detail"><span>Email address</span><strong>{session.user.email}</strong></div><div className="profile-detail"><span>Account status</span><strong className="status-active">● Active session</strong></div><div className="profile-detail"><span>Environment</span><strong>Preview</strong></div>
              <button className="signout-btn" onClick={handleSignOut}>↗ Sign out of NovaPool</button>
            </div><div className="note-banner"><span className="note-icon">✧</span><div><strong>Your account, your control</strong><p>Never share your password or authentication links. This profile does not store payment details.</p></div></div>
          </section>}
        </div>
        <nav className="bottom-nav">{nav.map(item => <button key={item.id} className={tab === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setTab(item.id)}><span className="nav-icon">{item.icon}</span><span>{item.label}</span></button>)}</nav>
        <footer className="app-footer"><span>© 2026 NovaPool</span><span>Thoughtfully designed</span></footer>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="auth-layout">
        <div className="brand-panel">
          <div className="brand-mark">N</div>
          <p className="eyebrow">NOVA FINANCE</p>
          <h1>Move with the<br /><span>next wave.</span></h1>
          <p className="brand-copy">A premium crypto platform experience built for simple, transparent digital asset management.</p>
          <div className="trust-row"><span className="status-dot" /><span>Secure authentication</span></div>
        </div>

        <div className="auth-card">
          <div className="mobile-brand"><div className="brand-mark small">N</div><strong>NovaPool</strong></div>
          <div className="tabs">
            <button className={isLogin ? 'tab active' : 'tab'} onClick={() => switchMode('login')}>Sign in</button>
            <button className={!isLogin ? 'tab active' : 'tab'} onClick={() => switchMode('signup')}>Create account</button>
          </div>

          <div className="heading">
            <p className="eyebrow">WELCOME TO NOVAPOOL</p>
            <h2>{isLogin ? 'Welcome back.' : 'Create your account.'}</h2>
            <p>{isLogin ? 'Sign in to continue to your NovaPool account.' : 'Join NovaPool with your email and a password.'}</p>
          </div>

          {message && <div className="auth-message success-message">{message}</div>}
          {error && <div className="auth-message error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <label>
                Full name
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} type="text" placeholder="Your name" autoComplete="name" required />
              </label>
            )}

            <label>
              Email address
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required />
            </label>

            <label>
              Password
              <div className="password-wrap">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={6} required />
                <button type="button" className="show-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </label>

            {!isLogin && (
              <label className="check-label">
                <input checked={agreed} onChange={(e) => setAgreed(e.target.checked)} type="checkbox" />
                <span>I agree to the Terms and Privacy Policy.</span>
              </label>
            )}

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : isLogin ? 'Sign in to NovaPool' : 'Create NovaPool account'}
              <span>→</span>
            </button>
          </form>

          <div className="divider"><span>or continue with</span></div>
          <button className="secondary-btn" type="button" onClick={handleGoogle} disabled={loading}>Continue with Google</button>

          <p className="switch-copy">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => switchMode(isLogin ? 'signup' : 'login')}>{isLogin ? 'Create one' : 'Sign in'}</button>
          </p>

          <p className="demo-note">Supabase Auth · No SMS or login code required</p>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
