/* Deebak Software — scan-to-stock, scan-to-bill for Indian shops.
   Vanilla JS, no build step. Data lives in the browser (localStorage) in this demo build. */
(() => {
'use strict';

/* ───────────────────────── helpers ───────────────────────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const inr = n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(+n) ? 0 : 2, maximumFractionDigits: 2 });
const inr2 = n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qf = n => String(+(+n).toFixed(3));
const uid = () => Math.random().toString(36).slice(2, 10);
const fdate = ts => new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const ftime = ts => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

function words(n) {
  n = Math.round(n); if (!n) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = x => x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '');
  const three = x => (x > 99 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : '');
  const parts = []; const cr = Math.floor(n / 1e7); n %= 1e7; const lk = Math.floor(n / 1e5); n %= 1e5; const th = Math.floor(n / 1e3); n %= 1e3;
  if (cr) parts.push(three(cr) + ' Crore'); if (lk) parts.push(two(lk) + ' Lakh'); if (th) parts.push(two(th) + ' Thousand'); if (n) parts.push(three(n));
  return parts.join(' ') + ' Rupees Only';
}

/* ───────────────────────── icons ───────────────────────── */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  down: '<path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v3h16v-3"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><path d="M14 14h3v3h-3zM20 14v0M14 20h3M20 17v4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  printer: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  send: '<path d="M4 20l1.5-4.5A8 8 0 1 1 9 18.5z"/>',
  store: '<path d="M4 9l1-5h14l1 5"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 12v8h14v-8"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 17.5v.5"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  shirt: '<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
  cake: '<path d="M4 20h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M12 12V9M12 9c-1.2 0-2-.9-2-2 0-1 2-3.5 2-3.5s2 2.5 2 3.5c0 1.1-.8 2-2 2zM4 16.5c2 1.4 4 1.4 8 0s6-1.4 8 0"/>',
  basket: '<path d="M4 9h16l-1.5 10a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7z"/><path d="m8 9 3-5M16 9l-3-5"/>',
  pill: '<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-40 12 12)"/><path d="m9.2 9.2 5.6 5.6"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  pencil: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
};
const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const LOGO = `<svg viewBox="0 0 24 24" fill="none"><path d="M3 8V6a3 3 0 0 1 3-3h2M16 3h2a3 3 0 0 1 3 3v2M21 16v2a3 3 0 0 1-3 3h-2M8 21H6a3 3 0 0 1-3-3v-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M9 8h3.2c3 0 4.8 1.7 4.8 4s-1.8 4-4.8 4H9z" fill="#fff"/></svg>`;

/* ───────────────────────── i18n (English / हिन्दी) ───────────────────────── */
const HI = {
  'Home': 'होम', 'Billing': 'बिलिंग', 'Stock In': 'स्टॉक जोड़ें', 'Items': 'सामान', 'Bills': 'बिल', 'Settings': 'सेटिंग्स',
  'New Bill': 'नया बिल', 'Current Bill': 'वर्तमान बिल', 'Generate Bill': 'बिल बनाएं', 'Total': 'कुल', 'Subtotal': 'उप-योग', 'Discount': 'छूट',
  'Scan item QR': 'सामान का QR स्कैन करें', 'Camera': 'कैमरा', 'Demo scan': 'डेमो स्कैन', 'Search': 'खोजें', 'Cash': 'नकद', 'Card': 'कार्ड',
  'Add item': 'सामान जोड़ें', 'Save': 'सहेजें', 'Cancel': 'रद्द करें', 'Low stock': 'कम स्टॉक', 'Out of stock': 'स्टॉक खत्म', 'Save to stock': 'स्टॉक में जोड़ें',
  'Namaste': 'नमस्ते', "Today's sales": 'आज की बिक्री', 'Print': 'प्रिंट', 'Bills today': 'आज के बिल', 'Average bill': 'औसत बिल', 'Clear': 'साफ करें',
  'Good morning': 'सुप्रभात', 'Good afternoon': 'नमस्कार', 'Good evening': 'शुभ संध्या', 'All': 'सभी', 'Items to add': 'जोड़ने वाला सामान',
  'Recently added': 'हाल में जोड़ा', 'Start billing': 'बिलिंग शुरू करें', 'Last 7 days': 'पिछले 7 दिन', 'Top sellers': 'सबसे ज़्यादा बिकने वाले',
  'Needs restocking': 'स्टॉक भरना है', 'Recent bills': 'हाल के बिल', 'Scan the QR on the item': 'सामान पर लगा QR स्कैन करें',
  'Check the quantity': 'मात्रा जांचें', 'Tap Save to stock': '"स्टॉक में जोड़ें" दबाएं', 'Items & QR': 'सामान और QR',
};
const t = k => (S.lang === 'hi' && HI[k]) || k;

/* ───────────────────────── shop types ───────────────────────── */
const TYPES = {
  textile: { label: 'Textile', icon: 'shirt', accent: '#2D3A8C', dark: '#93A0FF', prefix: 'TX', units: ['pc', 'm'], cats: ['Sarees', 'Menswear', 'Womenswear', 'Kids', 'Fabric', 'Home'] },
  sweets: { label: 'Sweets', icon: 'cake', accent: '#E0660C', dark: '#FF9440', prefix: 'SW', units: ['kg', 'box', 'pc'], cats: ['Ghee Sweets', 'Milk Sweets', 'Savouries', 'Gift Boxes'] },
  grocery: { label: 'Grocery', icon: 'basket', accent: '#1F7A3E', dark: '#55D083', prefix: 'GR', units: ['pc', 'kg', 'l'], cats: ['Staples', 'Oil & Ghee', 'Snacks', 'Beverages', 'Household'] },
  pharmacy: { label: 'Pharmacy', icon: 'pill', accent: '#0E7490', dark: '#4CC9E5', prefix: 'PH', units: ['pc', 'pack'], cats: ['Tablets', 'Syrups', 'Personal Care', 'Devices'] },
  electronics: { label: 'Electronics', icon: 'bolt', accent: '#B4234F', dark: '#FF7A9F', prefix: 'EL', units: ['pc'], cats: ['Mobiles', 'Accessories', 'Appliances', 'Lighting'] },
  stationery: { label: 'Stationery', icon: 'pencil', accent: '#9A5B13', dark: '#E7A64F', prefix: 'ST', units: ['pc', 'pack'], cats: ['Writing', 'Paper', 'Office', 'School'] },
  other: { label: 'Other', icon: 'grid', accent: '#3C3A35', dark: '#C9C3B4', prefix: 'GN', units: ['pc', 'kg', 'm', 'box'], cats: ['General'] },
};
const UNITS = { pc: 'piece', m: 'metre', kg: 'kg', box: 'box', pack: 'pack', l: 'litre', dozen: 'dozen' };
const STEP = { pc: 1, m: 0.5, kg: 0.25, box: 1, pack: 1, l: 0.5, dozen: 1 };
const DEFQ = { pc: 1, m: 1, kg: 0.5, box: 1, pack: 1, l: 1, dozen: 1 };
const TILEC = ['#9A3412', '#1D4ED8', '#047857', '#9D174D', '#B45309', '#0F766E', '#6D28D9', '#B91C1C'];
const tileColor = s => TILEC[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % TILEC.length];
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const tile = (p, sm) => `<div class="tile ${sm ? 'sm' : ''}" style="--tc:${tileColor(p.cat)}">${esc(initials(p.name))}</div>`;

/* ───────────────────────── data / seed ───────────────────────── */
const KEY = 'deebak.v1';
let S;
function nextCode(sh) {
  const pre = TYPES[sh.type].prefix; let n = 1001 + sh.products.length;
  while (sh.products.some(p => p.code === `${pre}-${n}`)) n++;
  return `${pre}-${n}`;
}
function mkProduct(sh, [name, cat, price, unit, gst, stock, low]) {
  return { id: uid(), code: nextCode(sh), name, cat, price, unit, gst, stock, low };
}
function makeShop(type, over, prods) {
  const sh = { id: uid(), type, name: 'My Shop', address: '', phone: '', gstin: '', upi: '', footer: 'Thank you! Visit again 🙏', paper: 'thermal', products: [], bills: [], stockLog: [], seq: 0, ...over };
  (prods || []).forEach(p => sh.products.push(mkProduct(sh, p)));
  return sh;
}
const billNo = sh => `${TYPES[sh.type].prefix}-${String(sh.seq).padStart(4, '0')}`;

function calc(items, disc) {
  const gross = r2(items.reduce((s, i) => s + i.qty * i.price, 0));
  const d = Math.max(0, Math.min(disc || 0, gross));
  const f = gross ? (gross - d) / gross : 1;
  const by = {}; let net = 0;
  items.forEach(i => {
    const line = i.qty * i.price * f, tax = line * i.gst / (100 + i.gst);
    const g = by[i.gst] || (by[i.gst] = { rate: i.gst, taxable: 0, tax: 0 });
    g.taxable += line - tax; g.tax += tax; net += line;
  });
  net = r2(net); const total = Math.round(net);
  const taxes = Object.values(by).sort((a, b) => a.rate - b.rate).map(g => ({ rate: g.rate, taxable: r2(g.taxable), cgst: r2(g.tax / 2), sgst: r2(g.tax / 2) }));
  return { gross, discount: r2(d), net, taxes, taxable: r2(taxes.reduce((s, x) => s + x.taxable, 0)), tax: r2(taxes.reduce((s, x) => s + x.cgst + x.sgst, 0)), roundOff: r2(total - net), total, count: items.length };
}
const lineOf = (p, qty) => ({ pid: p.id, name: p.name, unit: p.unit, qty, price: p.price, gst: p.gst });

function genHistory(sh, days, seed) {
  if (!sh.products.length) return;
  const R = rng(seed), now = Date.now(), list = [];
  for (let d = days - 1; d >= 0; d--) {
    const n = d === 0 ? 4 + Math.floor(R() * 3) : 5 + Math.floor(R() * 7);
    for (let k = 0; k < n; k++) {
      const day = new Date(); day.setDate(day.getDate() - d);
      day.setHours(9 + Math.floor(R() * 11), Math.floor(R() * 60), Math.floor(R() * 60), 0);
      let ts = day.getTime(); if (ts > now) ts = now - Math.floor(R() * 7200e3) - 90e3;
      const items = [];
      for (let j = 0, lines = 1 + Math.floor(R() * 3); j < lines; j++) {
        const p = sh.products[Math.floor(R() * sh.products.length)];
        if (items.some(i => i.pid === p.id)) continue;
        const q = p.unit === 'kg' ? [0.25, 0.5, 1, 1.5][Math.floor(R() * 4)] : p.unit === 'm' ? [1.5, 2, 2.5, 4][Math.floor(R() * 4)] : 1 + Math.floor(R() * 2);
        items.push(lineOf(p, q));
      }
      list.push({ ts, items });
    }
  }
  list.sort((a, b) => a.ts - b.ts).forEach(b => {
    sh.seq++;
    const gross = r2(b.items.reduce((s, i) => s + i.qty * i.price, 0));
    const disc = R() < .15 ? Math.round(gross * 0.05) : 0;
    const c = calc(b.items, disc);
    sh.bills.push({ id: uid(), no: billNo(sh), ts: b.ts, items: b.items, ...c, pay: ['cash', 'upi', 'upi', 'card'][Math.floor(R() * 4)], cust: { name: '', phone: R() < .4 ? String(9000000000 + Math.floor(R() * 999999999)) : '' } });
  });
}

function seedAll() {
  const tx = makeShop('textile', { name: 'Sri Lakshmi Textiles', address: '14, Gandhi Bazaar Road, Kanchipuram – 631501', phone: '9840012345', gstin: '33AABCS1234F1Z5', upi: 'srilakshmitextiles@okhdfcbank', footer: 'Exchange within 7 days with bill. Thank you! 🙏' }, [
    ['Kanchipuram Silk Saree', 'Sarees', 8450, 'pc', 5, 12, 3], ['Banarasi Georgette Saree', 'Sarees', 4200, 'pc', 5, 18, 4], ['Cotton Handloom Saree', 'Sarees', 1250, 'pc', 5, 30, 6],
    ['Pure Cotton Dhoti 9×5', 'Menswear', 780, 'pc', 5, 40, 8], ['Formal Shirt Slim Fit', 'Menswear', 1450, 'pc', 5, 35, 8], ['Lungi Checked', 'Menswear', 280, 'pc', 5, 3, 10],
    ['Chudidar Set Unstitched', 'Womenswear', 1650, 'pc', 5, 22, 5], ['Kids Pattu Pavadai', 'Kids', 2150, 'pc', 5, 14, 4], ['Shirt Piece Cotton', 'Fabric', 360, 'm', 5, 120, 20],
    ['Silk Blouse Material', 'Fabric', 520, 'm', 5, 80, 15], ['Double Bedsheet Set', 'Home', 950, 'pc', 5, 26, 6], ['Terry Bath Towel', 'Home', 320, 'pc', 5, 60, 12],
  ]);
  const sw = makeShop('sweets', { name: 'Deebak Sweets & Snacks', address: '7, Car Street, Tirunelveli – 627001', phone: '9442098765', gstin: '33AAFCD5678K1Z2', upi: 'deebaksweets@oksbi', footer: 'Freshly made every morning. Thank you! 🙏' }, [
    ['Mysore Pak', 'Ghee Sweets', 720, 'kg', 5, 18.5, 4], ['Kaju Katli', 'Ghee Sweets', 1100, 'kg', 5, 12, 3], ['Tirunelveli Halwa', 'Ghee Sweets', 680, 'kg', 5, 16, 4],
    ['Badusha', 'Ghee Sweets', 520, 'kg', 5, 14, 4], ['Adhirasam', 'Ghee Sweets', 600, 'kg', 5, 10, 3], ['Gulab Jamun', 'Milk Sweets', 420, 'kg', 5, 25, 5],
    ['Motichoor Laddu', 'Milk Sweets', 480, 'kg', 5, 20, 5], ['Rasgulla Tin 1 kg', 'Milk Sweets', 380, 'box', 5, 40, 8], ['Jalebi', 'Milk Sweets', 320, 'kg', 5, 2, 3],
    ['Hot Mixture', 'Savouries', 380, 'kg', 12, 30, 6], ['Murukku', 'Savouries', 360, 'kg', 12, 22, 5], ['Banana Chips', 'Savouries', 320, 'kg', 12, 2.5, 4],
    ['Festive Gift Box 500 g', 'Gift Boxes', 450, 'box', 5, 60, 10], ['Soan Papdi Box', 'Gift Boxes', 240, 'box', 5, 45, 10],
  ]);
  const gr = makeShop('grocery', { name: 'Kumar Provision Store', address: '22, Main Bazaar, Madurai – 625001', phone: '9894011223', gstin: '', upi: 'kumarstore@paytm', footer: 'Thank you! Visit again 🙏' }, [
    ['Sona Masoori Rice 25 kg', 'Staples', 1450, 'pc', 5, 20, 5], ['Toor Dal', 'Staples', 165, 'kg', 0, 40, 10], ['Sugar', 'Staples', 46, 'kg', 5, 60, 15], ['Sunflower Oil 1 L', 'Oil & Ghee', 128, 'pc', 5, 48, 12],
    ['Aashirvaad Atta 5 kg', 'Staples', 265, 'pc', 5, 30, 8], ['Tata Salt 1 kg', 'Staples', 28, 'pc', 0, 90, 20], ['Parle-G Biscuits', 'Snacks', 10, 'pc', 18, 150, 30], ['Surf Excel 1 kg', 'Household', 135, 'pc', 18, 24, 6],
  ]);
  [[tx, 11], [sw, 22], [gr, 33]].forEach(([s, seed]) => genHistory(s, 14, seed));
  return { v: 1, lang: 'en', theme: 'light', owner: 'Owner', active: sw.id, shops: [tx, sw, gr] };
}
function load() { try { const x = JSON.parse(localStorage.getItem(KEY)); return x && x.v === 1 && x.shops?.length ? x : null; } catch { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } }
S = load() || seedAll();

const shop = () => S.shops.find(s => s.id === S.active) || S.shops[0];
const prod = (sh, id) => sh.products.find(p => p.id === id);

/* ───────────────────────── ui state ───────────────────────── */
const ui = { shopMenu: false, q: '', cat: 'All', iq: '', ifilter: 'all', icat: 'All', brange: '7', bq: '', modals: [] };
const carts = {}, baskets = {};
const cart = () => carts[shop().id] || (carts[shop().id] = { items: [], dtype: 'flat', dval: '', pay: 'cash', name: '', phone: '' });
const basket = () => baskets[shop().id] || (baskets[shop().id] = []);
const route = () => (location.hash.replace('#/', '') || 'dashboard').split('?')[0];
const go = r => { location.hash = '#/' + r; };

function applyTheme() {
  const T = TYPES[shop().type], dark = S.theme === 'dark', r = document.documentElement;
  r.dataset.theme = S.theme;
  r.style.setProperty('--accent', dark ? T.dark : T.accent);
  r.style.setProperty('--accent-ink', dark ? '#14110C' : '#fff');
  const m = $('meta[name=theme-color]'); if (m) m.content = dark ? '#12110F' : '#F6F1E8';
}

/* ───────────────────────── QR ───────────────────────── */
function qrSVG(text) {
  try { const q = qrcode(0, 'M'); q.addData(String(text)); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }
  catch { return `<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#eee"/></svg>`; }
}
const upiLink = (sh, amt) => `upi://pay?pa=${encodeURIComponent(sh.upi || 'shop@upi')}&pn=${encodeURIComponent(sh.name)}&am=${amt}&cu=INR&tn=${encodeURIComponent('Bill payment')}`;

/* ───────────────────────── feedback: toast, beep ───────────────────────── */
let actx;
function beep(ok = true) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = ok ? 1180 : 220; g.gain.value = .06;
    o.connect(g); g.connect(actx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + (ok ? .12 : .28)); o.stop(actx.currentTime + (ok ? .13 : .3));
  } catch { /* audio unavailable */ }
}
function toast(msg, kind = 'good', action) {
  const el = document.createElement('div'); el.className = 'toast ' + kind;
  el.innerHTML = `${ic(kind === 'good' ? 'check' : 'alert')}<span>${msg}</span>${action ? `<button data-act="toast-act">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { action.fn(); el.remove(); };
  const root = $('#toasts'); root.appendChild(el); while (root.children.length > 3) root.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, action ? 6000 : 2600);
}

