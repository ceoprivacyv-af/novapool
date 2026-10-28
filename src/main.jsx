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

  if (session) {
    const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member';

    return (
      <main className="page-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <section className="auth-layout">
          <div className="brand-panel">
            <div className="brand-mark">N</div>
            <p className="eyebrow">NOVA FINANCE</p>
            <h1>You're<br /><span>inside.</span></h1>
            <p className="brand-copy">Your NovaPool authentication is connected to Supabase and your session is active.</p>
            <div className="trust-row"><span className="status-dot" /><span>Authenticated session</span></div>
          </div>
          <div className="auth-card success-card">
            <div className="mobile-brand"><div className="brand-mark small">N</div><strong>NovaPool</strong></div>
            <p className="eyebrow">ACCOUNT ACTIVE</p>
            <h2>Welcome, {userName}.</h2>
            <p className="success-copy">You're signed in as <strong>{session.user.email}</strong>.</p>
            <button className="primary-btn" type="button" onClick={handleSignOut}>Sign out <span>→</span></button>
            <p className="demo-note">Authentication is live · NovaPool dashboard comes next</p>
          </div>
        </section>
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
