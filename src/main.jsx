import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === 'login';

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="auth-layout">
        <div className="brand-panel">
          <div className="brand-mark">N</div>
          <p className="eyebrow">NOVA FINANCE</p>
          <h1>Move with the<br /><span>next wave.</span></h1>
          <p className="brand-copy">
            A premium crypto platform experience built for simple, transparent digital asset management.
          </p>
          <div className="trust-row">
            <span className="status-dot" />
            <span>Secure demo environment</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="mobile-brand"><div className="brand-mark small">N</div><strong>NovaPool</strong></div>
          <div className="tabs">
            <button className={isLogin ? 'tab active' : 'tab'} onClick={() => setMode('login')}>Sign in</button>
            <button className={!isLogin ? 'tab active' : 'tab'} onClick={() => setMode('signup')}>Create account</button>
          </div>

          <div className="heading">
            <p className="eyebrow">WELCOME TO NOVAPOOL</p>
            <h2>{isLogin ? 'Welcome back.' : 'Create your account.'}</h2>
            <p>{isLogin ? 'Sign in to continue to your NovaPool account.' : 'Join NovaPool and create your secure demo account.'}</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <label>
                Full name
                <input type="text" placeholder="Your name" autoComplete="name" />
              </label>
            )}

            <label>
              Email address
              <input type="email" placeholder="you@example.com" autoComplete="email" />
            </label>

            <label>
              Password
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button type="button" className="show-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {!isLogin && (
              <label className="check-label">
                <input type="checkbox" />
                <span>I agree to the Terms and Privacy Policy.</span>
              </label>
            )}

            <button className="primary-btn" type="submit">
              {isLogin ? 'Sign in to NovaPool' : 'Create NovaPool account'}
              <span>→</span>
            </button>
          </form>

          <div className="divider"><span>or continue with</span></div>
          <button className="secondary-btn" type="button">Continue with Google</button>

          <p className="switch-copy">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => setMode(isLogin ? 'signup' : 'login')}>
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <p className="demo-note">Demo interface · No real funds are processed</p>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