/* ───────────────────────── modal system ───────────────────────── */
function openModal({ title, body, footer = '', wide = false, onClose }) {
  const sc = document.createElement('div'); sc.className = 'scrim'; sc.dataset.act = 'scrim';
  sc.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-h"><h3>${title}</h3><button class="iconbtn" data-act="close" aria-label="Close">${ic('x')}</button></div><div class="modal-b">${body}</div>${footer ? `<div class="modal-f">${footer}</div>` : ''}</div>`;
  $('#modal-root').appendChild(sc); ui.modals.push({ el: sc, onClose });
  setTimeout(() => { const f = $('[autofocus],input:not([type=hidden])', sc); f && f.focus && window.innerWidth > 900 && f.focus(); }, 60);
  return sc;
}
function closeModal() {
  const m = ui.modals.pop(); if (!m) return; m.el.remove(); m.onClose && m.onClose();
}
function confirmBox({ title, text, ok = 'Yes', danger }) {
  return new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    const m = openModal({ title, body: `<p style="color:var(--ink-2);font-size:16px">${text}</p>`, footer: `<button class="btn" data-act="close">Cancel</button><button class="btn ${danger ? 'primary' : 'primary'}" id="cf-ok" ${danger ? 'style="background:var(--bad)"' : ''}>${esc(ok)}</button>`, onClose: () => fin(false) });
    $('#cf-ok', m).onclick = () => { fin(true); closeModal(); };
  });
}
function printHTML(html) {
  const root = $('#print-root'); root.innerHTML = html;
  const clean = () => { root.innerHTML = ''; window.removeEventListener('afterprint', clean); };
  window.addEventListener('afterprint', clean); setTimeout(() => window.print(), 80);
}

