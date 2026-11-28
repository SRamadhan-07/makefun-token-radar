// SONAR-3 dashboard: sortable, filterable board + per-protocol detail view.
// Data arrives as window.RADAR from data.js, written by main.ts beside this
// page. No network, no framework, no fetch.
(function () {
  var D = window.RADAR, rows = D.rows, meta = D.meta;
  var state = { filter: 'all', q: '', key: 'rank', dir: 1 };
  var $ = function (id) { return document.getElementById(id); };

  function money(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
    return '$' + n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var FILTERS = [
    ['all', 'All'], ['watchlist', 'Watchlist'], ['early', 'Early'],
    ['researched', 'Researched'], ['points-live', 'Points live'],
    ['yield-only', 'Yield only'], ['no-retail-farm', 'No retail farm'],
    ['already-trading', 'Already trading'], ['safety', 'Safety flags'],
  ];
  function passes(r, f) {
    if (f === 'all') return true;
    if (f === 'watchlist') return r.watchlist;
    if (f === 'early') return !r.watchlist;
    if (f === 'researched') return r.farm.source === 'researched';
    if (f === 'safety') return r.farm.safety;
    return r.farm.status === f;
  }
  function buildFilters() {
    $('filters').innerHTML = FILTERS.map(function (f) {
      var n = rows.filter(function (r) { return passes(r, f[0]); }).length;
      return '<button data-f="' + f[0] + '"' + (state.filter === f[0] ? ' class="on"' : '') +
        '>' + f[1] + ' <b>' + n + '</b></button>';
    }).join('');
    Array.prototype.forEach.call($('filters').children, function (b) {
      b.onclick = function () { state.filter = b.getAttribute('data-f'); buildFilters(); render(); };
    });
  }

  function visible() {
    var q = state.q.toLowerCase();
    var out = rows.filter(function (r) {
      return passes(r, state.filter) && (!q ||
        r.name.toLowerCase().indexOf(q) >= 0 || r.slug.indexOf(q) >= 0 ||
        (r.category || '').toLowerCase().indexOf(q) >= 0);
    });
    var k = state.key, d = state.dir;
    out.sort(function (a, b) {
      var x = a[k], y = b[k];
      if (x == null) return 1; if (y == null) return -1;
      return (typeof x === 'string' ? (x < y ? -1 : x > y ? 1 : 0) : x - y) * d;
    });
    return out;
  }

  function render() {
    var out = visible();
    $('count').textContent = out.length + ' of ' + rows.length + ' protocols';
    $('rows').innerHTML = out.map(function (r) {
      var g = r.change_7d == null ? '—' : (r.change_7d >= 0 ? '+' : '') + r.change_7d.toFixed(1) + '%';
      var badge = '<span class="badge ' + r.farm.status + (r.farm.safety ? ' safety' : '') +
        '" title="' + esc(r.farm.verdict) + '">' + r.farm.status + '</span>';
      return '<tr data-slug="' + r.slug + '"><td>' + r.rank + '</td><td>' + esc(r.name) +
        (r.watchlist ? ' <span class="wl">WATCHLIST</span>' : '') +
        (r.token_status === 'already-trading' ? ' <span class="wl">TOKEN TRADES</span>' : '') +
        '</td><td>' + esc(r.category || '—') + '</td><td class="num">' + money(r.tvl_usd) +
        '</td><td class="num">' + g + '</td><td class="num">' + money(r.implied_value_usd) +
        ' <span class="range">' + money(r.implied_low_usd) + '–' + money(r.implied_high_usd) + '</span></td>' +
        '<td class="conf ' + r.confidence + '">' + r.confidence + '</td><td>' + badge + '</td></tr>';
    }).join('');
    Array.prototype.forEach.call($('rows').children, function (tr) {
      tr.onclick = function () { showDetail(tr.getAttribute('data-slug')); };
    });
  }

  function showDetail(slug) {
    var r = null;
    rows.forEach(function (x) { if (x.slug === slug) r = x; });
    if (!r) return;
    var m = r.model, f = r.farm;
    var water = '<div class="water">' +
      '<span class="step">TVL ' + money(r.tvl_usd) + '</span><span class="op">×</span>' +
      '<span class="step">multiple ' + m.multiple.toFixed(3) + ' (peers ' + m.peers + ')</span><span class="op">×</span>' +
      '<span class="step">growth ' + m.growth_factor.toFixed(3) + '</span><span class="op">×</span>' +
      '<span class="step">maturity ' + m.maturity_factor.toFixed(3) + ' (' + m.days_listed + 'd tokenless)</span><span class="op">×</span>' +
      '<span class="step">discount 0.85</span><span class="op">=</span>' +
      '<span class="step final">' + money(r.implied_value_usd) + '</span></div>';
    var prov = '<p><span class="tag">snapshot</span>TVL, 7d change, listed_at, category ' +
      '<span class="tag">derived</span>multiple, factors, range, confidence ' +
      '<span class="tag">' + (f.source === 'researched' ? 'researched' : 'template') + '</span>farm plan</p>';
    var alert = f.safety ? '<p class="alert">SAFETY FLAG — read the verdict and risks before any deposit.</p>' : '';
    var risks = f.risks.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var steps = r.farm_steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    $('detail').innerHTML =
      '<button class="back" id="back">← Board</button>' +
      '<h2>#' + r.rank + ' ' + esc(r.name) + '</h2>' +
      '<div>' + esc(r.category || 'Uncategorised') + ' · ' + esc(r.chains.join(', ')) +
      ' · token status: ' + r.token_status + ' · confidence <span class="conf ' + r.confidence + '">' + r.confidence + '</span></div>' +
      water + prov + alert +
      '<p>Value range (category p25–p75 multiples): ' + money(r.implied_low_usd) + ' – ' + money(r.implied_high_usd) + '</p>' +
      '<div class="cols"><div><h3>Farm plan — ' + f.status + (f.source === 'template' ? ' (template plan)' : '') + '</h3>' +
      '<p>' + esc(f.verdict) + '</p><p><b>Venue:</b> ' + esc(f.venue) + '<br><b>Capital:</b> ' + esc(f.capital) +
      '<br><b>Total cost:</b> ' + esc(f.total_cost) + '<br><b>Total time:</b> ' + esc(f.total_time) + '</p>' +
      '<ol class="steps">' + steps + '</ol></div>' +
      '<div><h3>Risks</h3><ul class="risks">' + risks + '</ul></div></div>';
    $('detail').hidden = false;
    $('boardwrap').hidden = true;
    $('back').onclick = function () { $('detail').hidden = true; $('boardwrap').hidden = false; };
    window.scrollTo(0, 0);
  }

  function modelPanel() {
    var cats = meta.categories.map(function (c) {
      return '<tr><td>' + esc(c.category) + '</td><td class="num">' + c.peers +
        '</td><td class="num">' + c.multiple.toFixed(3) + '</td><td class="num">' +
        c.multiple_low.toFixed(3) + '–' + c.multiple_high.toFixed(3) + '</td></tr>';
    }).join('');
    $('model').innerHTML = '<h2>The SONAR-3 model</h2>' +
      '<p>Every implied value is priced from the snapshot itself. Protocols whose record already ' +
      'carries a token give market observations of what one dollar of TVL is worth in each category ' +
      '(market cap ÷ TVL, winsorised at the snapshot\'s 90th percentile). Each category\'s median ' +
      'multiple is shrunk toward the global median (' + meta.global_multiple.toFixed(3) +
      ') in log space with 5 pseudo-peers, so thin categories borrow strength instead of pretending ' +
      'precision. A pre-token protocol is then priced as TVL × its category multiple, adjusted by a ' +
      'damped 7-day growth factor and a log maturity factor for the time it has run with no token ' +
      'recorded, then a flat 0.85 launch discount. The range on each row reruns the same waterfall ' +
      'with the category\'s p25 and p75 multiples. Confidence grades A–D come from peer count and ' +
      'multiple dispersion: a 1-peer category never grades above C.</p>' +
      '<p><b>Launch eligibility:</b> of the ' + meta.scanned + ' protocols scanned, ' +
      meta.records_no_token + ' record no token; the board ranks the ' + meta.rows +
      ' of those that also pass the launch-eligibility rule. Out are the Bridge, Canonical Bridge, ' +
      'Liquid Staking, Liquid Restaking, Restaked BTC and CEX categories, names ending in a version ' +
      'marker, names carrying a whole word wrapped, staked or staking, and names beginning with an ' +
      'exchange\'s name — wrapped, staked and bridged products of tokens that already trade are not ' +
      'launch candidates.</p>' +
      '<p><b>Self-validation (leave-one-out):</b> hiding each of the ' + meta.loocv_cases +
      ' tokenised protocols in turn and pricing it from its remaining category peers gives a median ' +
      'absolute error of <b>' + meta.loocv_median_error_pct + '%</b> (mean ' + meta.loocv_mean_error_pct +
      '% — the gap between the two is the fat tail of category multiples). That is the model\'s honest ' +
      'accuracy on protocols whose answer is known — expect pre-token rows to be at least that rough.</p>' +
      '<table><thead><tr><th>Category</th><th class="num">Peers</th><th class="num">Multiple</th>' +
      '<th class="num">p25–p75</th></tr></thead><tbody>' + cats + '</tbody></table>';
  }

  $('headmeta').textContent = 'Snapshot ' + meta.as_of + ' · ' + meta.scanned + ' scanned · ' +
    meta.records_no_token + ' record no token · ' + meta.rows + ' eligible & ranked · ' +
    meta.watchlist_rows + ' watchlist · ' + meta.researched_rows + ' hand-researched farm plans';
  $('q').oninput = function () { state.q = $('q').value; render(); };
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== $('q')) { e.preventDefault(); $('q').focus(); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('#board th'), function (th) {
    th.onclick = function () {
      var k = th.getAttribute('data-k');
      if (!k) return;
      if (state.key === k) state.dir = -state.dir;
      else { state.key = k; state.dir = k === 'name' || k === 'category' ? 1 : -1; }
      if (k === 'rank') state.dir = 1;
      render();
    };
  });
  buildFilters();
  render();
  modelPanel();
})();
