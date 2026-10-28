import fs from 'node:fs';

const jsxPath = 'src/main.jsx';
const cssPath = 'src/styles.css';
let source = fs.readFileSync(jsxPath, 'utf8');

const oldCard = `function ProductCard({ item, onClick }) {\n  return <button className="product-card" onClick={onClick}><div className="product-card-art"><Art tone={item.tone} /><span className="product-tag">{item.tag}</span></div><div className="product-card-copy"><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{item.description}</p><div className="card-price"><span>Price</span><strong>{money(item.price)}</strong></div><div className="card-buy">Buy now →</div></div></button>;\n}`;

const newCard = `function ProductCard({ item, onClick }) {\n  const daily = item.price / 6;\n  const total30 = item.price * 3;\n  return <button className="product-card" onClick={onClick}><div className="product-card-art"><Art tone={item.tone} /><span className="product-tag">{item.tag}</span></div><div className="product-card-copy"><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{item.description}</p><div className="product-metrics"><div><span>PRICE</span><strong>{money(item.price)}</strong></div><div><span>DAILY CLAIM</span><strong>{money(daily)}</strong></div><div><span>30-DAY TOTAL</span><strong>{money(total30)}</strong></div></div><div className="card-buy">Buy now →</div></div></button>;\n}`;

if (source.includes(oldCard)) source = source.replace(oldCard, newCard);

const oldFeature = `<div className="price-line"><span>Price</span><strong>{money(product.price)}</strong></div>`;
const newFeature = `<div className="product-metrics feature-metrics"><div><span>PRICE</span><strong>{money(product.price)}</strong></div><div><span>DAILY CLAIM</span><strong>{money(product.price / 6)}</strong></div><div><span>30-DAY TOTAL</span><strong>{money(product.price * 3)}</strong></div></div>`;
if (source.includes(oldFeature)) source = source.replace(oldFeature, newFeature);

fs.writeFileSync(jsxPath, source);

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.product-metrics')) {
  css += `\n.product-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.product-metrics>div{padding:11px 8px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.012));box-shadow:inset 0 1px rgba(255,255,255,.05)}.product-metrics span{display:block;color:#77746e;font-size:8px;letter-spacing:.11em;margin-bottom:5px}.product-metrics strong{display:block;color:#e7c66d;font-size:14px}.feature-metrics{margin:22px 0}.feature-metrics strong{font-size:18px}@media(max-width:520px){.product-metrics{gap:6px}.product-metrics>div{padding:9px 6px}.product-metrics strong{font-size:12px}.product-metrics span{font-size:7px}}\n`;
  fs.writeFileSync(cssPath, css);
}
console.log('Product reward display fixed: 3x total over 30 claims.');