/* ───────────────────────── receipt ───────────────────────── */
function receiptHTML(b, sh, a4) {
  const T = (v) => inr2(v);
  const rows = b.items.map(i => `<tr><td colspan="2">${esc(i.name)}</td></tr><tr><td style="color:#555">${qf(i.qty)} ${i.unit} × ${T(i.price)}</td><td class="r">${T(i.qty * i.price)}</td></tr>`).join('');
  const tax = b.taxes.filter(x => x.rate > 0).map(x => `<div class="kv"><span>CGST ${x.rate / 2}%</span><span>${T(x.cgst)}</span></div><div class="kv"><span>SGST ${x.rate / 2}%</span><span>${T(x.sgst)}</span></div>`).join('');
  const payL = { cash: 'Cash', upi: 'UPI', card: 'Card' }[b.pay];
  return `<div class="receipt ${a4 ? 'a4' : ''}">
    <div class="stamp">PAID</div>
    <div class="c"><h4>${esc(sh.name)}</h4><div>${esc(sh.address)}</div>${sh.phone ? `<div>Ph: ${esc(sh.phone)}</div>` : ''}${sh.gstin ? `<div>GSTIN: ${esc(sh.gstin)}</div>` : ''}</div>
    <div class="dash"></div><div class="c"><b>${sh.gstin ? 'TAX INVOICE' : 'BILL OF SUPPLY'}</b></div><div class="dash"></div>
    <div class="kv"><span>Bill: <b>${esc(b.no)}</b></span><span>${fdate(b.ts)}</span></div>
    <div class="kv"><span>Pay: ${payL}</span><span>${ftime(b.ts)}</span></div>
    ${b.cust?.name || b.cust?.phone ? `<div>Cust: ${esc(b.cust.name)} ${esc(b.cust.phone)}</div>` : ''}
    <div class="dash"></div>
    <table><thead><tr><th>Item</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="dash"></div>
    <div class="kv"><span>Subtotal (${b.items.length} item${b.items.length > 1 ? 's' : ''})</span><span>${T(b.gross)}</span></div>
    ${b.discount ? `<div class="kv"><span>Discount</span><span>− ${T(b.discount)}</span></div>` : ''}
    ${sh.gstin ? `<div class="kv"><span>Taxable value</span><span>${T(b.taxable)}</span></div>${tax}` : ''}
    ${b.roundOff ? `<div class="kv"><span>Round off</span><span>${b.roundOff > 0 ? '+' : '−'}${T(Math.abs(b.roundOff))}</span></div>` : ''}
    <div class="dash"></div>
    <div class="kv grand"><span>TOTAL</span><span>${inr2(b.total)}</span></div>
    <div class="words">${words(b.total)}</div>
    <div class="dash"></div>
    <div class="c">${esc(sh.footer || '')}</div>
    <div class="upiqr">${qrSVG(b.no)}<small>${esc(b.no)}</small></div>
    <div class="c" style="margin-top:6px;font-size:10px;color:#777">Powered by Deebak Software</div>
  </div>`;
}

