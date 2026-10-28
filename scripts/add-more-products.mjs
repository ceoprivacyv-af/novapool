import fs from 'node:fs';

const file = 'src/main.jsx';
let source = fs.readFileSync(file, 'utf8');

const oldProducts = `const products = [
  { id: 'halo', name: 'Aurum Halo', category: 'SIGNATURE SERIES', description: 'A sculptural gold halo with a refined gallery-inspired finish.', price: 5, tone: 'gold', tag: 'FEATURED' },
  { id: 'arc', name: 'Obsidian Arc', category: 'OBSIDIAN SERIES', description: 'A dark mineral silhouette with a subtle metallic edge.', price: 10, tone: 'silver', tag: 'LIMITED' },
  { id: 'orb', name: 'Solstice Orb', category: 'ATELIER SERIES', description: 'Warm ambient light and a minimal architectural form.', price: 15, tone: 'bronze', tag: 'ATELIER' },
];`;

const newProducts = `const products = [
  { id: 'halo', name: 'Aurum Halo', category: 'SIGNATURE SERIES', description: 'A sculptural gold halo with a refined gallery-inspired finish.', price: 5, tone: 'gold', tag: 'FEATURED' },
  { id: 'arc', name: 'Obsidian Arc', category: 'OBSIDIAN SERIES', description: 'A dark mineral silhouette with a subtle metallic edge.', price: 10, tone: 'silver', tag: 'LIMITED' },
  { id: 'orb', name: 'Solstice Orb', category: 'ATELIER SERIES', description: 'Warm ambient light and a minimal architectural form.', price: 15, tone: 'bronze', tag: 'ATELIER' },
  { id: 'crystal', name: 'Gilded Crystal', category: 'CRYSTAL SERIES', description: 'A faceted golden crystal designed like a private collection piece.', price: 20, tone: 'crystal', tag: 'NEW' },
  { id: 'vault', name: 'Midnight Vault', category: 'RESERVE SERIES', description: 'A compact architectural form with a deep black-metal finish.', price: 25, tone: 'vault', tag: 'RESERVE' },
  { id: 'crown', name: 'Imperial Crown', category: 'CROWN SERIES', description: 'A sculptural crown silhouette with warm metallic highlights.', price: 30, tone: 'crown', tag: 'PREMIUM' },
];`;

if (!source.includes(oldProducts)) throw new Error('Product catalog marker not found.');
source = source.replace(oldProducts, newProducts);

const oldArt = `function Art({ tone = 'gold' }) {
  return (
    <div className={\`product-art art-${tone}\`}>
      <div className="art-glow" />
      <div className="art-ring"><div className="ring-inner" /></div>
      <div className="art-pedestal"><div className="pedestal-top" /></div>
      <div className="art-reflection" />
    </div>
  );
}`;

const newArt = `function Art({ tone = 'gold' }) {
  return (
    <div className={\`product-art art-${tone}\`}>
      <div className="art-glow" />
      <div className="art-ring"><div className="ring-inner" /></div>
      <div className="art-pedestal"><div className="pedestal-top" /></div>
      <div className="art-reflection" />
    </div>
  );
}`;

if (!source.includes(oldArt)) throw new Error('Art component marker not found.');
source = source.replace(oldArt, newArt);
fs.writeFileSync(file, source);

const cssFile = 'src/styles.css';
let css = fs.readFileSync(cssFile, 'utf8');
const marker = '/* NovaPool additional product artwork */';
if (!css.includes(marker)) {
  css += `\n\n${marker}\n.art-crystal .art-ring { width: 30%; height: 54%; aspect-ratio: auto; border-radius: 18% 18% 30% 30%; transform: rotate(45deg) scaleY(1.05); border-color: #f0d58f; background: linear-gradient(145deg,#fff0b0,#a77928 55%,#3b2a10); box-shadow: inset 8px 8px 20px #fff5, inset -10px -12px 24px #2a1a06, 0 16px 35px #c9964c33; }\n.art-crystal .ring-inner { width: 44%; height: 44%; border-radius: 8px; border: 1px solid #fff5c8aa; background: #f7d98b22; }\n.art-crystal .art-glow { background: #e0b45c44; }\n.art-vault .art-ring { width: 48%; height: 48%; aspect-ratio: auto; border-radius: 14px; transform: perspective(420px) rotateX(55deg) rotateZ(-12deg); border-color: #c8cbd0aa; background: linear-gradient(145deg,#34383d,#101215 58%,#686d73); box-shadow: inset 0 2px 1px #fff4, inset -18px -20px 30px #0009, 0 20px 40px #0008; }\n.art-vault .ring-inner { width: 52%; height: 52%; border-radius: 10px; border: 1px solid #d7dbe055; background: #050607aa; }\n.art-vault .art-glow { background: #9fa7b022; }\n.art-crown .art-ring { width: 52%; height: 42%; aspect-ratio: auto; border-radius: 45% 45% 18% 18%; border-color: #f0c873; background: linear-gradient(135deg,#f5d78d 0 18%,#8c5e1f 19% 36%,#e4bd69 37% 58%,#5b3a12 59% 76%,#d8aa52 77%); clip-path: polygon(0 25%,18% 43%,32% 0,50% 43%,68% 0,82% 43%,100% 25%,92% 100%,8% 100%); box-shadow: inset 0 4px 7px #fff6, 0 18px 38px #b9812d44; }\n.art-crown .ring-inner { width: 36%; height: 34%; border-radius: 50%; border: 1px solid #fff0b455; background: #21160755; }\n.art-crown .art-glow { background: #d5a54c44; }\n.product-art.art-crystal,.product-art.art-vault,.product-art.art-crown { background: radial-gradient(ellipse at 50% 78%,#d1a55d2b,transparent 36%),linear-gradient(145deg,#211f1a,#0d0e10 70%); }\n`;
  fs.writeFileSync(cssFile, css);
}
