// ── THABAT HOLDING PORTAL — APP LOGIC ──
// No credentials here. Auth handled by config.js + Web Crypto API.

// ── RATE LIMITER ──
const _rl = { attempts:0, lockedUntil:0 };

async function _sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function _pbkdf2(pw, saltHex, iter, len) {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h=>parseInt(h,16)));
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:iter,hash:'SHA-512'}, km, len*8);
  return Array.from(new Uint8Array(bits)).map(x=>x.toString(16).padStart(2,'0')).join('');
}

// ── SESSION ──
let _session = null;

async function doLogin() {
  const now = Date.now();
  if (now < _rl.lockedUntil) { showLoginErr('Too many attempts. Wait '+Math.ceil((_rl.lockedUntil-now)/1000)+'s.'); return; }
  if (!window.__AUTH) { showLoginErr('Auth config missing. Contact admin.'); return; }
  const u = document.getElementById('f-user').value.trim().toLowerCase();
  const p = document.getElementById('f-pass').value;
  if (!u||!p) { showLoginErr('Enter username and password.'); return; }
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  document.getElementById('login-loading').style.display = 'block';
  document.getElementById('login-error').style.display = 'none';
  try {
    const uHash = await _sha256(u);
    const idx = window.__AUTH.lookup[uHash];
    if (idx===undefined) throw new Error();
    const e = window.__AUTH.entries[idx];
    const computed = await _pbkdf2(p, e.s, 100000, 64);
    if (computed!==e.h) throw new Error();
    _rl.attempts = 0;
    document.getElementById('login-loading').style.display = 'none';
    bootApp({n:e.n, r:e.r, i:e.i, p:e.p, t:e.t, admin:e.admin||false});
  } catch(_) {
    _rl.attempts++;
    document.getElementById('login-loading').style.display = 'none';
    btn.disabled = false;
    if (_rl.attempts>=5) { _rl.lockedUntil=Date.now()+30000; _rl.attempts=0; showLoginErr('Locked 30s — too many attempts.'); }
    else showLoginErr('Invalid credentials. '+(5-_rl.attempts)+' attempt(s) left.');
  }
}

function showLoginErr(m) {
  const e=document.getElementById('login-error'); e.textContent=m; e.style.display='block';
  document.getElementById('login-btn').disabled=false;
  document.getElementById('login-loading').style.display='none';
}

['f-user','f-pass'].forEach(id=>document.getElementById(id).addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();}));

function bootApp(user) {
  _session = user;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  // Set user info
  ['sb-avatar','profile-avatar'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=user.i; });
  ['sb-name','profile-name'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=user.n; });
  ['sb-role','profile-role'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=user.r; });
  const pt=document.getElementById('profile-tag'); if(pt) pt.textContent=user.t;
  const pp=document.getElementById('prof-pct'); if(pp) pp.textContent=user.p+'%';
  const wn=document.getElementById('welcome-name'); if(wn) wn.textContent='Welcome, '+user.n.split(' ')[0];
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-SA',{year:'numeric',month:'long',day:'numeric'});
  // Show/hide admin nav
  const adminNav = document.getElementById('admin-nav-section');
  if (adminNav) adminNav.style.display = user.admin ? 'block' : 'none';
  // Render all pages
  renderDashboard();
  renderPortfolio();
  renderRealEstate();
  renderOwnership();
  renderTimeline();
  if (user.admin) renderAdminUsers();
  // Show dashboard
  showPage('dashboard', document.querySelector('.nav-item'));
}

function doLogout() {
  _session = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  ['f-user','f-pass'].forEach(id=>document.getElementById(id).value='');
  ['login-error','login-loading'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('login-btn').disabled = false;
}

// ── NAVIGATION ──
const _titles = {
  dashboard:'Dashboard', portfolio:'Portfolio & Investments', realestate:'Real Estate',
  ownership:'Ownership Structure', timeline:'Thabat Journey', documents:'Documents',
  search:'Search Results', admin:'Admin Panel', profile:'My Profile'
};

function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg = document.getElementById('page-'+id);
  if (pg) pg.classList.add('active');
  document.getElementById('page-title').textContent = _titles[id]||id;
  if (el) el.classList.add('active');
}

// ── FORMATTING ──
function fmtSAR(n) {
  if (!n && n!==0) return '—';
  if (n>=1e9) return 'SAR '+(n/1e9).toFixed(2)+'B';
  if (n>=1e6) return 'SAR '+(n/1e6).toFixed(2)+'M';
  if (n>=1e3) return 'SAR '+(n/1e3).toFixed(0)+'K';
  return 'SAR '+n.toLocaleString();
}
function fmtNum(n) { if(!n&&n!==0) return '—'; return n.toLocaleString(); }
function pct(n) { if(!n&&n!==0) return '—'; return n+'%'; }
function sectorColor(s) {
  const map={
    'Retail':'#1A7A4A','VC & Fund':'#1A5FA8','SAAS':'#6B4FA8',
    'Logistics & Distribution':'#C45E00','Education':'#0A7A72',
    'Hospitality':'#2E86AB','Entertainment':'#C0392B',
    'Real Estate':'#B8860B','Modern Construction':'#888'
  };
  return map[s]||'#555';
}

