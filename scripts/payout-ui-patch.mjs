import { readFileSync, writeFileSync } from 'node:fs';

const file = 'dist/index.html';
let html = readFileSync(file, 'utf8');

const script = `<script>
(()=>{
const U='https://qduscddctbvdyqebxbtk.supabase.co',K='sb_publishable_nBgxiYacQmuIyS3m69d1qA_N7kvAe9L',P='novapool:payout-seen:';
const getSession=()=>{for(let i=0;i<localStorage.length;i++){try{const raw=localStorage.getItem(localStorage.key(i));if(!raw)continue;const v=JSON.parse(raw);if(v?.access_token&&v?.user?.id)return v;if(v?.access_token&&v?.session?.user?.id)return{...v,user:v.session.user}}catch{}}return null};
const close=(o,uid,id)=>{localStorage.setItem(P+uid+':'+id,'1');o.remove()};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function check(){
 const s=getSession();
 if(!s?.access_token||!s?.user?.id||document.getElementById('np-paid'))return;
 try{
  const r=await fetch(U+'/rest/v1/np_withdrawal_requests?select=id,amount,network,paid_at,status&status=eq.paid&order=paid_at.desc&limit=20',{headers:{apikey:K,Authorization:'Bearer '+s.access_token}});
  if(!r.ok)return;
  const rows=await r.json();
  const p=rows.find(x=>x?.id&&!localStorage.getItem(P+s.user.id+':'+x.id));
  if(!p)return;
  const o=document.createElement('div');
  o.id='np-paid';
  o.style.cssText='position:fixed;inset:0;z-index:99999;background:radial-gradient(circle at 50% 30%,rgba(212,175,55,.2),#050505 62%);display:grid;place-items:center;padding:20px;overflow:auto';
  o.innerHTML='<div style="width:min(680px,100%);text-align:center;padding:45px 25px 35px;border-radius:30px;border:1px solid rgba(212,175,55,.5);background:#090909;box-shadow:0 0 90px rgba(212,175,55,.18);position:relative;color:white"><button id="np-x" aria-label="Close" style="position:absolute;right:15px;top:15px;width:45px;height:45px;border-radius:50%;background:#ffffff10;border:1px solid #ffffff30;color:white;font-size:27px;cursor:pointer">×</button><div style="font-size:78px">🎉</div><div style="color:#d4af37;letter-spacing:.18em;font-size:12px;font-weight:700">PAYOUT SUCCESS</div><h1 style="font-size:clamp(30px,7vw,58px);line-height:1.02;margin:12px 0">YOUR MONEY HAS BEEN RECEIVED</h1><p style="color:#ffffffb3;font-size:16px">Your payout was successfully delivered by the NovaPool admin.</p><div style="font-size:clamp(40px,9vw,66px);font-weight:800;color:#d4af37;margin:22px 0 8px">$'+Number(p.amount||0).toFixed(2)+'</div><div style="color:#ffffff99;margin-bottom:25px">'+esc(p.network||'Payout')+' · '+(p.paid_at?new Date(p.paid_at).toLocaleString():'Completed')+'</div><button id="np-home" style="padding:14px 24px;border:0;border-radius:14px;background:#d4af37;color:#090909;font-weight:800;cursor:pointer">Back to dashboard →</button></div>';
  document.body.appendChild(o);
  const c=()=>close(o,s.user.id,p.id);
  o.querySelector('#np-x').onclick=c;
  o.querySelector('#np-home').onclick=c;
 }catch{}
}
setInterval(check,2000);
check();
})();
</script>`;

if (!html.includes('id="np-paid"')) html = html.replace('</body>', script + '\n</body>');
writeFileSync(file, html);
