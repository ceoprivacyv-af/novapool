import fs from 'node:fs';

const path = 'src/main.jsx';
let source = fs.readFileSync(path, 'utf8');

const oldCard = `function ProductCard({ item, onClick }) {
  return <button className="product-card" onClick={onClick}><div className="product-card-art"><Art tone={item.tone} /><span className="product-tag">{item.tag}</span></div><div className="product-card-copy"><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{item.description}</p><div className="card-price"><span>Price</span><strong>{money(item.price)}</strong></div><div className="card-buy">Buy now →</div></div></button>;
}`;

const newCard = `function ProductCard({ item, onClick }) {
  const daily = Number(item.price || 0) / 30;
  return <button className="product-card" onClick={onClick}>
    <div className="product-card-art"><Art tone={item.tone} /><span className="product-tag">{item.tag}</span></div>
    <div className="product-card-copy">
      <p className="eyebrow">{item.category}</p>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <div className="card-price"><span>Product price</span><strong>{money(item.price)}</strong></div>
      <div className="product-reward-preview">
        <div><span>Daily claim</span><strong>{money(daily)}</strong></div>
        <div><span>30-day total</span><strong>{money(item.price)}</strong></div>
      </div>
      <div className="card-buy">Buy now →</div>
    </div>
  </button>;
}`;

if (source.includes(oldCard)) source = source.replace(oldCard, newCard);

const cssPath = 'src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.product-reward-preview')) {
  css += `\n.product-reward-preview{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0}.product-reward-preview>div{padding:11px 10px;border:1px solid rgba(226,188,91,.16);border-radius:13px;background:linear-gradient(145deg,rgba(226,188,91,.08),rgba(255,255,255,.025));box-shadow:inset 0 1px rgba(255,255,255,.06),0 8px 20px rgba(0,0,0,.16)}.product-reward-preview span{display:block;color:#77736b;font-size:9px;letter-spacing:.1em;text-transform:uppercase}.product-reward-preview strong{display:block;margin-top:4px;color:#e5c36f;font-size:15px}@media(max-width:420px){.product-reward-preview{gap:6px}.product-reward-preview>div{padding:9px 7px}}\n`;
  fs.writeFileSync(cssPath, css);
}

console.log('NovaPool product daily-claim stats applied.');
`;
