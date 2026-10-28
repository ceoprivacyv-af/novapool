import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import './referral.css';

function ReferralUI() {
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async current => {
    if (!current?.user) { setSummary(null); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('np_get_referral_summary');
      if (!error && data?.[0]) setSummary(data[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const applyReferral = async current => {
      if (!current) return;
      const pending = localStorage.getItem('novapool:referral-code');
      if (pending) {
        try { await supabase.rpc('np_signup_referral', { p_referral_code: pending.trim() }); } catch (_) {}
        localStorage.removeItem('novapool:referral-code');
      }
      if (alive) await load(current);
    };
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      applyReferral(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!alive) return;
      setSession(next);
      applyReferral(next);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    const timer = setInterval(() => load(session), 5000);
    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref?.trim()) localStorage.setItem('novapool:referral-code', ref.trim());
  }, []);

  if (!session) return null;

  const link = summary?.referral_code
    ? `${window.location.origin}/?ref=${encodeURIComponent(summary.referral_code)}`
    : '';
  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); }
    catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return <>
    <button type="button" className="np-referral-fab" onClick={() => setOpen(true)} aria-label="Invite friends and earn referral rewards">
      <span className="np-referral-orb">↗</span><span>INVITE & EARN $1.50</span>
    </button>
    {open && <div className="np-referral-overlay" onClick={() => setOpen(false)}>
      <section className="np-referral-card" onClick={e => e.stopPropagation()}>
        <button type="button" className="np-referral-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <div className="np-referral-emblem">✦</div>
        <p className="np-referral-eyebrow">NOVA REFERRALS</p>
        <h2>Invite friends.<br /><span>Earn $1.50.</span></h2>
        <p className="np-referral-copy">Share your personal referral link. When a friend joins through it and their deposit is approved, <strong>$1.50</strong> is credited to your NovaPool balance.</p>
        {summary?.referral_code ? <>
          <div className="np-referral-stats">
            <div><strong>{summary.referred_count || 0}</strong><small>FRIENDS</small></div>
            <div><strong>{summary.rewarded_count || 0}</strong><small>QUALIFIED</small></div>
            <div><strong>${Number(summary.earned || 0).toFixed(2)}</strong><small>EARNED</small></div>
          </div>
          <label className="np-referral-label">YOUR REFERRAL LINK</label>
          <div className="np-referral-link"><input value={link} readOnly aria-label="Referral link" /><button type="button" onClick={copy}>{copied ? 'COPIED' : 'COPY'}</button></div>
          <div className="np-referral-code">Referral code <strong>{summary.referral_code}</strong></div>
          <p className="np-referral-note">Your friend must deposit successfully and pass admin verification. The $1.50 reward is then credited automatically.</p>
        </> : <div className="np-referral-loading">{loading ? 'Preparing your personal referral link…' : 'Your referral link is temporarily unavailable. Please try again in a few seconds.'}<button type="button" className="np-referral-retry" onClick={() => load(session)}>Refresh referral</button></div>}
      </section>
    </div>}
  </>;
}

const mount = () => {
  if (document.getElementById('novapool-referral-root')) return;
  const node = document.createElement('div');
  node.id = 'novapool-referral-root';
  document.body.appendChild(node);
  createRoot(node).render(<ReferralUI />);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();