// ── RENDER DASHBOARD ──
function renderDashboard() {
  const D = window.__DATA;
  const s = D.stats;
  function setEl(id,v){ const e=document.getElementById(id); if(e) e.textContent=v; }
  setEl('stat-portfolio-fv', fmtSAR(s.totalPortfolioFV));
  setEl('stat-companies', D.companies.length);
  setEl('stat-re', D.realEstate.filter(r=>r.status!='cancelled').length);
  setEl('stat-re-val', fmtSAR(s.totalRealEstateVal));
  setEl('stat-dividends', fmtSAR(s.totalDividends));
  setEl('stat-geo', D.geoPresence.length+' countries');
  setEl('stat-employees', '+'+s.employees.toLocaleString());
  setEl('stat-clients', '+'+s.clients.toLocaleString());
  setEl('stat-stores', '+'+s.retailStores);
  setEl('stat-founded', s.founded);
  // Sector donut
  renderSectorChart();
  // Top performers
  renderTopPerformers();
}

function renderSectorChart() {
  const D = window.__DATA;
  const container = document.getElementById('sector-legend');
  if (!container) return;
  container.innerHTML = D.sectorAllocation.map(s=>`
    <div class="legend-row">
      <span class="legend-dot" style="background:${s.color}"></span>
      <span class="legend-name">${s.sector}</span>
      <span class="legend-pct">${s.pct}%</span>
    </div>`).join('');
  // SVG donut
  const svg = document.getElementById('sector-svg');
  if (!svg) return;
  let cumPct = 0;
  const cx=80, cy=80, r=60, stroke=22;
  const circumference = 2*Math.PI*r;
  let paths = '';
  D.sectorAllocation.forEach(s=>{
    const dashArr = (s.pct/100)*circumference;
    const offset = circumference - (cumPct/100)*circumference;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${dashArr} ${circumference-dashArr}" stroke-dashoffset="${offset}" transform="rotate(-90 ${cx} ${cy})" opacity="0.9"/>`;
    cumPct += s.pct;
  });
  svg.innerHTML = paths + `<text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="10" fill="#6B6B63" font-family="Geist,sans-serif">Total</text><text x="${cx}" y="${cy+10}" text-anchor="middle" font-size="14" fill="#1A1A18" font-weight="600" font-family="Geist,sans-serif">100%</text>`;
}

function renderTopPerformers() {
  const container = document.getElementById('top-performers');
  if (!container) return;
  const D = window.__DATA;
  const sorted = [...D.companies].filter(c=>c.fvMarket&&c.cumInv).sort((a,b)=>(b.fvMarket/b.cumInv)-(a.fvMarket/a.cumInv)).slice(0,5);
  container.innerHTML = sorted.map(c=>{
    const color = sectorColor(c.sector);
    const barPct = Math.min(100, (c.fvMarket / (sorted[0].fvMarket||1))*100);
    return `<div class="alloc-row">
      <div class="alloc-color" style="background:${color}"></div>
      <div class="alloc-name">${c.name}</div>
      <div class="alloc-bar-wrap"><div class="alloc-bar-bg"><div class="alloc-bar-fill" style="width:${barPct}%;background:${color}"></div></div></div>
      <div class="alloc-amount">${fmtSAR(c.fvMarket)}</div>
    </div>`;
  }).join('');
}

// ── RENDER PORTFOLIO ──
function renderPortfolio(filter) {
  const D = window.__DATA;
  let companies = [...D.companies];
  // Sector filter
  const sf = document.getElementById('sector-filter');
  if (sf && sf.value) companies = companies.filter(c=>c.sector===sf.value);
  // Geo filter
  const gf = document.getElementById('geo-filter');
  if (gf && gf.value) companies = companies.filter(c=>c.geo===gf.value);
  // Search
  const sq = document.getElementById('portfolio-search');
  if (sq && sq.value) {
    const q = sq.value.toLowerCase();
    companies = companies.filter(c=>c.name.toLowerCase().includes(q)||c.sector.toLowerCase().includes(q));
  }
  // Shareholder filter
  const shf = document.getElementById('sh-filter');
  // Shareholder filter applies to all (Thabat owns all directly, so all apply)

  const tbody = document.getElementById('portfolio-tbody');
  if (!tbody) return;

  // Totals
  let totalCum=0, totalFV=0, totalDiv=0;
  companies.forEach(c=>{ totalCum+=(c.cumInv||0); totalFV+=(c.fvMarket||0); totalDiv+=(c.dividends||0); });

  tbody.innerHTML = companies.map(c=>{
    const color = sectorColor(c.sector);
    const gain = c.unrealized;
    const gainClass = gain>0?'pos':gain<0?'neg':'';
    const gainStr = gain!=null ? (gain>0?'+':'')+fmtSAR(gain) : '—';
    return `<tr onclick="openEntityDetail('company','${c.id}')">
      <td><div class="co-cell"><div class="co-icon" style="background:${color}20;color:${color};font-size:11px;font-weight:700">${c.name.substring(0,2).toUpperCase()}</div><div><div class="co-name">${c.name}</div><div class="co-type">${c.sector}</div></div></div></td>
      <td><span class="geo-tag">${c.geo}</span></td>
      <td>${c.year}</td>
      <td><strong>${c.ownership!=null?c.ownership+'%':'—'}</strong></td>
      <td>${fmtSAR(c.cumInv)}</td>
      <td>${fmtSAR(c.fvMarket)}</td>
      <td>${c.moic||'—'}</td>
      <td class="${gainClass}">${gainStr}</td>
      <td>${fmtSAR(c.dividends)}</td>
      <td><span class="status-pill ${c.status}">${c.status}</span></td>
    </tr>`;
  }).join('') +
  `<tr class="total-row">
    <td colspan="4"><strong>Total</strong></td>
    <td><strong>${fmtSAR(totalCum)}</strong></td>
    <td><strong>${fmtSAR(totalFV)}</strong></td>
    <td colspan="2"></td>
    <td><strong>${fmtSAR(totalDiv)}</strong></td>
    <td></td>
  </tr>`;
}

