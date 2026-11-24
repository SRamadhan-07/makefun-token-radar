// Launch Radar page: renders window.RADAR (written by main.ts beside this folder as ../data.js).
// Views: the ranked board, one detail view per protocol, and the live-token set the model's
// multiples are learned from. Filters and sorts are shareable: they live in the URL hash.
'use strict';

const R = window.RADAR;
const rows = R.rows;
const bySlug = new Map(rows.map((r) => [r.slug, r]));
const maxImplied = rows.reduce((m, r) => Math.max(m, r.implied_value_usd), 0);

const state = { view: 'board', slug: null, q: '', cat: '', chain: '', watch: false, min: 0, sort: 'rank', dir: 1, all: false };
readHash();

function readHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (h.get('p') && bySlug.has(h.get('p'))) { state.view = 'detail'; state.slug = h.get('p'); }
  if (h.get('view') === 'live') state.view = 'live';
  state.q = h.get('q') || '';
  state.cat = h.get('cat') || '';
  state.chain = h.get('chain') || '';
  state.watch = h.get('watch') === '1';
  state.min = Number(h.get('min') || 0) || 0;
  state.sort = h.get('sort') || 'rank';
  state.dir = h.get('dir') === '-1' ? -1 : 1;
}

function writeHash() {
  const h = new URLSearchParams();
  if (state.view === 'detail') h.set('p', state.slug);
  if (state.view === 'live') h.set('view', 'live');
  if (state.view === 'board') {
    if (state.q) h.set('q', state.q);
    if (state.cat) h.set('cat', state.cat);
    if (state.chain) h.set('chain', state.chain);
    if (state.watch) h.set('watch', '1');
    if (state.min) h.set('min', String(state.min));
    if (state.sort !== 'rank') { h.set('sort', state.sort); if (state.dir === -1) h.set('dir', '-1'); }
  }
  history.replaceState(null, '', `#${h.toString()}`);
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function money(v) {
  if (v === null || v === undefined) return '—';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}
function pct(v) {
  if (v === null || v === undefined) return '<span class="flat">n/a</span>';
  const cls = v > 0.05 ? 'up' : v < -0.05 ? 'down' : 'flat';
  return `<span class="${cls}">${v > 0 ? '+' : ''}${v.toFixed(1)}%</span>`;
}
function ageText(days) {
  if (days === null || days === undefined) return 'unknown';
  if (days >= 730) return `${(days / 365.25).toFixed(1)} yrs`;
  if (days >= 60) return `${Math.round(days / 30.4)} mo`;
  return `${days} d`;
}
const mult = (v) => `×${Number(v).toFixed(3)}`;

function renderStats() {
  const el = document.getElementById('stats');
  const items = [
    [R.scanned_size, 'protocols scanned'],
    [R.pretoken_size, 'record no token'],
    [`${R.watchlist_size}/${R.watchlist_size}`, 'watchlist covered'],
    [R.board_size, 'ranked on board'],
    [R.model_version, `model · ${R.as_of}`],
  ];
  el.innerHTML = items.map(([v, l]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
}

function categories() {
  return [...new Set(rows.map((r) => r.category || 'Uncategorised'))].sort();
}
function chains() {
  const freq = new Map();
  for (const r of rows) for (const c of r.chains) freq.set(c, (freq.get(c) || 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([c]) => c);
}

function filtered() {
  let out = rows.filter((r) =>
    (!state.cat || (r.category || 'Uncategorised') === state.cat) &&
    (!state.chain || r.chains.includes(state.chain)) &&
    (!state.watch || r.watchlist) &&
    r.tvl_usd >= state.min &&
    (!state.q || `${r.name} ${r.slug}`.toLowerCase().includes(state.q.toLowerCase())));
  const key = {
    rank: (r) => r.rank, implied: (r) => r.implied_value_usd, tvl: (r) => r.tvl_usd,
    change: (r) => (r.change_7d === null ? -Infinity : r.change_7d),
    age: (r) => (r.age_days === null ? -1 : r.age_days), comp: (r) => r.comp_multiple,
  }[state.sort] || ((r) => r.rank);
  out = [...out].sort((a, b) => (key(a) - key(b)) * (state.sort === 'rank' ? 1 : -state.dir) || a.rank - b.rank);
  return out;
}

function controlsHTML(active) {
  const catOpts = ['<option value="">All categories</option>', ...categories().map((c) => `<option ${c === state.cat ? 'selected' : ''}>${esc(c)}</option>`)].join('');
  const chainOpts = ['<option value="">All chains</option>', ...chains().map((c) => `<option ${c === state.chain ? 'selected' : ''}>${esc(c)}</option>`)].join('');
  const minOpts = [[0, 'Any TVL'], [5e7, 'TVL ≥ $50M'], [1e8, 'TVL ≥ $100M'], [5e8, 'TVL ≥ $500M'], [1e9, 'TVL ≥ $1B']]
    .map(([v, l]) => `<option value="${v}" ${v === state.min ? 'selected' : ''}>${l}</option>`).join('');
  return `<div class="controls">
    <div class="tabs">
      <button data-view="board" class="${active === 'board' ? 'on' : ''}">Pre-token board</button>
      <button data-view="live" class="${active === 'live' ? 'on' : ''}">Live tokens</button>
    </div>
    <input type="search" id="q" placeholder="Search name or slug…" value="${esc(state.q)}">
    <select id="cat">${catOpts}</select>
    <select id="chain">${chainOpts}</select>
    <select id="min">${minOpts}</select>
    <label class="check"><input type="checkbox" id="watch" ${state.watch ? 'checked' : ''}> Watchlist only</label>
    <span class="count" id="count"></span>
  </div>`;
}

function bindControls() {
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
    state.view = b.dataset.view; state.slug = null; render();
  }));
  const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
  on('q', 'input', (e) => { state.q = e.target.value; state.all = false; updateRows(); });
  on('cat', 'change', (e) => { state.cat = e.target.value; render(); });
  on('chain', 'change', (e) => { state.chain = e.target.value; render(); });
  on('min', 'change', (e) => { state.min = Number(e.target.value); render(); });
  on('watch', 'change', (e) => { state.watch = e.target.checked; render(); });
}

/** Re-render only the board's body rows and count (keeps the search box focused while typing). */
function updateRows() {
  const host = document.createElement('div');
  host.innerHTML = boardHTML();
  const freshBody = host.querySelector('#tbody');
  const freshMore = host.querySelector('.more');
  const tb = document.getElementById('tbody');
  if (tb && freshBody) tb.innerHTML = freshBody.innerHTML;
  const oldMore = document.querySelector('.more');
  if (oldMore && !freshMore) oldMore.remove();
  if (!oldMore && freshMore) document.getElementById('app').appendChild(freshMore);
  const count = document.getElementById('count');
  if (count) count.textContent = `${filtered().length} of ${rows.length} protocols`;
  bindBoard();
  writeHash();
}

function th(label, keyName, title) {
  const sorted = state.sort === keyName;
  const arrow = sorted ? (state.dir === 1 ? ' ↓' : ' ↑') : '';
  return `<th data-sort="${keyName}" class="${sorted ? 'sorted' : ''}" title="${esc(title || '')}">${label}${arrow}</th>`;
}

function boardHTML() {
  const list = filtered();
  const shown = state.all ? list : list.slice(0, 60);
  const body = shown.map((r) => `<tr data-slug="${esc(r.slug)}" class="${r.watchlist ? 'watch' : ''}">
    <td>${r.rank}</td>
    <td class="name"><span class="pname">${esc(r.name)}</span>${r.watchlist ? '<span class="badge">WATCHLIST</span>' : ''}<br><span class="slug">${esc(r.slug)}</span></td>
    <td class="cat">${esc(r.category || 'Uncategorised')}</td>
    <td>${r.chains.length || '—'}</td>
    <td>${money(r.tvl_usd)}</td>
    <td>${pct(r.change_7d)}</td>
    <td>${ageText(r.age_days)}</td>
    <td>${mult(r.comp_multiple)}</td>
    <td class="implied">${money(r.implied_value_usd)}<div class="bar"><i style="width:${Math.max(2, Math.round((r.implied_value_usd / maxImplied) * 100))}%"></i></div></td>
  </tr>`).join('');
  return `${controlsHTML('board')}
  <p class="model-line">Model <code>${esc(R.model_version)}</code>: implied value = TVL × category multiple (median mcap/TVL of the snapshot's own tokenised
  peers, shrunk to the global ×${R.global_multiple.toFixed(3)}) × 7-day growth × maturity × chain reach × 0.85 launch discount.
  Every row records no token on DefiLlama's record; tokens that already trade are on the Live tab, never ranked here.</p>
  <table><thead><tr>
    ${th('#', 'rank')} <th style="text-align:left">Protocol</th> <th>Category</th> <th>Chains</th>
    ${th('TVL', 'tvl')} ${th('7d', 'change')} ${th('Age', 'age')} ${th('Comp ×', 'comp', 'Category multiple from tokenised peers')} ${th('Implied value', 'implied')}
  </tr></thead><tbody id="tbody">${body || '<tr><td colspan="9" class="empty">No protocol matches these filters.</td></tr>'}</tbody></table>
  ${!state.all && list.length > shown.length ? `<button class="more" id="more">Show all ${list.length} rows</button>` : ''}`;
}

function bindBoard() {
  document.querySelectorAll('tbody tr[data-slug]').forEach((tr) => tr.addEventListener('click', () => {
    state.view = 'detail'; state.slug = tr.dataset.slug; render();
  }));
  document.querySelectorAll('thead th[data-sort]').forEach((h) => h.addEventListener('click', () => {
    const k = h.dataset.sort;
    if (state.sort === k && k !== 'rank') state.dir = state.dir === 1 ? -1 : 1;
    else { state.sort = k; state.dir = 1; }
    render();
  }));
  const more = document.getElementById('more');
  if (more) more.addEventListener('click', () => { state.all = true; render(); });
}

function factorRow(label, value, note, frac) {
  return `<tr><td>${label}<br><span class="slug">${note}</span></td>
    <td><div class="fbar"><i style="width:${Math.round(Math.min(1, Math.max(0.02, frac)) * 100)}%"></i></div></td>
    <td class="v">${value}</td></tr>`;
}

function detailHTML(r) {
  const base = r.tvl_usd * r.comp_multiple;
  const why = [];
  why.push(`Ranked #${r.rank} of ${rows.length}. ${r.name} records no token in the snapshot${r.watchlist ? ' and sits on the house watchlist (TVL at or above the $50M floor)' : ''}.`);
  why.push(`Its $${(r.tvl_usd / 1e6).toFixed(1)}M of TVL is priced at the ${esc(r.category || 'Uncategorised')} multiple of ×${r.comp_multiple.toFixed(3)}, the shrunk median of ${r.comp_peers} tokenised peer${r.comp_peers === 1 ? '' : 's'} in the same snapshot.`);
  if (r.change_7d !== null) why.push(`TVL moved ${r.change_7d >= 0 ? 'up' : 'down'} ${Math.abs(r.change_7d).toFixed(1)}% in the last seven days, which the model reads as a ×${r.growth_multiplier.toFixed(3)} momentum factor.`);
  if (r.age_days !== null) why.push(`It has run ${ageText(r.age_days)} with no token recorded (tracked since ${esc(r.listed_at)}), and reaches users on ${r.chains.length} chain${r.chains.length === 1 ? '' : 's'}${r.chains.length ? `: ${esc(r.chains.slice(0, 6).join(', '))}${r.chains.length > 6 ? '…' : ''}` : ''}.`);
  return `<button class="back" id="back">← Back to the board</button>
  <div class="detail-head">
    <div><h2>${esc(r.name)} ${r.watchlist ? '<span class="badge">WATCHLIST</span>' : ''}</h2>
    <p class="sub">${esc(r.category || 'Uncategorised')} · ${esc(r.slug)} · records no token · rank #${r.rank} of ${rows.length}</p></div>
    <div class="big-implied"><b>${money(r.implied_value_usd)}</b><span>implied launch value</span></div>
  </div>
  <div class="grid">
    <section class="card"><h3>How the model prices it</h3>
      <table class="factors">
        ${factorRow('TVL base', money(r.tvl_usd), 'locked value in the snapshot', r.tvl_usd / 6e9)}
        ${factorRow('Category multiple', mult(r.comp_multiple), `${r.comp_peers} tokenised peer${r.comp_peers === 1 ? '' : 's'}, shrunk to global ×${R.global_multiple.toFixed(3)}`, r.comp_multiple / 1.2)}
        ${factorRow('= Priced at peers', money(Math.round(base)), 'TVL × category multiple', base / 2e9)}
        ${factorRow('7-day growth', mult(r.growth_multiplier), r.change_7d === null ? 'no figure reported: no claim made' : `${r.change_7d >= 0 ? '+' : ''}${r.change_7d.toFixed(1)}% TVL in 7 days`, (r.growth_multiplier - 0.7) / 0.9)}
        ${factorRow('Maturity', mult(r.maturity_multiplier), `track record: ${ageText(r.age_days)} pre-token`, (r.maturity_multiplier - 0.78) / 0.22)}
        ${factorRow('Chain reach', mult(r.reach_multiplier), `${r.chains.length} chain${r.chains.length === 1 ? '' : 's'} of distribution`, (r.reach_multiplier - 1) / 0.2)}
        ${factorRow('Launch discount', '×0.850', 'untraded, ungoverned: priced under seasoned peers', 0.85)}
        <tr class="total"><td>Implied value</td><td></td><td class="v">${money(r.implied_value_usd)}</td></tr>
      </table>
      <h3 style="margin-top:18px">The record</h3>
      <dl class="kv">
        <dt>TVL</dt><dd>${money(r.tvl_usd)}</dd>
        <dt>7-day change</dt><dd>${r.change_7d === null ? 'not reported' : `${r.change_7d.toFixed(2)}%`}</dd>
        <dt>Tracked since</dt><dd>${esc(r.listed_at || 'not reported')}</dd>
        <dt>Chains</dt><dd>${esc(r.chains.join(', ') || 'none named')}</dd>
        <dt>Watchlist</dt><dd>${r.watchlist ? 'yes — above the $50M floor' : 'no — an early catch below the floor'}</dd>
      </dl>
      <h3 style="margin-top:18px">Why this rank</h3>
      <p class="why">${why.join(' ')}</p>
    </section>
    <section class="card"><h3>Farm plan — do these, in order</h3>
      <ol class="steps">${r.farm_steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    </section>
  </div>`;
}

function liveHTML() {
  const body = R.live.map((p, i) => `<tr>
    <td>${i + 1}</td>
    <td class="name"><span class="pname">${esc(p.name)}</span><br><span class="slug">${esc(p.slug)}</span></td>
    <td class="cat">${esc(p.category || 'Uncategorised')}</td>
    <td>${p.chains.length || '—'}</td>
    <td>${money(p.tvl_usd)}</td>
    <td>${pct(p.change_7d)}</td>
    <td>${p.ratio === null ? '—' : mult(p.ratio)}</td>
    <td class="implied">${money(p.mcap_usd)}</td>
  </tr>`).join('');
  return `${controlsHTML('live')}
  <p class="model-line">These protocols already trade, so the radar never ranks them: it learns from them.
  Their market cap ÷ TVL ratios, grouped by category, are the multiples that price the pre-token board.</p>
  <table><thead><tr><th>#</th><th>Protocol</th><th>Category</th><th>Chains</th><th>TVL</th><th>7d</th><th>mcap/TVL</th><th>Market cap</th></tr></thead>
  <tbody>${body}</tbody></table>`;
}

function renderMethod() {
  const m = R.model;
  document.getElementById('method').innerHTML = `
  <h3>The model, in full (${esc(R.model_version)})</h3>
  <p>For every protocol that already trades, the snapshot gives a market cap and a TVL. Their ratio is what the market pays
  for a dollar of locked value in that kind of protocol. Each ratio is first winsorised at the snapshot's own 90th percentile,
  so a single peer priced on hype instead of TVL cannot price a whole category. <code>compMult(category)</code> is the median of that ratio over the
  category's tokenised peers, shrunk toward the global median (×${R.global_multiple.toFixed(3)}) in log space with ${m.shrinkage_k} pseudo-peers of weight,
  so a category with two peers cannot shout down one with forty, and one hot peer cannot price a category past the field. A pre-token protocol is priced as
  <code>implied = TVL × compMult × growth × maturity × reach × ${m.launch_discount}</code>, where growth is
  <code>1 + ${m.growth_weight} × clamp(change_7d, ${m.growth_floor}, ${m.growth_cap}) / 100</code> (no reported change: no adjustment),
  maturity runs from ${m.maturity_floor} to ${(m.maturity_floor + m.maturity_range).toFixed(2)} over ${m.maturity_days} days of pre-token track record,
  and reach adds ${m.reach_per_chain} per extra chain up to ${m.reach_max_extra}. The launch discount is one constant for every row:
  an unissued token has no liquidity yet, so it is priced under its seasoned peers. Nothing is keyed to a protocol's name;
  the same code prices a protocol the snapshot has never seen.</p>
  <h3>Reading the board honestly</h3>
  <p>DefiLlama's record is not proof: a row says the protocol <em>records</em> no token, never that it has none. An implied value is
  this model's claim about what a launch would be worth if the record stayed as it is — not a prediction that a token will
  be issued, or when. Snapshot: DefiLlama protocols, fetched ${esc(R.as_of)}; ${R.scanned_size} protocols at or above $5M TVL,
  ${R.pretoken_size} of them recording no token, ${R.watchlist_size} on the watchlist at the $${(R.floor_usd / 1e6).toFixed(0)}M floor,
  ${R.board_size} ranked here after setting aside exchange listings, versioned pools, and wrapped, staked or bridged
  products of protocols that already trade — a wrapper records no token of its own, but it is not a launch waiting to happen.</p>`;
}

function render() {
  renderStats();
  const app = document.getElementById('app');
  app.setAttribute('aria-busy', 'false');
  if (state.view === 'detail' && state.slug && bySlug.has(state.slug)) {
    app.innerHTML = detailHTML(bySlug.get(state.slug));
    document.getElementById('back').addEventListener('click', () => { state.view = 'board'; state.slug = null; render(); });
  } else if (state.view === 'live') {
    app.innerHTML = liveHTML();
    bindControls();
  } else {
    state.view = 'board';
    app.innerHTML = boardHTML();
    bindControls();
    bindBoard();
    const count = document.getElementById('count');
    if (count) count.textContent = `${filtered().length} of ${rows.length} protocols`;
  }
  renderMethod();
  writeHash();
  window.scrollTo(0, 0);
}

render();