function showReceipt(b, fresh) {
  const sh = shop(); let a4 = sh.paper === 'a4';
  const body = () => `${fresh ? `<div class="success-top"><div class="tick">${ic('check')}</div><div><h3>Bill ${esc(b.no)} created</h3><span class="muted">Stock updated automatically · ${inr(b.total)} received by ${b.pay.toUpperCase()}</span></div></div>` : ''}
  <div class="rc-stage"><div class="rc-wrap" id="rc-prev">${receiptHTML(b, sh, a4)}</div>
  <div class="rc-side">
    <button class="btn primary big" id="rc-print">${ic('printer')} Print receipt</button>
    <div class="seg" style="align-self:stretch"><button data-paper="thermal" class="${!a4 ? 'on' : ''}" style="flex:1">Thermal 80 mm</button><button data-paper="a4" class="${a4 ? 'on' : ''}" style="flex:1">A4 Invoice</button></div>
    <button class="btn" id="rc-wa">${ic('send')} Send on WhatsApp</button>
    ${fresh ? `<button class="btn" data-act="close" id="rc-new">${ic('plus')} Start next bill</button>` : `<button class="btn" data-act="close">Close</button>`}
    <p class="muted" style="font-size:12.5px;margin-top:4px">Tip: choose your thermal printer in the print window and set margins to “None”.</p>
  </div></div>`;
  const m = openModal({ title: fresh ? 'Bill ready' : `Bill ${esc(b.no)}`, body: body(), wide: true });
  const wire = () => {
    $('#rc-print', m).onclick = () => printHTML(receiptHTML(b, sh, a4));
    $('#rc-wa', m).onclick = () => {
      const msg = `*${sh.name}*\nBill ${b.no} · ${fdate(b.ts)}\n${b.items.map(i => `• ${i.name} ${qf(i.qty)}${i.unit} — ${inr2(i.qty * i.price)}`).join('\n')}\n\n*Total: ${inr2(b.total)}*\n${sh.footer || 'Thank you!'}`;
      const ph = (b.cust?.phone || '').replace(/\D/g, '');
      window.open(`https://wa.me/${ph ? '91' + ph.slice(-10) : ''}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    };
    $$('[data-paper]', m).forEach(btn => btn.onclick = () => { a4 = btn.dataset.paper === 'a4'; sh.paper = btn.dataset.paper; save(); $('#rc-prev', m).innerHTML = receiptHTML(b, sh, a4); $$('[data-paper]', m).forEach(x => x.classList.toggle('on', x === btn)); });
  };
  wire();
}

/* ───────────────────────── scanning ───────────────────────── */
function findProduct(raw) {
  const sh = shop(), q = raw.trim(); if (!q) return null;
  const lc = q.toLowerCase();
  let p = sh.products.find(p => p.code.toLowerCase() === lc);
  if (!p) { const m = sh.products.filter(p => p.name.toLowerCase().includes(lc)); if (m.length === 1) p = m[0]; }
  return p || null;
}
function flashScanner() { const s = $('.scanner'); if (s) { s.classList.remove('flash'); void s.offsetWidth; s.classList.add('flash'); } }

function handleScan(raw) {
  const r = route(), p = findProduct(raw);
  if (!p) { beep(false); toast(`No item found for “${esc(raw.slice(0, 30))}”`, 'bad', r === 'stock' || r === 'inventory' ? { label: 'Add as new item', fn: () => itemModal(null, raw.trim()) } : undefined); return false; }
  if (r === 'billing') { beep(); flashScanner(); addToCart(p.id, true); }
  else if (r === 'stock') { beep(); flashScanner(); addToBasket(p.id, true); }
  else if (r === 'inventory') { beep(); itemModal(p); }
  else { beep(); go('billing'); setTimeout(() => addToCart(p.id, true), 60); }
  return true;
}
function demoScan() {
  const sh = shop(), r = route();
  const pool = r === 'stock' ? sh.products : sh.products.filter(p => p.stock > 0);
  if (!pool.length) return toast('Add some items first', 'bad');
  handleScan(pool[Math.floor(Math.random() * pool.length)].code);
}

let cam = null;
async function cameraModal() {
  const m = openModal({ title: 'Scan with camera', body: `<div class="cam"><video playsinline muted></video><div class="reticle"></div><div class="msg" id="cam-msg">Starting camera…</div></div><p class="muted" style="margin-top:12px;font-size:13.5px">Hold the item’s QR inside the box. Each scan beeps. You can keep scanning — close this when done.</p>`, onClose: stopCam });
  const video = $('video', m), msg = $('#cam-msg', m);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    video.srcObject = stream; await video.play(); msg.remove();
    const canvas = document.createElement('canvas'), cx = canvas.getContext('2d', { willReadFrequently: true });
    const det = 'BarcodeDetector' in window ? new BarcodeDetector({ formats: ['qr_code'] }) : null;
    let last = '', lastT = 0; cam = { stream, on: true };
    const tick = async () => {
      if (!cam || !cam.on) return;
      try {
        let code = '';
        if (video.readyState >= 2) {
          if (det) { const r = await det.detect(video); code = r[0]?.rawValue || ''; }
          else { canvas.width = video.videoWidth; canvas.height = video.videoHeight; cx.drawImage(video, 0, 0); const d = cx.getImageData(0, 0, canvas.width, canvas.height); code = (window.jsQR && jsQR(d.data, d.width, d.height))?.data || ''; }
        }
        const now = Date.now();
        if (code && (code !== last || now - lastT > 2500)) { last = code; lastT = now; handleScan(code); }
      } catch { /* frame skipped */ }
      setTimeout(tick, 160);
    };
    tick();
  } catch {
    msg.innerHTML = `<div>${ic('camera')}<p style="margin-top:8px"><b>Camera not available</b></p><p style="font-size:13.5px;opacity:.8;margin-top:4px">Allow camera permission in your browser, or use a USB / Bluetooth scanner — it types the code automatically.</p></div>`;
  }
}
function stopCam() { if (cam) { cam.on = false; cam.stream.getTracks().forEach(t => t.stop()); cam = null; } }

/* USB / Bluetooth scanners behave like a very fast keyboard: capture it anywhere on the page */
let wbuf = '', wlast = 0;
document.addEventListener('keydown', e => {
  if (e.key === 'F9') { e.preventDefault(); if (route() === 'billing' && !ui.modals.length) checkout(); return; }
  if (e.key === 'F2') { e.preventDefault(); go('billing'); return; }
  if (e.key === 'Escape') { closeModal(); document.body.classList.remove('cart-open'); return; }
  if (ui.modals.length) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag)) return;
  if (e.key === 'Enter') { if (wbuf.length >= 3) handleScan(wbuf); wbuf = ''; return; }
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { const n = Date.now(); if (n - wlast > 120) wbuf = ''; wbuf += e.key; wlast = n; }
});

/* ───────────────────────── layout: sidebar, topbar, tabbar ───────────────────────── */
const NAV = [['dashboard', 'Home', 'home'], ['billing', 'Billing', 'bag'], ['stock', 'Stock In', 'down'], ['inventory', 'Items', 'box'], ['bills', 'Bills', 'receipt'], ['settings', 'Settings', 'sliders']];

function shopSwitcher() {
  const sh = shop(), T = TYPES[sh.type];
  return `<div class="shopsw"><button class="shopbtn" data-act="shopmenu" aria-haspopup="true" aria-expanded="${ui.shopMenu}"><span class="shop-dot">${ic(T.icon)}</span><span class="t"><b>${esc(sh.name)}</b><span>${T.label} shop</span></span>${ic('chev')}</button>
  ${ui.shopMenu ? `<div class="pop">${S.shops.map(s => `<button data-act="switch" data-id="${s.id}" class="${s.id === sh.id ? 'on' : ''}"><span class="shop-dot" style="width:30px;height:30px">${ic(TYPES[s.type].icon)}</span><span class="grow" style="text-align:left"><b style="font-weight:600">${esc(s.name)}</b><br><small class="muted">${TYPES[s.type].label}</small></span>${s.id === sh.id ? ic('check') : ''}</button>`).join('')}<hr><button data-act="addshop">${ic('plus')} Add another shop</button></div>` : ''}</div>`;
}
function renderChrome() {
  const r = route(), sh = shop();
  $('#side').innerHTML = `<div class="brand"><div class="brand-mark">${LOGO}</div><div><b>Deebak</b><small>Software</small></div></div>
    ${shopSwitcher()}
    <nav class="nav">${NAV.map(([k, l, i]) => `<a href="#/${k}" class="${r === k ? 'on' : ''}">${ic(i)}<span>${t(l)}</span>${k === 'billing' ? '<span class="kbd">F2</span>' : ''}</a>`).join('')}</nav>
    <div class="side-foot"><div class="helpcard"><b>Need help?</b>Scan the QR on any item to add it to the bill. USB scanners work automatically.</div>
    <div class="row" style="justify-content:space-between"><div class="seg"><button data-act="lang" data-v="en" class="${S.lang === 'en' ? 'on' : ''}">EN</button><button data-act="lang" data-v="hi" class="${S.lang === 'hi' ? 'on' : ''}">हिं</button></div>
    <button class="iconbtn" data-act="theme" title="Toggle dark mode">${ic(S.theme === 'dark' ? 'sun' : 'moon')}</button></div></div>`;
  const tabs = [['dashboard', 'Home', 'home'], ['billing', 'Billing', 'bag'], ['stock', 'Stock In', 'down'], ['inventory', 'Items', 'box'], ['bills', 'Bills', 'receipt']];
  $('#tabbar').innerHTML = tabs.map(([k, l, i]) => `<a href="#/${k}" class="${r === k ? 'on' : ''}">${ic(i)}<span>${t(l)}</span></a>`).join('');
}
function renderTop() {
  const r = route(), sh = shop(); const nm = S.owner || 'Owner';
    const info = {
    dashboard: [t('Home'), `${esc(sh.name)} · ${fdate(Date.now())}`],
    billing: [t('New Bill'), 'Scan an item, or tap it below'],
    stock: [t('Stock In'), 'Scan items as they arrive from the supplier'],
    inventory: [t('Items & QR'), `${sh.products.length} items · print QR labels to stick on them`],
    bills: [t('Bills'), 'Every bill you have made — tap one to reprint'],
    settings: [t('Settings'), 'Shop details, receipt and preferences'],
  }[r] || ['', ''];
  $('#top').innerHTML = `<div class="grow"><h1>${info[0]}</h1><div class="sub">${info[1]}</div></div>
    <div class="m-only" style="max-width:44vw">${shopSwitcher()}</div>
    ${r !== 'billing' ? `<a class="btn primary d-only" href="#/billing">${ic('plus')} ${t('New Bill')}</a>` : ''}
    <a class="iconbtn m-only" href="#/settings" aria-label="Settings">${ic('sliders')}</a>`;
}

/* ───────────────────────── views ───────────────────────── */
const V = {};

/* Dashboard */
V.dashboard = () => {
  const sh = shop(), now = Date.now(), nm = S.owner || 'Owner';
  const today = sh.bills.filter(b => sameDay(b.ts, now)), yday = sh.bills.filter(b => sameDay(b.ts, now - 864e5));
  const sum = a => a.reduce((s, b) => s + b.total, 0), ts = sum(today), ys = sum(yday);
  const delta = ys ? Math.round((ts - ys) / ys * 100) : null;
  const low = sh.products.filter(p => p.stock <= p.low).sort((a, b) => a.stock / (a.low || 1) - b.stock / (b.low || 1));
  const days = [...Array(7)].map((_, i) => { const d = new Date(now - (6 - i) * 864e5); return { d, v: sum(sh.bills.filter(b => sameDay(b.ts, d))) }; });
  const mx = Math.max(...days.map(d => d.v), 1);
  const top = {}; sh.bills.filter(b => now - b.ts < 7 * 864e5).forEach(b => b.items.forEach(i => { const k = i.pid; top[k] = top[k] || { name: i.name, v: 0 }; top[k].v += i.qty * i.price; }));
  const tops = Object.values(top).sort((a, b) => b.v - a.v).slice(0, 5), tmx = tops[0]?.v || 1;
  const avg = today.length ? ts / today.length : 0;
  if (!sh.products.length) return `<div class="view"><div class="card empty" style="margin-top:20px"><div class="art">${ic('store')}</div><h4>Welcome to ${esc(sh.name)}</h4><p>Start by adding your items. Scan the QR when stock arrives, and bill in seconds.</p><div class="sp"></div><a class="btn primary big" href="#/stock">${ic('down')} Add first stock</a></div></div>`;
  return `<div class="view">
  <div class="hello"><div class="grow"><h2>${t('Namaste')}, <em>${esc(nm)}</em> 🙏</h2><p>${today.length ? `You have made <b>${today.length} bill${today.length > 1 ? 's' : ''}</b> today.` : 'No bills yet today — let’s get the first one!'}</p></div>
  <a class="btn primary big" href="#/billing">${ic('qr')} ${t('Start billing')}</a></div>
  <div class="kpis">
    <div class="card kpi hero"><div class="k"><i>${ic('trend')}</i>${t("Today's sales")}</div><div class="v num" data-count="${ts}">${inr(0)}</div><div class="d">${delta === null ? 'First day of data' : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs yesterday`}</div></div>
    <div class="card kpi"><div class="k"><i>${ic('receipt')}</i>${t('Bills today')}</div><div class="v num">${today.length}</div><div class="d">${yday.length} yesterday</div></div>
    <div class="card kpi"><div class="k"><i>${ic('tag')}</i>${t('Average bill')}</div><div class="v num">${inr(Math.round(avg))}</div><div class="d">per customer</div></div>
    <div class="card kpi"><div class="k"><i>${ic('alert')}</i>${t('Low stock')}</div><div class="v num" style="${low.length ? 'color:var(--warn)' : ''}">${low.length}</div><div class="d">${low.length ? 'items need restocking' : 'all items well stocked'}</div></div>
  </div>
  <div class="dash2">
    <div class="card"><div class="card-h"><h3>${t('Last 7 days')}</h3><span class="grow"></span><span class="badge accent">${inr(sum(days.map(d => ({ total: d.v }))))}</span></div>
      <div class="card-b"><div class="chart">${days.map((d, i) => `<div class="col ${i === 6 ? 'today' : ''}"><span class="tip">${inr(d.v)}</span><div class="bar" data-h="${Math.max(3, d.v / mx * 100)}" style="height:0"></div><span class="lab">${i === 6 ? 'Today' : d.d.toLocaleDateString('en-IN', { weekday: 'short' })}</span></div>`).join('')}</div></div></div>
    <div class="card"><div class="card-h"><h3>${t('Top sellers')}</h3></div><div class="card-b list">${tops.length ? tops.map(x => `<div class="it"><div class="grow"><div class="row"><b class="grow" style="font-weight:600">${esc(x.name)}</b><span class="num">${inr(Math.round(x.v))}</span></div><div class="meter"><i style="width:${x.v / tmx * 100}%"></i></div></div></div>`).join('') : '<p class="muted">Sales will show up here.</p>'}</div></div>
  </div>
  <div class="dash3">
    <div class="card"><div class="card-h"><h3>${t('Needs restocking')}</h3><span class="grow"></span>${low.length ? `<span class="badge warn">${low.length}</span>` : ''}</div><div class="card-b list">${low.length ? low.slice(0, 5).map(p => `<div class="it">${tile(p, 1)}<div class="grow"><b style="font-weight:600">${esc(p.name)}</b><div class="${p.stock <= 0 ? '' : ''}" style="font-size:12.5px;color:${p.stock <= 0 ? 'var(--bad)' : 'var(--warn)'};font-weight:600">${p.stock <= 0 ? 'Out of stock' : `Only ${qf(p.stock)} ${p.unit} left`}</div></div><button class="btn sm" data-act="restock" data-pid="${p.id}">${ic('plus')} Add stock</button></div>`).join('') : `<div class="empty" style="padding:20px"><div class="art" style="width:56px;height:56px">${ic('check')}</div><h4>All good!</h4><p>Nothing is running low.</p></div>`}</div></div>
    <div class="card"><div class="card-h"><h3>${t('Recent bills')}</h3><span class="grow"></span><a class="btn ghost sm" href="#/bills">View all</a></div><div class="card-b list">${sh.bills.slice(-5).reverse().map(b => `<button class="it" data-act="viewbill" data-id="${b.id}" style="width:100%;text-align:left"><div class="tile sm" style="--tc:var(--accent)">${ic('receipt')}</div><div class="grow"><b style="font-weight:600">${esc(b.no)}</b><div class="muted" style="font-size:12.5px">${ftime(b.ts)} · ${b.items.length} item${b.items.length > 1 ? 's' : ''} · ${b.pay.toUpperCase()}</div></div><b class="num">${inr(b.total)}</b></button>`).join('') || '<p class="muted">No bills yet.</p>'}</div></div>
  </div></div>`;
};
V.dashboard.after = () => {
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.bar').forEach(b => b.style.height = b.dataset.h + '%')));
  $$('[data-count]').forEach(el => { const to = +el.dataset.count, t0 = performance.now(); const step = n => { const k = Math.min(1, (n - t0) / 900); el.textContent = inr(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
};

/* shared scanner card */
const scannerCard = (title, sub) => `<div class="scanner"><div class="scan-frame"><i></i><i></i><i></i><i></i>${ic('qr')}</div>
  <div class="grow"><h3>${title}</h3><p>${sub}</p><div class="row"><div class="scan-in"><input id="scanin" type="text" inputmode="none" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Scan, or type item code / name…" aria-label="Scan or type item code"></div>
  <button class="btn primary" data-act="camera">${ic('camera')} ${t('Camera')}</button><button class="btn" data-act="demo" title="Simulates scanning a random item">${ic('zap')} ${t('Demo scan')}</button></div></div></div>`;

/* Billing */
V.billing = () => {
  const sh = shop(), cats = ['All', ...new Set(sh.products.map(p => p.cat))];
  return `<div class="view bill-layout"><div>
    ${scannerCard(t('Scan item QR'), 'Point the scanner at the item’s QR. It is added to the bill instantly.')}
    <div class="toolbar"><div class="searchbox"><span>${ic('search')}</span><input class="inp" id="pq" placeholder="${t('Search')} items…" value="${esc(ui.q)}" data-in="pq"></div><div class="chips">${cats.map(c => `<button class="chip ${ui.cat === c ? 'on' : ''}" data-act="cat" data-v="${esc(c)}">${c === 'All' ? t('All') : esc(c)}</button>`).join('')}</div></div>
    <div class="pgrid" id="pgrid"></div></div>
    <aside class="cart" id="cart"></aside></div>
    <button class="cartbar hide" id="cartbar" data-act="cartopen">${ic('bag')}<span id="cb-n">0 items</span><b id="cb-t">₹0</b></button>`;
};
V.billing.after = () => { drawGrid(); drawCart(); $('#scanin')?.addEventListener('keydown', scanKey); window.innerWidth > 900 && $('#scanin')?.focus(); };

function scanKey(e) { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value; e.target.value = ''; if (v.trim()) handleScan(v); } }

function pcard(p) {
  const inCart = cart().items.find(i => i.pid === p.id), out = p.stock <= 0, lowS = p.stock <= p.low;
  return `<button class="pcard ${out ? 'out' : ''}" data-act="add" data-pid="${p.id}" ${out ? 'aria-disabled="true"' : ''}>
    ${inCart ? `<span class="qty-badge">${qf(inCart.qty)}</span>` : ''}${tile(p)}<div class="nm">${esc(p.name)}</div>
    <div><div class="pr"><b>${inr(p.price)}</b><span>/ ${p.unit}</span></div><div class="stk" style="color:${out ? 'var(--bad)' : lowS ? 'var(--warn)' : 'var(--ink-3)'}">${out ? 'Out of stock' : lowS ? `Only ${qf(p.stock)} ${p.unit} left` : `${qf(p.stock)} ${p.unit} in stock`}</div></div></button>`;
}
function drawGrid() {
  const g = $('#pgrid'); if (!g) return; const sh = shop(), q = ui.q.toLowerCase();
  const list = sh.products.filter(p => (ui.cat === 'All' || p.cat === ui.cat) && (!q || (p.name + p.code + p.cat).toLowerCase().includes(q)));
  g.innerHTML = list.length ? list.map(pcard).join('') : `<div class="card empty" style="grid-column:1/-1"><div class="art">${ic('box')}</div><h4>${sh.products.length ? 'No items match' : 'No items yet'}</h4><p>${sh.products.length ? 'Try a different search.' : 'Add your first stock to begin billing.'}</p>${sh.products.length ? '' : `<div class="sp"></div><a class="btn primary" href="#/stock">${ic('down')} Add stock</a>`}</div>`;
}
const discAmt = (c, gross) => { const v = parseFloat(c.dval) || 0; return Math.min(gross, c.dtype === 'pct' ? gross * Math.min(v, 100) / 100 : v); };
function totalsOf(c) { const gross = r2(c.items.reduce((s, i) => s + i.qty * i.price, 0)); return calc(c.items, discAmt(c, gross)); }

function drawCart() {
  const el = $('#cart'); if (!el) return; const c = cart(), sh = shop();
  const items = c.items.map(i => { const p = prod(sh, i.pid), st = STEP[i.unit] || 1; return `<div class="ci" data-pid="${i.pid}"><div><div class="n">${esc(i.name)}</div><div class="sub">${inr(i.price)} / ${i.unit}${p && p.stock - i.qty < p.low ? ` · <span style="color:var(--warn)">${qf(Math.max(0, p.stock - i.qty))} left after this</span>` : ''}</div></div><div class="amt num">${inr2(i.qty * i.price)}</div>
    <div class="ctl"><div class="stepper"><button data-act="dec" data-pid="${i.pid}" aria-label="Less">${ic('minus')}</button><input value="${qf(i.qty)}" inputmode="decimal" data-in="qty" data-pid="${i.pid}" aria-label="Quantity"><button data-act="inc" data-pid="${i.pid}" aria-label="More">${ic('plus')}</button></div><span class="muted">${i.unit}</span><span class="grow"></span><button class="iconbtn" data-act="rm" data-pid="${i.pid}" aria-label="Remove">${ic('trash')}</button></div></div>`; }).join('');
  el.innerHTML = `<div class="cart-h"><h3>${t('Current Bill')}</h3><span class="billno">#${TYPES[sh.type].prefix}-${String(sh.seq + 1).padStart(4, '0')}</span><span class="grow"></span>${c.items.length ? `<button class="btn ghost sm" data-act="clear">${ic('trash')} ${t('Clear')}</button>` : ''}<button class="iconbtn m-only" data-act="cartclose" aria-label="Close">${ic('x')}</button></div>
  <div class="cart-items">${items || `<div class="cart-empty"><div class="art">${ic('qr')}</div><b>Bill is empty</b>Scan an item or tap one on the left.</div>`}</div>
  <div class="cart-f">
    <details class="more" ${c.dval || c.name || c.phone ? 'open' : ''}><summary>${ic('plus')} Discount &amp; customer details <span class="muted">(optional)</span></summary>
    <div class="mini"><select class="inp" id="dtype" data-in="dtype" style="width:92px;flex:none"><option value="flat" ${c.dtype === 'flat' ? 'selected' : ''}>₹ off</option><option value="pct" ${c.dtype === 'pct' ? 'selected' : ''}>% off</option></select><input class="inp" id="dval" placeholder="${t('Discount')}" inputmode="decimal" data-in="dval" value="${esc(c.dval)}"></div>
    <div class="mini"><input class="inp" placeholder="Customer name" data-in="cname" value="${esc(c.name)}"><input class="inp" placeholder="Mobile (for WhatsApp)" inputmode="tel" maxlength="10" data-in="cphone" value="${esc(c.phone)}"></div></details>
    <div id="sums"></div>
    <div class="pay">${[['cash', 'Cash', 'cash'], ['upi', 'UPI', 'phone'], ['card', 'Card', 'card']].map(([k, l, i]) => `<button data-act="pay" data-v="${k}" class="${c.pay === k ? 'on' : ''}">${ic(i)}${t(l)}</button>`).join('')}</div>
    <div id="upibox"></div>
    <button class="btn primary big" style="width:100%" data-act="checkout" ${c.items.length ? '' : 'disabled'} id="gen">${ic('receipt')} ${t('Generate Bill')} <span class="kbd" style="background:rgba(255,255,255,.2);color:#fff;border:0">F9</span></button></div>`;
  updateTotals();
}
function updateTotals() {
  const c = cart(), tt = totalsOf(c), sh = shop(); const s = $('#sums'); if (!s) return;
  s.innerHTML = `<div class="sumrow"><span>${t('Subtotal')}</span><b class="num">${inr2(tt.gross)}</b></div>${tt.discount ? `<div class="sumrow"><span>${t('Discount')}</span><b class="num" style="color:var(--good)">− ${inr2(tt.discount)}</b></div>` : ''}${sh.gstin && tt.tax ? `<div class="sumrow"><span>GST included</span><b class="num">${inr2(tt.tax)}</b></div>` : ''}<div class="total"><span>${t('Total')}</span><b class="num">${inr(tt.total)}</b></div>`;
  const ub = $('#upibox');
  if (ub) ub.innerHTML = c.pay === 'upi' && c.items.length ? `<div class="row" style="padding:10px;border:1.5px dashed var(--line-2);border-radius:12px;margin-bottom:12px;background:var(--surface)"><div style="width:76px;height:76px;flex:none;background:#fff;padding:4px;border-radius:8px">${qrSVG(upiLink(sh, tt.total))}</div><div><b>Customer scans to pay</b><div class="muted" style="font-size:12.5px">${inr(tt.total)} → ${esc(sh.upi || 'add UPI ID in Settings')}</div></div></div>` : '';
  const n = c.items.length; $('#cb-n') && ($('#cb-n').textContent = `${n} item${n === 1 ? '' : 's'}`); $('#cb-t') && ($('#cb-t').textContent = inr(tt.total));
  $('#cartbar')?.classList.toggle('hide', !n); const g = $('#gen'); if (g) g.disabled = !n;
}

function addToCart(pid, fromScan) {
  const sh = shop(), p = prod(sh, pid), c = cart(); if (!p) return;
  const ex = c.items.find(i => i.pid === pid), add = ex ? (STEP[p.unit] || 1) : (DEFQ[p.unit] || 1), have = ex ? ex.qty : 0;
  if (p.stock <= 0) { beep(false); return toast(`${esc(p.name)} is out of stock`, 'bad'); }
  if (have + add > p.stock + 1e-9) { beep(false); return toast(`Only ${qf(p.stock)} ${p.unit} of ${esc(p.name)} in stock`, 'bad'); }
  if (ex) ex.qty = r2(ex.qty + add); else c.items.unshift(lineOf(p, add));
  drawCart(); drawGrid();
  const row = $(`.ci[data-pid="${pid}"]`); row && row.classList.add('hl');
  if (fromScan) toast(`${esc(p.name)} added`, 'good');
}
function setQty(pid, q) {
  const c = cart(), i = c.items.find(x => x.pid === pid), p = prod(shop(), pid); if (!i) return;
  if (q <= 0) { c.items = c.items.filter(x => x !== i); }
  else if (p && q > p.stock + 1e-9) { toast(`Only ${qf(p.stock)} ${p.unit} in stock`, 'bad'); i.qty = p.stock; }
  else i.qty = r2(q);
  drawCart(); drawGrid();
}

function checkout() {
  const sh = shop(), c = cart(); if (!c.items.length) return toast('Bill is empty — scan an item first', 'bad');
  if (c.phone && c.phone.replace(/\D/g, '').length !== 10) return toast('Mobile number should be 10 digits', 'bad');
  const tt = totalsOf(c); sh.seq++;
  const b = { id: uid(), no: billNo(sh), ts: Date.now(), items: c.items.map(i => ({ ...i })), ...tt, pay: c.pay, cust: { name: c.name.trim(), phone: c.phone.trim() } };
  b.items.forEach(i => { const p = prod(sh, i.pid); if (p) p.stock = Math.max(0, r2(p.stock - i.qty)); });
  sh.bills.push(b); carts[sh.id] = null; save();
  document.body.classList.remove('cart-open'); beep(); drawCart(); drawGrid();
  showReceipt(b, true);
}

/* Stock In */
V.stock = () => `<div class="view">
  <div class="stepbox"><div class="s"><b>1</b><span><strong>${t('Scan the QR on the item')}</strong>Use the camera or your scanner</span></div><div class="s"><b>2</b><span><strong>${t('Check the quantity')}</strong>Scan again to add one more</span></div><div class="s"><b>3</b><span><strong>${t('Tap Save to stock')}</strong>Items go straight into your stock</span></div></div>
  <div class="two"><div>${scannerCard('Scan to add stock', 'Each scan adds one unit. For loose items like sweets or fabric, type the quantity.')}
    <div class="card" style="margin-top:16px"><div class="card-h"><h3>${t('Items to add')}</h3><span class="grow"></span><button class="btn ghost sm" data-act="newitem">${ic('plus')} New item</button></div><div class="card-b" id="basket"></div></div></div>
  <div class="card"><div class="card-h"><h3>${t('Recently added')}</h3></div><div class="card-b log" id="stocklog"></div></div></div></div>`;
V.stock.after = () => { drawBasket(); drawLog(); $('#scanin')?.addEventListener('keydown', scanKey); window.innerWidth > 900 && $('#scanin')?.focus(); };

function addToBasket(pid, fromScan, qty) {
  const p = prod(shop(), pid), b = basket(); if (!p) return;
  const ex = b.find(x => x.pid === pid), add = qty ?? 1;
  if (ex) ex.qty = r2(ex.qty + add); else b.unshift({ pid, qty: add });
  drawBasket(); if (fromScan) toast(`${esc(p.name)} · +${qf(add)} ${p.unit}`, 'good');
}
function drawBasket() {
  const el = $('#basket'); if (!el) return; const sh = shop(), b = basket();
  if (!b.length) { el.innerHTML = `<div class="empty" style="padding:30px 10px"><div class="art">${ic('qr')}</div><h4>Nothing scanned yet</h4><p>Scan an item’s QR to begin.</p></div>`; return; }
  el.innerHTML = b.map(x => { const p = prod(sh, x.pid); return `<div class="basket-row">${tile(p)}<div class="grow"><b style="font-weight:600">${esc(p.name)}</b><div class="muted" style="font-size:12.5px">Now ${qf(p.stock)} ${p.unit} → <b class="plus">${qf(p.stock + x.qty)} ${p.unit}</b></div></div><div class="stepper"><button data-act="bdec" data-pid="${p.id}">${ic('minus')}</button><input value="${qf(x.qty)}" inputmode="decimal" data-in="bqty" data-pid="${p.id}"><button data-act="binc" data-pid="${p.id}">${ic('plus')}</button></div><button class="iconbtn" data-act="brm" data-pid="${p.id}">${ic('x')}</button></div>`; }).join('') +
    `<div class="sp"></div><button class="btn primary big" style="width:100%" data-act="commitstock">${ic('check')} ${t('Save to stock')} · ${b.length} item${b.length > 1 ? 's' : ''}</button>`;
}
function drawLog() {
  const el = $('#stocklog'); if (!el) return; const L = shop().stockLog.slice(0, 9);
  el.innerHTML = L.length ? L.map(l => `<div class="l"><span class="badge good">+${qf(l.qty)}</span><div class="grow"><b style="font-weight:600">${esc(l.name)}</b><div class="muted" style="font-size:12.5px">${l.unit} · ${fdate(l.ts) === fdate(Date.now()) ? 'Today' : fdate(l.ts)} ${ftime(l.ts)}</div></div></div>`).join('') : '<p class="muted">Stock you add will be listed here.</p>';
}

/* Inventory */
V.inventory = () => {
  const sh = shop(), P = sh.products, low = P.filter(p => p.stock > 0 && p.stock <= p.low).length, out = P.filter(p => p.stock <= 0).length, val = P.reduce((s, p) => s + p.stock * p.price, 0);
  const cats = ['All', ...new Set(P.map(p => p.cat))];
  return `<div class="view"><div class="stats"><div class="stat"><span>Total items</span><b class="num">${P.length}</b></div><div class="stat"><span>Stock value</span><b class="num">${inr(Math.round(val))}</b></div><div class="stat"><span>Low stock</span><b class="num" style="color:var(--warn)">${low}</b></div><div class="stat"><span>Out of stock</span><b class="num" style="color:var(--bad)">${out}</b></div></div>
  <div class="toolbar" style="margin-top:0"><div class="searchbox"><span>${ic('search')}</span><input class="inp" placeholder="${t('Search')} items…" value="${esc(ui.iq)}" data-in="iq"></div>
  <div class="chips">${[['all', 'All'], ['low', 'Low stock'], ['out', 'Out of stock']].map(([k, l]) => `<button class="chip ${ui.ifilter === k ? 'on' : ''}" data-act="ifilter" data-v="${k}">${t(l)}</button>`).join('')}</div>
  <select class="inp" style="width:auto" data-in="icat">${cats.map(c => `<option ${ui.icat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><span class="grow"></span>
  <button class="btn" data-act="allqr">${ic('qr')} Print all QR</button><button class="btn primary" data-act="newitem">${ic('plus')} ${t('Add item')}</button></div>
  <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th class="hide-m">Category</th><th class="r">Price</th><th class="hide-m">GST</th><th>Stock</th><th class="r">QR</th></tr></thead><tbody id="itbody"></tbody></table></div></div></div>`;
};
V.inventory.after = () => drawItems();
function drawItems() {
  const tb = $('#itbody'); if (!tb) return; const q = ui.iq.toLowerCase();
  const L = shop().products.filter(p => (ui.icat === 'All' || p.cat === ui.icat) && (!q || (p.name + p.code).toLowerCase().includes(q)) && (ui.ifilter === 'all' || (ui.ifilter === 'low' ? p.stock > 0 && p.stock <= p.low : p.stock <= 0)));
  tb.innerHTML = L.length ? L.map(p => { const out = p.stock <= 0, lw = p.stock <= p.low, pct = Math.min(100, p.stock / Math.max(p.low * 5, 1) * 100);
    return `<tr class="click" data-act="edit" data-pid="${p.id}"><td><div class="row">${tile(p, 1)}<div><b style="font-weight:600">${esc(p.name)}</b><div class="mono muted" style="font-size:12px">${esc(p.code)}</div></div></div></td><td class="hide-m">${esc(p.cat)}</td><td class="r num"><b>${inr(p.price)}</b><span class="muted"> / ${p.unit}</span></td><td class="hide-m">${p.gst}%</td>
    <td><div class="num"><b>${qf(p.stock)}</b> ${p.unit} ${out ? '<span class="badge bad">Out</span>' : lw ? '<span class="badge warn">Low</span>' : ''}</div><div class="stockbar ${out ? 'out' : lw ? 'low' : ''}"><i style="width:${pct}%"></i></div></td>
    <td class="r"><button class="btn sm" data-act="qr" data-pid="${p.id}">${ic('qr')}<span class="hide-m">Label</span></button></td></tr>`; }).join('')
    : `<tr><td colspan="6"><div class="empty"><div class="art">${ic('box')}</div><h4>${shop().products.length ? 'No items match' : 'No items yet'}</h4><p>${shop().products.length ? 'Change the search or filter.' : 'Add your first item to get started.'}</p></div></td></tr>`;
}

/* Bills */
V.bills = () => {
  const sh = shop(), now = Date.now(), days = ui.brange === 'all' ? 9999 : +ui.brange;
  const q = ui.bq.toLowerCase();
  const L = sh.bills.filter(b => (days === 9999 || (days === 1 ? sameDay(b.ts, now) : now - b.ts < days * 864e5)) && (!q || (b.no + b.cust.name + b.cust.phone).toLowerCase().includes(q))).slice().reverse();
  const tot = L.reduce((s, b) => s + b.total, 0);
  return `<div class="view"><div class="stats"><div class="stat"><span>Sales</span><b class="num">${inr(tot)}</b></div><div class="stat"><span>Bills</span><b class="num">${L.length}</b></div><div class="stat"><span>Average</span><b class="num">${inr(L.length ? Math.round(tot / L.length) : 0)}</b></div></div>
  <div class="toolbar" style="margin-top:0"><div class="searchbox"><span>${ic('search')}</span><input class="inp" placeholder="Bill no. or customer…" value="${esc(ui.bq)}" data-in="bq"></div>
  <div class="chips">${[['1', 'Today'], ['7', 'Last 7 days'], ['14', '14 days'], ['all', 'All']].map(([k, l]) => `<button class="chip ${ui.brange === k ? 'on' : ''}" data-act="brange" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Bill</th><th>Date</th><th class="hide-m">Customer</th><th class="hide-m">Items</th><th>Payment</th><th class="r">Amount</th></tr></thead><tbody id="bbody">${L.slice(0, 80).map(b => `<tr class="click" data-act="viewbill" data-id="${b.id}"><td><b class="mono" style="font-weight:500">${esc(b.no)}</b></td><td>${fdate(b.ts)}<div class="muted" style="font-size:12.5px">${ftime(b.ts)}</div></td><td class="hide-m">${esc(b.cust.name || '—')}<div class="muted" style="font-size:12.5px">${esc(b.cust.phone)}</div></td><td class="hide-m">${b.items.length}</td><td><span class="badge ${b.pay === 'cash' ? '' : 'accent'}">${b.pay.toUpperCase()}</span></td><td class="r num"><b>${inr2(b.total)}</b></td></tr>`).join('') || `<tr><td colspan="6"><div class="empty"><div class="art">${ic('receipt')}</div><h4>No bills found</h4></div></td></tr>`}</tbody></table></div></div></div>`;
};

/* Settings */
V.settings = () => { const sh = shop();
  return `<div class="view" style="max-width:860px"><form id="f-shop" class="card"><div class="card-h"><h3>Shop details</h3><span class="grow"></span><span class="muted" style="font-size:13px">Shown on every bill</span></div><div class="card-b form">
    <div class="field full"><label>Shop name</label><input class="inp" name="name" value="${esc(sh.name)}" required></div>
    <div class="field full"><label>Address</label><input class="inp" name="address" value="${esc(sh.address)}"></div>
    <div class="field"><label>Phone</label><input class="inp" name="phone" inputmode="tel" value="${esc(sh.phone)}"></div>
    <div class="field"><label>GSTIN <span class="muted">(leave empty if not registered)</span></label><input class="inp" name="gstin" maxlength="15" style="text-transform:uppercase" value="${esc(sh.gstin)}"></div>
    <div class="field"><label>UPI ID <span class="muted">(for QR payments)</span></label><input class="inp" name="upi" placeholder="yourshop@bank" value="${esc(sh.upi)}"></div>
    <div class="field"><label>Receipt message</label><input class="inp" name="footer" value="${esc(sh.footer)}"></div>
    <div class="field full row" style="justify-content:flex-end"><button class="btn primary">${ic('check')} Save changes</button></div></div></form>
  <div class="sp"></div><div class="card"><div class="card-h"><h3>Preferences</h3></div><div class="card-b form">
    <div class="field"><label>Your name</label><input class="inp" id="owner" value="${esc(S.owner)}" data-in="owner"></div>
    <div class="field"><label>Language</label><div class="seg" style="align-self:flex-start"><button data-act="lang" data-v="en" class="${S.lang === 'en' ? 'on' : ''}">English</button><button data-act="lang" data-v="hi" class="${S.lang === 'hi' ? 'on' : ''}">हिन्दी</button></div></div>
    <div class="field"><label>Appearance</label><div class="seg" style="align-self:flex-start"><button data-act="themeset" data-v="light" class="${S.theme === 'light' ? 'on' : ''}">Light</button><button data-act="themeset" data-v="dark" class="${S.theme === 'dark' ? 'on' : ''}">Dark</button></div></div>
    <div class="field"><label>Receipt paper</label><div class="seg" style="align-self:flex-start"><button data-act="paper" data-v="thermal" class="${sh.paper !== 'a4' ? 'on' : ''}">Thermal 80 mm</button><button data-act="paper" data-v="a4" class="${sh.paper === 'a4' ? 'on' : ''}">A4</button></div></div></div></div>
  <div class="sp"></div><div class="card"><div class="card-h"><h3>Data</h3></div><div class="card-b row" style="flex-wrap:wrap"><button class="btn" data-act="export">${ic('download')} Download backup</button><button class="btn" data-act="addshop">${ic('store')} Add another shop</button><button class="btn danger" data-act="reset">${ic('trash')} Reset demo data</button></div></div>
  <p class="muted" style="margin:18px 4px;font-size:13px">Deebak Software · demo build — data is stored in this browser only.</p></div>`;
};

/* ───────────────────────── modals: item, QR labels, add shop ───────────────────────── */
function itemModal(p, code) {
  const sh = shop(), T = TYPES[sh.type], isNew = !p;
  const d = p || { name: '', cat: T.cats[0], price: '', unit: T.units[0], gst: 5, stock: '', low: 5, code: code || nextCode(sh) };
  const m = openModal({ title: isNew ? 'Add new item' : 'Edit item', body: `<form id="f-item" class="form" autocomplete="off">
    <div class="field full"><label>Item name</label><input class="inp" name="name" value="${esc(d.name)}" required placeholder="e.g. Kanchipuram Silk Saree"></div>
    <div class="field"><label>Category</label><input class="inp" name="cat" list="catl" value="${esc(d.cat)}"><datalist id="catl">${[...new Set([...T.cats, ...sh.products.map(x => x.cat)])].map(c => `<option>${esc(c)}</option>`).join('')}</datalist></div>
    <div class="field"><label>Sold by</label><select class="inp" name="unit">${Object.entries(UNITS).map(([k, v]) => `<option value="${k}" ${d.unit === k ? 'selected' : ''}>${v}${k === 'kg' ? 's' : ''}</option>`).join('')}</select></div>
    <div class="field"><label>Selling price (₹, with GST)</label><input class="inp" name="price" inputmode="decimal" value="${d.price}" required placeholder="0"></div>
    <div class="field"><label>GST</label><select class="inp" name="gst">${[0, 5, 12, 18, 28].map(g => `<option value="${g}" ${+d.gst === g ? 'selected' : ''}>${g}%</option>`).join('')}</select></div>
    <div class="field"><label>${isNew ? 'Opening stock' : 'Stock in hand'}</label><input class="inp" name="stock" inputmode="decimal" value="${d.stock}" placeholder="0"></div>
    <div class="field"><label>Warn me when below</label><input class="inp" name="low" inputmode="decimal" value="${d.low}"></div>
    <div class="field full"><label>Item code <span class="muted">(this is what the QR contains)</span></label><input class="inp mono" name="code" value="${esc(d.code)}" required></div>
    </form>`,
    footer: `${!isNew ? `<button class="btn danger" data-act="delitem" data-pid="${p.id}" style="margin-right:auto">${ic('trash')} Delete</button><button class="btn" data-act="qr" data-pid="${p.id}">${ic('qr')} QR label</button>` : ''}<button class="btn" data-act="close">${t('Cancel')}</button><button class="btn primary" form="f-item">${ic('check')} ${isNew ? 'Save item' : t('Save')}</button>` });
  $('#f-item', m).onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target), price = parseFloat(f.get('price'));
    if (!(price > 0)) return toast('Please enter a valid price', 'bad');
    const code = f.get('code').trim();
    if (sh.products.some(x => x.code.toLowerCase() === code.toLowerCase() && x !== p)) return toast('This code is already used by another item', 'bad');
    const rec = { name: f.get('name').trim(), cat: f.get('cat').trim() || 'General', unit: f.get('unit'), price, gst: +f.get('gst'), stock: Math.max(0, parseFloat(f.get('stock')) || 0), low: Math.max(0, parseFloat(f.get('low')) || 0), code };
    if (p) Object.assign(p, rec); else { const np = { id: uid(), ...rec }; sh.products.push(np); if (np.stock > 0) sh.stockLog.unshift({ ts: Date.now(), pid: np.id, name: np.name, unit: np.unit, qty: np.stock }); }
    save(); closeModal(); toast(p ? 'Item updated' : 'Item added'); render(true);
  };
}
function qrLabel(p, sh) { return `<div class="lbl-card">${qrSVG(p.code)}<b>${esc(p.name)}</b><div class="c">${esc(p.code)}</div><div class="p">${inr(p.price)} / ${p.unit}</div></div>`; }
function qrModal(p) {
  const sh = shop(); let copies = 1;
  const m = openModal({ title: 'QR label', body: `<div class="row" style="gap:24px;align-items:flex-start;flex-wrap:wrap"><div id="lblprev">${qrLabel(p, sh)}</div><div class="grow" style="min-width:220px"><p style="color:var(--ink-2)">Print this and stick it on the item or its tag. When scanned, <b>${esc(p.name)}</b> is added to the bill or to your stock.</p><div class="sp"></div><div class="field"><label>Number of labels</label><div class="stepper"><button data-act="cdec">${ic('minus')}</button><input id="copies" value="1" inputmode="numeric"><button data-act="cinc">${ic('plus')}</button></div></div></div></div>`, footer: `<button class="btn" data-act="close">Close</button><button class="btn primary" id="lblprint">${ic('printer')} Print labels</button>` });
  const inp = $('#copies', m); const get = () => Math.max(1, Math.min(60, parseInt(inp.value) || 1));
  m.addEventListener('click', e => { const a = e.target.closest('[data-act]')?.dataset.act; if (a === 'cinc') inp.value = get() + 1; if (a === 'cdec') inp.value = Math.max(1, get() - 1); });
  $('#lblprint', m).onclick = () => printHTML(`<div class="lbl-sheet">${qrLabel(p, sh).repeat(get())}</div>`);
}
function allQrModal() {
  const sh = shop(); if (!sh.products.length) return toast('No items yet', 'bad');
  const html = `<div class="lbl-sheet">${sh.products.map(p => qrLabel(p, sh)).join('')}</div>`;
  openModal({ title: `QR labels · ${sh.products.length} items`, wide: true, body: html, footer: `<button class="btn" data-act="close">Close</button><button class="btn primary" id="alprint">${ic('printer')} Print all</button>` });
  $('#alprint').onclick = () => printHTML(html);
}
function addShopModal() {
  ui.shopMenu = false; renderChrome(); renderTop(); let type = 'grocery';
  const m = openModal({ title: 'Add another shop', body: `<p style="color:var(--ink-2);margin-bottom:14px">Run several shops from one login. Each shop has its own stock, bills and QR labels.</p><form id="f-shop2"><div class="field"><label>Shop name</label><input class="inp" name="name" required placeholder="e.g. Ravi Electronics"></div><div class="sp"></div><label class="lbl">What does it sell?</label><div class="typegrid" style="margin-top:8px">${Object.entries(TYPES).map(([k, T]) => `<button type="button" class="typecard ${k === type ? 'on' : ''}" data-type="${k}">${ic(T.icon)}${T.label}</button>`).join('')}</div></form>`, footer: `<button class="btn" data-act="close">${t('Cancel')}</button><button class="btn primary" form="f-shop2">${ic('plus')} Create shop</button>` });
  $$('[data-type]', m).forEach(b => b.onclick = () => { type = b.dataset.type; $$('[data-type]', m).forEach(x => x.classList.toggle('on', x === b)); });
  $('#f-shop2', m).onsubmit = e => { e.preventDefault(); const sh = makeShop(type, { name: new FormData(e.target).get('name').trim(), footer: 'Thank you! Visit again 🙏' }); S.shops.push(sh); S.active = sh.id; save(); closeModal(); applyTheme(); toast(`${esc(sh.name)} is ready`); go('stock'); render(true); };
}

/* ───────────────────────── actions ───────────────────────── */
const A = {
  close: () => closeModal(),
  scrim: (el, e) => { if (e.target === el) closeModal(); },
  shopmenu: () => { ui.shopMenu = !ui.shopMenu; renderChrome(); renderTop(); },
  switch: el => { S.active = el.dataset.id; ui.shopMenu = false; ui.q = ''; ui.cat = 'All'; ui.iq = ''; ui.icat = 'All'; ui.ifilter = 'all'; save(); applyTheme(); render(true); toast(`Switched to ${esc(shop().name)}`); },
  addshop: () => addShopModal(),
  lang: el => { S.lang = el.dataset.v; save(); render(true); },
  theme: () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); render(true); },
  themeset: el => { S.theme = el.dataset.v; save(); applyTheme(); render(true); },
  paper: el => { shop().paper = el.dataset.v; save(); render(true); },
  camera: () => cameraModal(), demo: () => demoScan(),
  cat: el => { ui.cat = el.dataset.v; render(true); },
  add: el => addToCart(el.dataset.pid),
  inc: el => { const i = cart().items.find(x => x.pid === el.dataset.pid); i && setQty(i.pid, i.qty + (STEP[i.unit] || 1)); },
  dec: el => { const i = cart().items.find(x => x.pid === el.dataset.pid); i && setQty(i.pid, i.qty - (STEP[i.unit] || 1)); },
  rm: el => setQty(el.dataset.pid, 0),
  clear: () => { carts[shop().id] = null; drawCart(); drawGrid(); },
  pay: el => { cart().pay = el.dataset.v; $$('.pay button').forEach(b => b.classList.toggle('on', b === el)); updateTotals(); },
  checkout: () => checkout(),
  cartopen: () => document.body.classList.add('cart-open'), cartclose: () => document.body.classList.remove('cart-open'),
  viewbill: el => { const b = shop().bills.find(x => x.id === el.dataset.id); b && showReceipt(b, false); },
  restock: el => { addToBasket(el.dataset.pid, false, 1); go('stock'); },
  binc: el => { const x = basket().find(b => b.pid === el.dataset.pid); x && (x.qty = r2(x.qty + 1), drawBasket()); },
  bdec: el => { const x = basket().find(b => b.pid === el.dataset.pid); if (x) { x.qty = r2(x.qty - 1); if (x.qty <= 0) baskets[shop().id] = basket().filter(b => b !== x); drawBasket(); } },
  brm: el => { baskets[shop().id] = basket().filter(b => b.pid !== el.dataset.pid); drawBasket(); },
  commitstock: () => {
    const sh = shop(), b = basket(); if (!b.length) return;
    b.forEach(x => { const p = prod(sh, x.pid); if (p) { p.stock = r2(p.stock + x.qty); sh.stockLog.unshift({ ts: Date.now(), pid: p.id, name: p.name, unit: p.unit, qty: x.qty }); } });
    const n = b.length; baskets[sh.id] = []; save(); beep(); drawBasket(); drawLog(); toast(`Stock updated for ${n} item${n > 1 ? 's' : ''}`);
  },
  newitem: () => itemModal(null),
  edit: el => itemModal(prod(shop(), el.dataset.pid)),
  qr: (el, e) => { e.stopPropagation(); const p = prod(shop(), el.dataset.pid); p && qrModal(p); },
  allqr: () => allQrModal(),
  delitem: async el => { const sh = shop(), p = prod(sh, el.dataset.pid); if (await confirmBox({ title: 'Delete this item?', text: `“${esc(p.name)}” will be removed from stock. Old bills are not affected.`, ok: 'Delete', danger: true })) { sh.products = sh.products.filter(x => x !== p); save(); while (ui.modals.length) closeModal(); render(true); toast('Item deleted'); } },
  ifilter: el => { ui.ifilter = el.dataset.v; render(true); },
  brange: el => { ui.brange = el.dataset.v; render(true); },
  export: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = `deebak-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); },
  reset: async () => { if (await confirmBox({ title: 'Reset all data?', text: 'This brings back the demo shops and removes everything you added in this browser.', ok: 'Reset', danger: true })) { localStorage.removeItem(KEY); location.hash = '#/dashboard'; location.reload(); } },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) { if (ui.shopMenu && !e.target.closest('.shopsw')) { ui.shopMenu = false; renderChrome(); renderTop(); } return; }
  if (el.classList.contains('scrim') && e.target !== el) return;
  const fn = A[el.dataset.act]; if (fn) fn(el, e);
});
document.addEventListener('input', e => {
  const el = e.target, k = el.dataset?.in; if (!k) return;
  if (k === 'pq') { ui.q = el.value; drawGrid(); }
  else if (k === 'iq') { ui.iq = el.value; drawItems(); }
  else if (k === 'icat') { ui.icat = el.value; drawItems(); }
  else if (k === 'bq') { ui.bq = el.value; const pos = el.selectionStart; render(true); const n = $('[data-in=bq]'); n && (n.focus(), n.setSelectionRange(pos, pos)); }
  else if (k === 'dval') { cart().dval = el.value; updateTotals(); }
  else if (k === 'dtype') { cart().dtype = el.value; updateTotals(); }
  else if (k === 'cname') cart().name = el.value;
  else if (k === 'cphone') { cart().phone = el.value.replace(/\D/g, ''); el.value = cart().phone; }
  else if (k === 'owner') { S.owner = el.value; save(); }
});
document.addEventListener('change', e => {
  const el = e.target, k = el.dataset?.in; if (!k) return;
  if (k === 'qty') setQty(el.dataset.pid, parseFloat(el.value) || 0);
  if (k === 'bqty') { const x = basket().find(b => b.pid === el.dataset.pid), v = parseFloat(el.value); if (x && v > 0) x.qty = r2(v); else if (x) baskets[shop().id] = basket().filter(b => b !== x); drawBasket(); }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'f-shop') {
    e.preventDefault(); const f = new FormData(e.target), sh = shop();
    Object.assign(sh, { name: f.get('name').trim(), address: f.get('address').trim(), phone: f.get('phone').trim(), gstin: f.get('gstin').trim().toUpperCase(), upi: f.get('upi').trim(), footer: f.get('footer').trim() });
    save(); toast('Shop details saved'); renderChrome(); renderTop();
  }
});

/* ───────────────────────── render ───────────────────────── */
function render(soft) {
  const r = V[route()] ? route() : 'dashboard';
  if (!V[route()]) { location.replace('#/dashboard'); }
  applyTheme(); renderChrome(); renderTop();
  const main = $('#main'); main.innerHTML = V[r]();
  if (soft) { const v = $('.view', main); v && (v.style.animation = 'none'); }
  V[r].after && V[r].after();
  if (r !== 'billing') document.body.classList.remove('cart-open');
  document.documentElement.lang = S.lang === 'hi' ? 'hi' : 'en';
  document.title = `${({ dashboard: 'Home', billing: 'Billing', stock: 'Stock In', inventory: 'Items', bills: 'Bills', settings: 'Settings' }[r])} · Deebak Software`;
}
window.addEventListener('hashchange', () => { ui.shopMenu = false; render(); window.scrollTo(0, 0); });
render();
})();