// ── RENDER REAL ESTATE ──
function renderRealEstate() {
  const D = window.__DATA;
  const ksa = D.realEstate.filter(r=>r.details.includes('KSA')||r.details.includes('Riyadh')||r.details.includes('Khobar'));
  const outside = D.realEstate.filter(r=>!r.details.includes('KSA')&&!r.details.includes('Riyadh')&&!r.details.includes('Khobar'));

  function buildTable(arr, showRent) {
    return arr.map(r=>{
      const cancelled = r.status==='cancelled';
      return `<tr onclick="openEntityDetail('realestate','${r.id}')" ${cancelled?'style="opacity:0.5"':''}>
        <td>${r.accXero}</td>
        <td><div class="co-name" ${cancelled?'style="text-decoration:line-through"':''}>${r.name}</div><div class="co-type">${r.details}</div></td>
        <td>${r.date}</td>
        <td>${fmtSAR(r.costAmt)}</td>
        <td>${fmtSAR(r.valuation)}</td>
        ${showRent?`<td>${r.rent?fmtSAR(r.rent):'—'}</td>`:''}
        <td>${r.share}%</td>
        <td>${r.space}</td>
        <td><span class="status-pill ${r.status}">${r.status}</span></td>
      </tr>`;
    }).join('');
  }

  let ksaCost=0, ksaVal=0, outCost=0, outVal=0, outRent=0;
  ksa.forEach(r=>{ksaCost+=r.costAmt||0; ksaVal+=r.valuation||0;});
  outside.forEach(r=>{outCost+=r.costAmt||0; outVal+=r.valuation||0; outRent+=r.rent||0;});

  const ksaTable = document.getElementById('re-ksa-tbody');
  if (ksaTable) ksaTable.innerHTML = buildTable(ksa,false) +
    `<tr class="total-row"><td colspan="3"><strong>Total</strong></td><td><strong>${fmtSAR(ksaCost)}</strong></td><td><strong>${fmtSAR(ksaVal)}</strong></td><td colspan="3"></td></tr>`;

  const outTable = document.getElementById('re-out-tbody');
  if (outTable) outTable.innerHTML = buildTable(outside,true) +
    `<tr class="total-row"><td colspan="2"><strong>Total</strong></td><td></td><td><strong>${fmtSAR(outCost)}</strong></td><td><strong>${fmtSAR(outVal)}</strong></td><td><strong>${fmtSAR(outRent)}</strong></td><td colspan="2"></td></tr>`;

  const grandRow = document.getElementById('re-grand-total');
  if (grandRow) grandRow.innerHTML =
    `<td colspan="3"><strong>Total Current</strong></td><td><strong>${fmtSAR(ksaCost+outCost)}</strong></td><td><strong>${fmtSAR(ksaVal+outVal)}</strong></td><td><strong>${fmtSAR(outRent)}</strong></td><td colspan="2"></td>`;
}

