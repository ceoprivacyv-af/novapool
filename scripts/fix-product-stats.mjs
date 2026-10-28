import fs from 'node:fs';

const jsxPath = 'src/main.jsx';
const cssPath = 'src/styles.css';
let source = fs.readFileSync(jsxPath, 'utf8');

// Patch the real ProductCard in the current NovaPool source. Use a regex so
// harmless formatting changes do not make the Vercel build silently skip it.
const productCardPattern = /function ProductCard\(\{ item, onClick \}\) \{[\s\S]*?\n\}/;
const newCard = `function ProductCard({ item, onClick }) {
  const daily = Number(item.price || 0) / 6;
  const total30 = Number(item.price || 0) * 3;
  return <button className="product-card" onClick={onClick}>
    <div className="product-card-art"><Art tone={item.tone} /><span className="product-tag">{item.tag}</span></div>
    <div className="product-card-copy">
      <p className="eyebrow">{item.category}</p>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <div className="card-price"><span>Product price</span><strong>{money(item.price)}</strong></div>
      <div className="product-reward-preview">
        <div><span>Daily claim</span><strong>{money(daily)}</strong></div>
        <div><span>30-day total</span><strong>{money(total30)}</strong></div>
      </div>
      <div className="card-buy">Buy now →</div>
    </div>
  </button>;
}`;

if (productCardPattern.test(source)) {
  source = source.replace(productCardPattern, newCard);
} else if (!source.includes('product-reward-preview')) {
  throw new Error('NovaPool ProductCard marker not found; refusing to build without applying reward stats.');
}

// Patch the featured product panel too, so the selected product shows the same
// three numbers as the cards.
const featurePattern = /<div className="price-line">\s*<span>Price<\/span>\s*<strong>\{money\(product\.price\)\}<\/strong>\s*<\/div>/;
const newFeature = `<div className="product-reward-preview feature-reward-preview">
  <div><span>Product price</span><strong>{money(product.price)}</strong></div>
  <div><span>Daily claim</span><strong>{money(product.price / 6)}</strong></div>
  <div><span>30-day total</span><strong>{money(product.price * 3)}</strong></div>
</div>`;
if (featurePattern.test(source)) source = source.replace(featurePattern, newFeature);

fs.writeFileSync(jsxPath, source);

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.product-reward-preview')) {
  css += `
.product-reward-preview{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0}.product-reward-preview>div{padding:11px 10px;border:1px solid rgba(226,188,91,.16);border-radius:13px;background:linear-gradient(145deg,rgba(226,188,91,.08),rgba(255,255,255,.025));box-shadow:inset 0 1px rgba(255,255,255,.06),0 8px 20px rgba(0,0,0,.16)}.product-reward-preview span{display:block;color:#77736b;font-size:9px;letter-spacing:.1em;text-transform:uppercase}.product-reward-preview strong{display:block;margin-top:4px;color:#e5c36f;font-size:15px}.feature-reward-preview{grid-template-columns:repeat(3,1fr);margin:22px 0}.feature-reward-preview>div{padding:13px 10px}.feature-reward-preview strong{font-size:17px}@media(max-width:520px){.feature-reward-preview{gap:6px}.feature-reward-preview>div{padding:10px 6px}.feature-reward-preview span{font-size:7px}.feature-reward-preview strong{font-size:13px}}@media(max-width:420px){.product-reward-preview{gap:6px}.product-reward-preview>div{padding:9px 7px}}
`;
  fs.writeFileSync(cssPath, css);
}

console.log('NovaPool product rewards: $5→$0.83/day→$15, $10→$1.67/day→$30, $15→$2.50/day→$45.');
