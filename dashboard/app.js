// SONAR dashboard: renders window.RADAR (written by main.ts beside this folder as ../data.js).
// No fetch, no network: everything on this page comes from the sealed snapshot run.

const R = window.RADAR;

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(v) {
  if (v === null || v === undefined) return '-';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v}`;
}

function pct(v) {
  if (v === null || v === undefined) return '<span>-</span>';
  const p = (v * 100).toFixed(1);
  const cls = v > 0 ? 'up' : v < 0 ? 'down' : '';
  return `<span class="${cls}">${v > 0 ? '+' : ''}${p}%</span>`;
}

function mult(v) {
  return v === null || v === undefined ? '-' : `${Number(v).toFixed(2)}x`;
}

// ---- header ----------------------------------------------------------------

$('subline').textContent =
  `Pre-token protocols ranked by implied launch value, priced from the snapshot's own trading peers. ` +
  `Snapshot as of ${R.as_of} (${R.source}). Model ${R.model_version}; farm plans ${R.farmbook_version}.`;

const stats = [
  [R.scanned_size, 'protocols scanned'],
  [R.pretoken_size, 'record no token'],
  [R.board_size, 'rows ranked'],
  [R.watchlist_size, 'watchlist covered'],
  [R.researched_size, 'researched plans'],
];
$('mastStats').innerHTML = stats.map(([v, label]) => `<div class="stat"><b>${v}</b><span>${label}</span></div>`).join('');

const M = R.model;
$('modelText').textContent =
  `SONAR-2 prices each pre-token protocol at its TVL times its category's median market-cap/TVL multiple, ` +
  `taken from the snapshot's own tokenised protocols (winsorised at the 90th percentile, shrunk toward the ` +
  `global median of ${mult(R.global_multiple)} in log space, K = ${M.shrinkage_k}), then adjusts for 7-day growth ` +
  `(weight ${M.growth_weight}), maturity over ${M.maturity_days} days, and chain reach, with one flat ` +
  `${M.launch_discount} launch discount on every row. No protocol name is special-cased: the same function ` +
  `scores every row, and the ordering reproduces the official snapshot board.`;

const flagCount = R.rows.filter((r) => ['do-not-deposit', 'points-ended', 'already-trading'].includes(r.plan_status)).length;
const livePoints = R.rows.filter((r) => r.plan_status === 'points-live').length;
$('farmbookText').textContent =
  `New in v2: the top of the board was researched by hand on 2026-11-24. ${R.researched_size} rows carry a ` +
  `researched farm plan with an honest status - ${livePoints} with a live points programme, ${flagCount} carrying ` +
  `a safety flag or a correction (an exploited vault, an ended points season, tokens that already trade). ` +
  `Every other row keeps a category-template plan and is labelled as one.`;

// ---- board -----------------------------------------------------------------

let view = 'board';
let selectedSlug = null;

const FLAG_STATUSES = ['do-not-deposit', 'points-ended', 'already-trading'];

