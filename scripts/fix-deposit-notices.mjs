import fs from 'node:fs';

const path = 'src/main.jsx';
let source = fs.readFileSync(path, 'utf8');

const oldSubmit = "setProof(null); setTxHash(''); setNotice('Deposit submitted for admin review.'); await refreshAccount();";
const newSubmit = "setProof(null); setTxHash(''); setNotice('Deposit submitted. Your money is pending verification. You cannot submit another deposit until this one is approved or rejected.'); await refreshAccount();";
if (source.includes(oldSubmit)) source = source.replace(oldSubmit, newSubmit);

const oldReview = "await refreshAdmin(); setNotice(approve ? 'Deposit approved and credited.' : 'Deposit rejected.');";
const newReview = "await refreshAdmin(); setNotice(approve ? 'Your money has arrived. Your deposit has been verified and added to your NovaPool balance.' : 'Your money has arrived back. Your deposit was rejected and was not added to your NovaPool balance.');";
if (source.includes(oldReview)) source = source.replace(oldReview, newReview);

fs.writeFileSync(path, source);
console.log('NovaPool deposit notices applied.');
