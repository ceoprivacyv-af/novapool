import fs from 'node:fs';

const path = 'src/main.jsx';
let source = fs.readFileSync(path, 'utf8');

const stateMarker = "  const [fullName, setFullName] = useState('');";
const stateLine = "  const [referralCode, setReferralCode] = useState(() => new URLSearchParams(window.location.search).get('ref') || localStorage.getItem('novapool:referral-code') || '');";
if (!source.includes('const [referralCode, setReferralCode]')) {
  if (!source.includes(stateMarker)) throw new Error('NovaPool signup state marker not found.');
  source = source.replace(stateMarker, `${stateMarker}\n${stateLine}`);
}

const signupMarker = "        const { data, error: authError } = await supabase.auth.signUp({\n          email: email.trim(),\n          password,\n          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },\n        });\n        if (authError) throw authError;\n        setNotice(data.session ? 'Account created.' : 'Account created. Check your email if confirmation is enabled.');";
const signupReplacement = "        const normalizedReferral = referralCode.trim().toUpperCase();\n        if (normalizedReferral) localStorage.setItem('novapool:referral-code', normalizedReferral);\n        const { data, error: authError } = await supabase.auth.signUp({\n          email: email.trim(),\n          password,\n          options: { data: { full_name: fullName.trim(), referral_code: normalizedReferral || null }, emailRedirectTo: window.location.origin },\n        });\n        if (authError) throw authError;\n        if (data.session && normalizedReferral) {\n          const { error: referralError } = await supabase.rpc('np_signup_referral', { p_referral_code: normalizedReferral });\n          if (!referralError) localStorage.removeItem('novapool:referral-code');\n        }\n        setNotice(data.session ? (normalizedReferral ? 'Account created and referral linked.' : 'Account created.') : 'Account created. Check your email if confirmation is enabled.');";
if (!source.includes('const normalizedReferral = referralCode.trim().toUpperCase();')) {
  if (!source.includes(signupMarker)) throw new Error('NovaPool signup handler marker not found.');
  source = source.replace(signupMarker, signupReplacement);
}

const formMarker = "            {mode === 'signup' && <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} required /></label>}\n            <label>Email<input type=\"email\" value={email} onChange={e => setEmail(e.target.value)} required /></label>";
const formReplacement = "            {mode === 'signup' && <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} required /></label>}\n            <label>Email<input type=\"email\" value={email} onChange={e => setEmail(e.target.value)} required /></label>\n            {mode === 'signup' && <label>Referral code <span className=\"signup-optional\">(optional)</span><input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder=\"Enter referral code\" autoComplete=\"off\" /></label>}";
if (!source.includes('className="signup-optional"')) {
  if (!source.includes(formMarker)) throw new Error('NovaPool signup form marker not found.');
  source = source.replace(formMarker, formReplacement);
}

fs.writeFileSync(path, source);

const cssPath = 'src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');
const cssMarker = '/* NovaPool signup referral field */';
if (!css.includes(cssMarker)) {
  css += `\n\n${cssMarker}\n.signup-optional { opacity: .55; font-size: .72em; font-weight: 500; margin-left: .25rem; }\n`;
  fs.writeFileSync(cssPath, css);
}

console.log('NovaPool signup referral field enabled with real referral linking.');