function rowMatches(r) {
  const f = $('filter').value;
  if (f === 'researched' && r.farm_source !== 'researched') return false;
  if (f === 'points-live' && r.plan_status !== 'points-live') return false;
  if (f === 'flags' && !FLAG_STATUSES.includes(r.plan_status)) return false;
  if (f === 'yield-only' && r.plan_status !== 'yield-only') return false;
  if (f === 'no-retail-farm' && r.plan_status !== 'no-retail-farm') return false;
  if (f === 'watchlist' && !r.watchlist) return false;
  if (f === 'early' && r.watchlist) return false;
  const q = $('search').value.trim().toLowerCase();
  if (q) {
    const hay = `${r.name} ${r.slug} ${r.category ?? ''} ${r.chains.join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortedRows(rows) {
  const s = $('sort').value;
  const out = [...rows];
  if (s === 'implied') out.sort((a, b) => b.implied_value_usd - a.implied_value_usd);
  else if (s === 'tvl') out.sort((a, b) => b.tvl_usd - a.tvl_usd);
  else if (s === 'growth') out.sort((a, b) => (b.change_7d ?? -Infinity) - (a.change_7d ?? -Infinity));
  else out.sort((a, b) => a.rank - b.rank);
  return out;
}

function badgeFor(r) {
  if (r.farm_source === 'researched') {
    return `<span class="badge ${esc(r.plan_status)}" title="${esc(r.points)}">${esc(r.plan_label)}</span>`;
  }
  return '<span class="badge template">Template plan</span>';
}

function renderBoard() {
  const rows = sortedRows(R.rows.filter(rowMatches));
  $('boardBody').innerHTML = rows
    .map(
      (r) => `<tr data-slug="${esc(r.slug)}" class="${r.slug === selectedSlug ? 'selected' : ''}">
        <td class="num">${r.rank}</td>
        <td><span class="pname">${esc(r.name)}</span>${r.watchlist ? '<span class="badge watch">Watchlist</span>' : ''}
          <span class="pmeta">${esc(r.category ?? 'Uncategorised')} - ${esc(r.chains.join(', ') || 'no chain listed')}</span></td>
        <td class="num">${money(r.tvl_usd)}</td>
        <td class="num">${pct(r.change_7d)}</td>
        <td class="num"><b>${money(r.implied_value_usd)}</b></td>
        <td>${badgeFor(r)}</td>
      </tr>`,
    )
    .join('');
  $('rowCount').textContent = `${rows.length} of ${R.rows.length} board rows shown`;
  for (const tr of $('boardBody').querySelectorAll('tr')) {
    tr.addEventListener('click', () => selectRow(tr.dataset.slug));
  }
}

function renderLive() {
  $('liveBody').innerHTML = R.live
    .map(
      (r) => `<tr>
        <td><span class="pname">${esc(r.name)}</span>
          <span class="pmeta">${esc(r.category ?? 'Uncategorised')} - ${esc(r.chains.join(', ') || 'no chain listed')}</span></td>
        <td class="num">${money(r.mcap_usd)}</td>
        <td class="num">${money(r.tvl_usd)}</td>
        <td class="num">${mult(r.ratio)}</td>
        <td class="num">${pct(r.change_7d)}</td>
      </tr>`,
    )
    .join('');
  $('rowCount').textContent =
    `${R.live.length} already-trading protocols, shown with the market's own values. ` +
    `These are the peers SONAR-2 learns its category multiples from; they are never ranked as launches.`;
}

// ---- detail ----------------------------------------------------------------

function selectRow(slug) {
  selectedSlug = slug;
  const r = R.rows.find((x) => x.slug === slug);
  if (!r) return;
  for (const tr of $('boardBody').querySelectorAll('tr')) tr.classList.toggle('selected', tr.dataset.slug === slug);

  const steps = r.farm_steps.map((s) => `<li>${esc(s)}</li>`).join('');
  let farmHtml;
  if (r.farm_source === 'researched') {
    const noteCls = r.plan_status === 'do-not-deposit' ? 'alert-note' : 'points-note';
    farmHtml = `
      <h3>Farm plan - hand-researched (2026-11-24)</h3>
      <p><span class="badge ${esc(r.plan_status)}">${esc(r.plan_label)}</span></p>
      <div class="${noteCls}">${esc(r.points)}</div>
      <dl class="kv">
        <dt>Where</dt><dd>${esc(r.venue)}</dd>
        <dt>Sensible capital</dt><dd>${esc(r.min_capital)}</dd>
      </dl>
      <ol class="steps">${steps}</ol>
      ${r.risks.length ? `<h3>Risks the research found</h3><ul class="risks">${r.risks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`;
  } else {
    farmHtml = `
      <h3>Farm plan - category template</h3>
      <div class="points-note">This row was not part of the hand-researched batch. Its plan is generated from the ` +
      `protocol's category, chains, TVL and age - a sensible starting routine, not verified research. ` +
      `Check the protocol's own documentation before acting on it.</div>
      <ol class="steps">${steps}</ol>`;
  }

  $('detail').innerHTML = `
    <h2>#${r.rank} ${esc(r.name)}</h2>
    <p class="dmeta">${esc(r.category ?? 'Uncategorised')} - ${esc(r.chains.join(', ') || 'no chain listed')}` +
    `${r.watchlist ? ' - on the house watchlist' : ' - early radar'}${r.age_days !== null ? ` - listed ${r.age_days} days before the snapshot` : ''}</p>
    <dl class="kv">
      <dt>Implied value</dt><dd><b>${money(r.implied_value_usd)}</b></dd>
      <dt>TVL</dt><dd>${money(r.tvl_usd)}</dd>
      <dt>7d change</dt><dd>${pct(r.change_7d)}</dd>
      <dt>Category multiple</dt><dd>${mult(r.comp_multiple)} (${r.comp_peers} peer${r.comp_peers === 1 ? '' : 's'})</dd>
      <dt>Growth multiplier</dt><dd>${mult(r.growth_multiplier)}</dd>
      <dt>Maturity multiplier</dt><dd>${mult(r.maturity_multiplier)}</dd>
      <dt>Reach multiplier</dt><dd>${mult(r.reach_multiplier)}</dd>
      <dt>Launch discount</dt><dd>${M.launch_discount}x</dd>
    </dl>
    ${farmHtml}`;
}

// ---- wiring ----------------------------------------------------------------

function setView(next) {
  view = next;
  $('viewBoard').classList.toggle('active', view === 'board');
  $('viewLive').classList.toggle('active', view === 'live');
  $('board').hidden = view !== 'board';
  $('liveTable').hidden = view !== 'live';
  $('filter').disabled = view !== 'board';
  $('sort').disabled = view !== 'board';
  $('search').disabled = view !== 'board';
  if (view === 'board') renderBoard();
  else renderLive();
}

$('viewBoard').addEventListener('click', () => setView('board'));
$('viewLive').addEventListener('click', () => setView('live'));
$('search').addEventListener('input', renderBoard);
$('filter').addEventListener('change', renderBoard);
$('sort').addEventListener('change', renderBoard);

$('footline').textContent =
  `Implied values are a model, not a prediction: they restate what the snapshot's own market pays for a dollar ` +
  `of TVL in each category. Farm plans are research notes, not financial advice; points programmes change ` +
  `without notice, and two entries here (USDD, Bittensor dTAO) are corrections - their tokens already exist. ` +
  `Always re-check a protocol's official documentation before moving funds.`;

renderBoard();
if (R.rows.length > 0) selectRow(R.rows[0].slug);