// ── RENDER OWNERSHIP ──
function renderOwnership(filterShId) {
  const D = window.__DATA;
  const container = document.getElementById('ownership-content');
  if (!container) return;

  // Shareholder cards
  const shCards = D.shareholders.map(sh => {
    const isFiltered = filterShId && filterShId!=='all' && sh.id!==filterShId;
    return `<div class="shareholder-card ${isFiltered?'dimmed':''} ${filterShId===sh.id?'highlighted':''}" onclick="filterBySharehiolder('${sh.id}')">
      <div class="sh-avatar">${sh.initials}</div>
      <div class="sh-name">${sh.name}</div>
      <div class="sh-pct">${sh.pct}%</div>
      <div class="sh-label">${sh.role}</div>
    </div>`;
  }).join('');

  // If a shareholder is selected, show their breakdown
  let breakdownHtml = '';
  if (filterShId && filterShId!=='all') {
    const sh = D.shareholders.find(s=>s.id===filterShId);
    if (sh) {
      const topCompanies = D.companies.filter(c=>c.fvMarket).sort((a,b)=>b.fvMarket-a.fvMarket).slice(0,5);
      const effectiveOwnership = topCompanies.map(c=>({
        ...c,
        effectivePct: c.ownership ? ((sh.pct/100)*(c.ownership/100)*100).toFixed(3) : null,
        effectiveFV: c.fvMarket ? ((sh.pct/100)*c.fvMarket) : null
      }));
      breakdownHtml = `
        <div class="breakdown-panel">
          <div class="breakdown-header">
            <div class="breakdown-avatar">${sh.initials}</div>
            <div>
              <div class="breakdown-name">${sh.name}</div>
              <div class="breakdown-sub">${sh.pct}% of Thabat Holding · ${sh.role}</div>
            </div>
            <button class="clear-filter-btn" onclick="filterBySharehiolder('all')">✕ Clear Filter</button>
          </div>
          <div class="breakdown-metrics">
            <div class="breakdown-metric"><div class="bm-label">Effective share of top FV</div><div class="bm-value">${fmtSAR(effectiveOwnership.reduce((a,c)=>a+(c.effectiveFV||0),0))}</div></div>
            <div class="breakdown-metric"><div class="bm-label">Ownership in Thabat</div><div class="bm-value">${sh.pct}%</div></div>
            <div class="breakdown-metric"><div class="bm-label">Total investments</div><div class="bm-value">${D.companies.length}</div></div>
          </div>
          <div class="breakdown-table-wrap">
            <table class="data-table">
              <thead><tr><th>Investment</th><th>Sector</th><th>Thabat Ownership</th><th>${sh.name.split(' ')[0]}'s Effective %</th><th>Fair Value (Market)</th><th>Effective Value</th></tr></thead>
              <tbody>${effectiveOwnership.map(c=>`<tr>
                <td><div class="co-name">${c.name}</div></td>
                <td>${c.sector}</td>
                <td>${c.ownership!=null?c.ownership+'%':'—'}</td>
                <td><strong>${c.effectivePct!=null?c.effectivePct+'%':'—'}</strong></td>
                <td>${fmtSAR(c.fvMarket)}</td>
                <td class="pos">${fmtSAR(c.effectiveFV)}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>`;
    }
  }

  container.innerHTML = `
    <div class="metric-section-label">SHAREHOLDER STRUCTURE — ALMUNIF FAMILY</div>
    <div class="shareholders-grid">${shCards}</div>
    <div class="filter-hint" id="filter-hint" style="display:${filterShId&&filterShId!=='all'?'none':'flex'}">
      <span>💡</span> Click any shareholder card to see their investment breakdown
    </div>
    ${breakdownHtml}
    <div class="ownership-tree-container">
      <div class="tree-title">Thabat Holding — Investment Structure</div>
      ${buildOwnershipSVG()}
    </div>`;
}

function filterBySharehiolder(shId) {
  renderOwnership(shId==='all' ? null : shId);
}

function buildOwnershipSVG() {
  return `<svg class="tree-svg" viewBox="0 0 1000 300" xmlns="http://www.w3.org/2000/svg" style="font-family:'Geist',sans-serif">
    <rect x="380" y="10" width="240" height="50" rx="8" fill="#1A1A18"/>
    <text x="500" y="31" text-anchor="middle" fill="#F7F6F2" font-size="13" font-weight="600">⬡ Thabat Holding</text>
    <text x="500" y="49" text-anchor="middle" fill="rgba(247,246,242,0.5)" font-size="10">Holding Company · Since 1998</text>
    <line x1="500" y1="60" x2="500" y2="90" stroke="#D4D1C8" stroke-width="1.5"/>
    <line x1="100" y1="90" x2="900" y2="90" stroke="#D4D1C8" stroke-width="1.5"/>
    ${[
      {x:100,label:'Anoosh',sub:'Direct · 70%',color:'#1A7A4A'},
      {x:240,label:'9 Round',sub:'Direct · 47.95%',color:'#1A7A4A'},
      {x:380,label:'Seedra Fund I',sub:'Fund · 21.08%',color:'#1A5FA8'},
      {x:520,label:'Seedra Fund II',sub:'Fund · 3.84%',color:'#1A5FA8'},
      {x:660,label:'Real Estate',sub:'6 assets',color:'#B8860B'},
      {x:800,label:'Companies',sub:'14 more',color:'#6B4FA8'},
    ].map(n=>`
      <line x1="${n.x+60}" y1="90" x2="${n.x+60}" y2="110" stroke="#D4D1C8" stroke-width="1.5"/>
      <rect x="${n.x}" y="110" width="120" height="44" rx="7" fill="white" stroke="#E5E3DC" stroke-width="1.5"/>
      <text x="${n.x+60}" y="129" text-anchor="middle" fill="#1A1A18" font-size="10.5" font-weight="500">${n.label}</text>
      <text x="${n.x+60}" y="144" text-anchor="middle" fill="${n.color}" font-size="9">${n.sub}</text>
    `).join('')}
  </svg>`;
}

// ── RENDER TIMELINE ──
function renderTimeline() {
  const D = window.__DATA;
  const container = document.getElementById('timeline-content');
  if (!container) return;
  const years = [...new Set(D.timeline.map(t=>t.year))].sort();
  const minY = years[0], maxY = years[years.length-1];

  container.innerHTML = `
    <div class="timeline-wrap">
      <div class="timeline-line"></div>
      ${years.map(yr=>{
        const companies = D.timeline.filter(t=>t.year===yr);
        const pct = ((yr-minY)/(maxY-minY))*100;
        return `<div class="timeline-point" style="left:${pct}%">
          <div class="timeline-dot"></div>
          <div class="timeline-year">${yr}</div>
          <div class="timeline-companies">${companies.map(c=>`<div class="timeline-company">${c.company}</div>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="timeline-stats">
      <div class="ts-item"><span class="ts-num">1998</span><span class="ts-lbl">Founded</span></div>
      <div class="ts-item"><span class="ts-num">+700</span><span class="ts-lbl">Employees</span></div>
      <div class="ts-item"><span class="ts-num">+130</span><span class="ts-lbl">Retail Stores</span></div>
      <div class="ts-item"><span class="ts-num">+20K</span><span class="ts-lbl">Clients</span></div>
      <div class="ts-item"><span class="ts-num">+40</span><span class="ts-lbl">Investments</span></div>
      <div class="ts-item"><span class="ts-num">8</span><span class="ts-lbl">Countries</span></div>
    </div>`;
}

// ── GLOBAL SEARCH ──
function doSearch(q) {
  if (!q||q.trim().length<2) return;
  const D = window.__DATA;
  q = q.toLowerCase();
  const results = [];
  D.companies.forEach(c=>{
    if (c.name.toLowerCase().includes(q)||c.sector.toLowerCase().includes(q)||c.geo.toLowerCase().includes(q))
      results.push({type:'Company',icon:'🏢',name:c.name,sub:c.sector+' · '+c.geo+' · '+c.ownership+'%',id:c.id,entity:'company'});
  });
  D.realEstate.forEach(r=>{
    if (r.name.toLowerCase().includes(q)||r.details.toLowerCase().includes(q))
      results.push({type:'Real Estate',icon:'🏠',name:r.name,sub:r.details+' · '+r.share+'%',id:r.id,entity:'realestate'});
  });
  D.shareholders.forEach(s=>{
    if (s.name.toLowerCase().includes(q))
      results.push({type:'Shareholder',icon:'👤',name:s.name,sub:s.role+' · '+s.pct+'%',id:s.id,entity:'shareholder'});
  });
  D.sectorAllocation.forEach(s=>{
    if (s.sector.toLowerCase().includes(q))
      results.push({type:'Sector',icon:'📊',name:s.sector,sub:s.pct+'% of portfolio',id:null,entity:'sector'});
  });
  showSearchResults(q, results);
}

function showSearchResults(q, results) {
  showPage('search', null);
  const container = document.getElementById('search-results-content');
  if (!container) return;
  if (results.length===0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No results for "${q}"</div><div class="empty-sub">Try searching for a company name, sector, or shareholder</div></div>`;
    return;
  }
  const grouped = {};
  results.forEach(r=>{ if(!grouped[r.type]) grouped[r.type]=[]; grouped[r.type].push(r); });
  container.innerHTML = `<div class="search-meta">${results.length} result${results.length!==1?'s':''} for "<strong>${q}</strong>"</div>` +
    Object.entries(grouped).map(([type,items])=>`
      <div class="search-group">
        <div class="search-group-label">${type}</div>
        ${items.map(item=>`
          <div class="search-result-item" onclick="openEntityDetail('${item.entity}','${item.id||''}')">
            <div class="sri-icon">${item.icon}</div>
            <div><div class="sri-name">${item.name}</div><div class="sri-sub">${item.sub}</div></div>
            <div class="sri-arrow">→</div>
          </div>`).join('')}
      </div>`).join('');
}

// ── ENTITY DETAIL MODAL ──
function openEntityDetail(type, id) {
  const D = window.__DATA;
  let entity, html = '';
  if (type==='company') {
    entity = D.companies.find(c=>c.id===id);
    if (!entity) return;
    const docs = (D.documents||[]).filter(d=>d.entityId===id);
    html = `
      <div class="modal-entity-header">
        <div class="modal-entity-icon" style="background:${sectorColor(entity.sector)}20;color:${sectorColor(entity.sector)}">${entity.name.substring(0,2).toUpperCase()}</div>
        <div><div class="modal-entity-name">${entity.name}</div><div class="modal-entity-sub">${entity.sector} · ${entity.geo} · Since ${entity.year}</div></div>
        <span class="status-pill ${entity.status}">${entity.status}</span>
      </div>
      <div class="modal-metrics">
        <div class="mm-item"><div class="mm-label">Ownership</div><div class="mm-val">${entity.ownership!=null?entity.ownership+'%':'—'}</div></div>
        <div class="mm-item"><div class="mm-label">Cumulative Inv.</div><div class="mm-val">${fmtSAR(entity.cumInv)}</div></div>
        <div class="mm-item"><div class="mm-label">Fair Value (Market)</div><div class="mm-val">${fmtSAR(entity.fvMarket)}</div></div>
        <div class="mm-item"><div class="mm-label">MOIC</div><div class="mm-val">${entity.moic||'—'}</div></div>
        <div class="mm-item"><div class="mm-label">Unrealized G/L</div><div class="mm-val ${(entity.unrealized||0)>=0?'pos':'neg'}">${entity.unrealized!=null?(entity.unrealized>=0?'+':'')+fmtSAR(entity.unrealized):'—'}</div></div>
        <div class="mm-item"><div class="mm-label">Dividends</div><div class="mm-val">${fmtSAR(entity.dividends)}</div></div>
      </div>
      <div class="modal-docs-section">
        <div class="modal-section-title">Documents <button class="upload-doc-btn" onclick="openUploadDoc('${id}','company')">+ Upload</button></div>
        ${docs.length===0?'<div class="no-docs">No documents uploaded yet. Click + Upload to add files.</div>':
          docs.map(d=>`<div class="doc-item"><div class="doc-icon">📄</div><div><div class="doc-name">${d.name}</div><div class="doc-meta">${d.type} · ${d.date}</div></div></div>`).join('')}
      </div>`;
  } else if (type==='realestate') {
    entity = D.realEstate.find(r=>r.id===id);
    if (!entity) return;
    const docs = (D.documents||[]).filter(d=>d.entityId===id);
    html = `
      <div class="modal-entity-header">
        <div class="modal-entity-icon" style="background:#B8860B20;color:#B8860B">RE</div>
        <div><div class="modal-entity-name">${entity.name}</div><div class="modal-entity-sub">${entity.details} · ${entity.date}</div></div>
        <span class="status-pill ${entity.status}">${entity.status}</span>
      </div>
      <div class="modal-metrics">
        <div class="mm-item"><div class="mm-label">Acc. Xero</div><div class="mm-val">${entity.accXero}</div></div>
        <div class="mm-item"><div class="mm-label">Cost Amount</div><div class="mm-val">${fmtSAR(entity.costAmt)}</div></div>
        <div class="mm-item"><div class="mm-label">Valuation</div><div class="mm-val">${fmtSAR(entity.valuation)}</div></div>
        <div class="mm-item"><div class="mm-label">Share</div><div class="mm-val">${entity.share}%</div></div>
        <div class="mm-item"><div class="mm-label">Space</div><div class="mm-val">${entity.space}</div></div>
        ${entity.rent?`<div class="mm-item"><div class="mm-label">Annual Rent</div><div class="mm-val">${fmtSAR(entity.rent)}</div></div>`:''}
      </div>
      <div class="modal-docs-section">
        <div class="modal-section-title">Documents <button class="upload-doc-btn" onclick="openUploadDoc('${id}','realestate')">+ Upload</button></div>
        ${docs.length===0?'<div class="no-docs">No documents uploaded yet.</div>':
          docs.map(d=>`<div class="doc-item"><div class="doc-icon">📄</div><div><div class="doc-name">${d.name}</div><div class="doc-meta">${d.type} · ${d.date}</div></div></div>`).join('')}
      </div>`;
  } else if (type==='shareholder') {
    const sh = D.shareholders.find(s=>s.id===id);
    if (!sh) return;
    const docs = (D.documents||[]).filter(d=>d.entityId===id);
    html = `
      <div class="modal-entity-header">
        <div class="modal-entity-icon" style="background:#1A1A1820;color:#1A1A18;font-size:18px;font-weight:700">${sh.initials}</div>
        <div><div class="modal-entity-name">${sh.name}</div><div class="modal-entity-sub">${sh.role}</div></div>
      </div>
      <div class="modal-metrics">
        <div class="mm-item"><div class="mm-label">Ownership</div><div class="mm-val">${sh.pct}%</div></div>
        <div class="mm-item"><div class="mm-label">Role</div><div class="mm-val">${sh.role}</div></div>
      </div>
      <div class="modal-docs-section">
        <div class="modal-section-title">Documents (ID, Passport, etc.) <button class="upload-doc-btn" onclick="openUploadDoc('${id}','shareholder')">+ Upload</button></div>
        ${docs.length===0?'<div class="no-docs">No documents uploaded yet. Click + Upload to add ID, Passport, etc.</div>':
          docs.map(d=>`<div class="doc-item"><div class="doc-icon">📄</div><div><div class="doc-name">${d.name}</div><div class="doc-meta">${d.type} · ${d.date}</div></div></div>`).join('')}
      </div>`;
  }
  const modal = document.getElementById('entity-modal');
  const body = document.getElementById('entity-modal-body');
  if (modal && body) { body.innerHTML = html; modal.classList.add('open'); }
}

function closeEntityModal() {
  document.getElementById('entity-modal').classList.remove('open');
}

// ── FILE UPLOAD ──
function openUploadDoc(entityId, entityType) {
  closeEntityModal();
  const modal = document.getElementById('upload-modal');
  const form = document.getElementById('upload-form');
  if (!modal||!form) return;
  form.innerHTML = `
    <div class="form-field"><label>Entity</label><input type="text" value="${entityType} / ${entityId}" disabled style="background:var(--surface-2);color:var(--ink-dim)"/></div>
    <input type="hidden" id="upload-entity-id" value="${entityId}"/>
    <input type="hidden" id="upload-entity-type" value="${entityType}"/>
    <div class="form-field"><label>Document Type</label>
      <select id="upload-doc-type" style="width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--surface-2);font-family:'Geist',sans-serif;font-size:14px;color:var(--ink);outline:none">
        <option>National ID</option><option>Passport</option><option>Commercial Registration (CR)</option>
        <option>Articles of Association (AOA)</option><option>Share Certificate</option>
        <option>Investment Agreement</option><option>Financial Statement</option>
        <option>Property Deed</option><option>Other</option>
      </select>
    </div>
    <div class="form-field"><label>File Name / Description</label><input type="text" id="upload-doc-name" placeholder="e.g. Abdullah Passport 2024"/></div>
    <div class="upload-drop-zone" id="upload-drop-zone">
      <div class="udz-icon">📁</div>
      <div class="udz-text">Click to select file or drag & drop</div>
      <div class="udz-sub">PDF, JPG, PNG, DOCX supported</div>
      <input type="file" id="upload-file-input" style="position:absolute;inset:0;opacity:0;cursor:pointer" accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"/>
    </div>
    <div id="upload-file-selected" style="display:none;padding:8px 12px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:8px;font-size:13px;color:var(--green);margin-top:8px"></div>`;

  document.getElementById('upload-file-input').addEventListener('change', function() {
    const f = this.files[0];
    if (f) {
      document.getElementById('upload-file-selected').style.display='block';
      document.getElementById('upload-file-selected').textContent='✓ Selected: '+f.name+' ('+Math.round(f.size/1024)+'KB)';
    }
  });
  modal.classList.add('open');
}

function submitUpload() {
  const entityId = document.getElementById('upload-entity-id').value;
  const entityType = document.getElementById('upload-entity-type').value;
  const docType = document.getElementById('upload-doc-type').value;
  const docName = document.getElementById('upload-doc-name').value || docType;
  const fileInput = document.getElementById('upload-file-input');
  if (!fileInput.files[0]) { alert('Please select a file first.'); return; }
  const file = fileInput.files[0];
  // Store in __DATA.documents (in-memory — in production this would go to a server)
  if (!window.__DATA.documents) window.__DATA.documents = [];
  window.__DATA.documents.push({
    id: 'doc_'+Date.now(),
    entityId, entityType,
    name: docName,
    type: docType,
    filename: file.name,
    size: file.size,
    date: new Date().toLocaleDateString('en-SA',{year:'numeric',month:'short',day:'numeric'}),
    uploadedBy: _session?.n || 'Admin'
  });
  closeUploadModal();
  // Refresh documents page
  renderDocumentsPage();
  alert('✓ Document "'+docName+'" uploaded successfully.');
}

function closeUploadModal() { document.getElementById('upload-modal').classList.remove('open'); }

function renderDocumentsPage() {
  const D = window.__DATA;
  const container = document.getElementById('documents-content');
  if (!container) return;
  const docs = D.documents||[];
  if (docs.length===0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📂</div><div class="empty-title">No documents uploaded yet</div><div class="empty-sub">Open any investment, real estate asset, or shareholder to upload documents.</div></div>`;
    return;
  }
  const grouped = {};
  docs.forEach(d=>{ if(!grouped[d.entityType]) grouped[d.entityType]=[]; grouped[d.entityType].push(d); });
  container.innerHTML = Object.entries(grouped).map(([type,items])=>`
    <div class="metric-section-label">${type.toUpperCase()}</div>
    <div class="doc-grid">${items.map(d=>`
      <div class="doc-item">
        <div class="doc-icon">📄</div>
        <div><div class="doc-name">${d.name}</div><div class="doc-meta">${d.type} · ${d.date} · ${d.uploadedBy}</div></div>
      </div>`).join('')}</div>`).join('');
}

// ── ADMIN — USER MANAGEMENT ──
function renderAdminUsers() {
  const container = document.getElementById('admin-users-content');
  if (!container) return;
  const entries = window.__AUTH?.entries||[];
  container.innerHTML = `
    <div class="admin-user-list">
      ${entries.map((e,i)=>`
        <div class="admin-user-row">
          <div class="au-avatar">${e.i}</div>
          <div class="au-info">
            <div class="au-name">${e.n}</div>
            <div class="au-role">${e.r} ${e.admin?'· <span style="color:var(--gold)">Admin</span>':''}</div>
          </div>
          <div class="au-pct">${e.p}%</div>
          <div class="au-actions">
            <button class="au-btn" onclick="openEditUser(${i})">Edit</button>
          </div>
        </div>`).join('')}
    </div>
    <button class="add-entity-btn" onclick="openAddUser()" style="margin-top:16px">+ Add New User</button>`;
}

function openEditUser(idx) {
  const e = window.__AUTH.entries[idx];
  showModal('edit-user-modal');
  document.getElementById('edit-user-name').value = e.n;
  document.getElementById('edit-user-role').value = e.r;
  document.getElementById('edit-user-pct').value = e.p;
  document.getElementById('edit-user-idx').value = idx;
}

function openAddUser() { showModal('add-user-modal'); }

function showModal(id) {
  document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('open'));
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('open'));
}

// ── ADD INVESTMENT ──
function openAddInvestment() {
  document.getElementById('add-investment-modal').classList.add('open');
}

function submitAddInvestment() {
  const D = window.__DATA;
  const name = document.getElementById('ai-name').value.trim();
  const sector = document.getElementById('ai-sector').value;
  const geo = document.getElementById('ai-geo').value.trim()||'KSA';
  const year = parseInt(document.getElementById('ai-year').value)||new Date().getFullYear();
  const ownership = parseFloat(document.getElementById('ai-ownership').value)||null;
  const cumInv = parseFloat(document.getElementById('ai-cuminv').value.replace(/,/g,''))||null;
  const fvMarket = parseFloat(document.getElementById('ai-fv').value.replace(/,/g,''))||null;
  if (!name) { alert('Company name is required.'); return; }
  D.companies.push({
    id:'c'+(D.companies.length+1)+'_'+Date.now(),
    name, sector, geo, year, ownership, cumInv, fvMarket,
    fvCharter:null, moic:null, unrealized:null, dividends:0, status:'active'
  });
  document.getElementById('add-investment-modal').classList.remove('open');
  renderPortfolio();
  renderDashboard();
  alert('✓ '+name+' added to portfolio.');
}

// ── ADD REAL ESTATE ──
function openAddRealEstate() { document.getElementById('add-re-modal').classList.add('open'); }

function submitAddRealEstate() {
  const D = window.__DATA;
  const name = document.getElementById('are-name').value.trim();
  const details = document.getElementById('are-details').value.trim();
  const share = parseFloat(document.getElementById('are-share').value)||0;
  const costAmt = parseFloat(document.getElementById('are-cost').value.replace(/,/g,''))||0;
  const valuation = parseFloat(document.getElementById('are-val').value.replace(/,/g,''))||0;
  const space = document.getElementById('are-space').value.trim()||'—';
  if (!name) { alert('Name is required.'); return; }
  D.realEstate.push({
    id:'re'+(D.realEstate.length+1)+'_'+Date.now(),
    accXero:'NEW', name, details, date:new Date().toLocaleDateString('en-SA',{month:'short',year:'2-digit'}),
    costAmt, valuation, rent:null, share, space, status:'active'
  });
  document.getElementById('add-re-modal').classList.remove('open');
  renderRealEstate();
  alert('✓ Real estate asset added.');
}

// ── SEARCH BAR ──
let _searchTimeout;
function onSearchInput(e) {
  clearTimeout(_searchTimeout);
  const q = e.target.value.trim();
  if (q.length<2) { hideSearchDropdown(); return; }
  _searchTimeout = setTimeout(()=>showSearchDropdown(q), 200);
}

function showSearchDropdown(q) {
  const D = window.__DATA;
  const dd = document.getElementById('search-dropdown');
  if (!dd) return;
  const results = [];
  D.companies.forEach(c=>{ if(c.name.toLowerCase().includes(q.toLowerCase())) results.push({icon:'🏢',label:c.name,sub:c.sector,id:c.id,type:'company'}); });
  D.realEstate.forEach(r=>{ if(r.name.toLowerCase().includes(q.toLowerCase())) results.push({icon:'🏠',label:r.name,sub:r.details,id:r.id,type:'realestate'}); });
  D.shareholders.forEach(s=>{ if(s.name.toLowerCase().includes(q.toLowerCase())) results.push({icon:'👤',label:s.name,sub:s.role,id:s.id,type:'shareholder'}); });
  if (results.length===0) { dd.innerHTML='<div class="sd-empty">No results found</div>'; dd.style.display='block'; return; }
  dd.innerHTML = results.slice(0,8).map(r=>`
    <div class="sd-item" onclick="openEntityDetail('${r.type}','${r.id}');hideSearchDropdown()">
      <span class="sd-icon">${r.icon}</span>
      <span class="sd-label">${r.label}</span>
      <span class="sd-sub">${r.sub}</span>
    </div>`).join('') +
    (results.length>8?`<div class="sd-more" onclick="doSearch('${q}');hideSearchDropdown()">View all ${results.length} results →</div>`:'');
  dd.style.display='block';
}

function hideSearchDropdown() {
  const dd = document.getElementById('search-dropdown');
  if (dd) dd.style.display='none';
}

document.addEventListener('click', e=>{
  if (!e.target.closest('.search-wrap')) hideSearchDropdown();
});

function onSearchKeydown(e) {
  if (e.key==='Enter') { doSearch(e.target.value); hideSearchDropdown(); }
}
