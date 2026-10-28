import fs from 'node:fs';

const jsxPath = 'src/main.jsx';
const cssPath = 'src/styles.css';
let source = fs.readFileSync(jsxPath, 'utf8');

if (!source.includes('function ReferralFloating')) {
  source = source.replace('function App() {', 'function NovaPoolCore() {');
  const referralCode = `
function ReferralFloating() {
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);
  const load = async current => {
    if (!current?.user) { setSummary(null); return; }
    const { data } = await supabase.rpc('np_get_referral_summary');
    if (data?.[0]) setSummary(data[0]);
  };
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const pending = localStorage.getItem('novapool:referral-code');
        if (pending) { await supabase.rpc('np_signup_referral', { p_referral_code: pending }); localStorage.removeItem('novapool:referral-code'); }
        await load(data.session);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next) {
        const pending = localStorage.getItem('novapool:referral-code');
        if (pending) { await supabase.rpc('np_signup_referral', { p_referral_code: pending }); localStorage.removeItem('novapool:referral-code'); }
        await load(next);
      } else setSummary(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return undefined;
    const timer = setInterval(() => load(session), 5000);
    return () => clearInterval(timer);
  }, [session]);
  if (!session || !summary?.referral_code) return null;
  const link = window.location.origin + '/?ref=' + encodeURIComponent(summary.referral_code);
  const copy = async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <>
      <button className="referral-fab" onClick={() => setOpen(true)} aria-label="Open referrals"><span className="referral-fab-orb">↗</span><span>INVITE & EARN $1.50</span></button>
      {open && <div className="referral-overlay" onClick={() => setOpen(false)}>
        <section className="referral-card-3d" onClick={e => e.stopPropagation()}>
          <button className="referral-close" onClick={() => setOpen(false)}>×</button>
          <div className="referral-orbit"><span>✦</span></div>
          <p className="eyebrow">NOVA REFERRALS</p>
          <h2>Invite friends.<br/><span>Earn $1.50.</span></h2>
          <p className="referral-copy">Share your personal link. When a friend joins through it and their deposit is approved, you receive <strong>$1.50</strong> in your NovaPool balance.</p>
          <div className="referral-stats"><div><strong>{summary.referred_count || 0}</strong><small>FRIENDS</small></div><div><strong>{summary.rewarded_count || 0}</strong><small>QUALIFIED</small></div><div><strong>${Number(summary.earned || 0).toFixed(2)}</strong><small>EARNED</small></div></div>
          <label className="referral-label">YOUR REFERRAL LINK</label>
          <div className="referral-link-row"><input value={link} readOnly /><button onClick={copy}>{copied ? 'COPIED' : 'COPY'}</button></div>
          <div className="referral-code">Referral code <strong>{summary.referral_code}</strong></div>
          <p className="referral-note">Your friend must deposit successfully and pass admin verification. The $1.50 reward is then credited automatically.</p>
        </section>
      </div>}
    </>
  );
}

function ReferralBridge() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) localStorage.setItem('novapool:referral-code', ref.trim());
  }, []);
  return null;
}

function App() { return <><NovaPoolCore /><ReferralBridge /><ReferralFloating /></>; }

`;
  const marker = "createRoot(document.getElementById('root')).render(<App />);";
  if (source.includes(marker)) source = source.replace(marker, referralCode + marker);
}
fs.writeFileSync(jsxPath, source);

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.referral-fab')) {
  css += `

.referral-fab{position:fixed;right:18px;bottom:78px;z-index:120;display:flex;align-items:center;gap:9px;padding:11px 17px 11px 10px;border:1px solid rgba(226,188,91,.55);border-radius:999px;background:linear-gradient(145deg,#282114,#090909);color:#f5d78c;font-size:11px;font-weight:900;letter-spacing:.12em;box-shadow:0 18px 45px rgba(0,0,0,.6),inset 0 1px rgba(255,255,255,.1),0 0 28px rgba(213,169,70,.18);backdrop-filter:blur(18px);cursor:pointer}.referral-fab-orb{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#ffe9a7,#a97920 58%,#30230b);color:#17120a;box-shadow:inset 0 2px 5px rgba(255,255,255,.45),0 4px 12px rgba(0,0,0,.45)}.referral-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(16px)}.referral-card-3d{position:relative;width:min(470px,100%);padding:34px;border:1px solid rgba(226,188,91,.3);border-radius:28px;background:radial-gradient(circle at 75% 0%,rgba(207,163,61,.16),transparent 36%),linear-gradient(145deg,#191711,#080808 62%);box-shadow:24px 28px 80px rgba(0,0,0,.72),inset 0 1px rgba(255,255,255,.08),inset 0 -18px 40px rgba(0,0,0,.32);transform:perspective(1000px) rotateX(1deg);color:#f4f0e7}.referral-close{position:absolute;right:16px;top:14px;width:34px;height:34px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:#111;color:#ddd;font-size:22px;cursor:pointer}.referral-orbit{width:74px;height:74px;border:1px solid rgba(225,185,85,.35);border-radius:50%;display:grid;place-items:center;margin-bottom:22px;box-shadow:0 0 32px rgba(212,169,67,.12),inset 0 0 22px rgba(212,169,67,.08);color:#e8c76e;font-size:24px}.referral-card-3d h2{margin:0 0 12px;font-size:34px;line-height:1.05;letter-spacing:-.04em}.referral-card-3d h2 span{color:#e2bd61}.referral-copy{color:#aaa79f;line-height:1.65;font-size:14px}.referral-copy strong{color:#efd079}.referral-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}.referral-stats div{padding:15px 10px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.015));box-shadow:inset 0 1px rgba(255,255,255,.05)}.referral-stats strong{display:block;font-size:20px;color:#f0d083}.referral-stats small{display:block;margin-top:5px;color:#77746e;font-size:9px;letter-spacing:.13em}.referral-label{display:block;margin-bottom:8px;color:#77746e;font-size:9px;letter-spacing:.14em}.referral-link-row{display:flex;gap:8px}.referral-link-row input{min-width:0;flex:1;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:#0d0d0d;color:#d7d2c8;padding:12px;font-size:12px}.referral-link-row button{border:1px solid rgba(226,188,91,.38);border-radius:12px;background:linear-gradient(145deg,#d9b45b,#8b6722);color:#151109;padding:0 15px;font-weight:900;font-size:10px;letter-spacing:.08em;cursor:pointer}.referral-code{margin-top:12px;color:#88847b;font-size:12px}.referral-code strong{color:#dfbd68;letter-spacing:.12em}.referral-note{margin:16px 0 0;color:#66645f;font-size:11px;line-height:1.55}@media(max-width:520px){.referral-card-3d{padding:28px 20px}.referral-card-3d h2{font-size:29px}.referral-fab{right:12px;bottom:72px;padding-right:13px}.referral-fab span:last-child{font-size:10px}.referral-stats{gap:7px}}
`;
  fs.writeFileSync(cssPath, css);
}
console.log('NovaPool referral UI applied.');
