// SONAR-3 token launch radar — entry point.
//
// Reads the sealed snapshot, prices every launch-eligible protocol that
// records no token with the SONAR-3 model (lib/model.ts), attaches a farm plan to each row — hand
// researched where the farmbook has one (lib/farmbook.ts), a clearly labelled
// category template otherwise (lib/templates.ts) — then writes board.json and
// data.js, copies dashboard/ and screenshots/ into the output, and writes
// dossier.json last with the kit's unmodified buildDossier.
//
// Deterministic by construction: rows sort by implied value descending with
// slug as the tie-break, all maps iterate in sorted order, and no clock or
// randomness is read. Two runs write byte-identical outputs.

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildModel, price, launchEligible, type Snapshot, type Protocol } from './lib/model.ts';
import { FARMBOOK, FARMBOOK2, type FarmPlan } from './lib/farmbook.ts';
import { templatePlan } from './lib/templates.ts';
import { buildDossier } from './vendor/makefun-board.ts';

// Research corrections: these protocols record no token in the snapshot, but
// hand research (2026-11-24/27) proves a token already trades in the real
// world. They stay on the board — coverage is the floor — flagged honestly.
const ALREADY_TRADING = new Set([
  'usdd', 'bittensor-dtao', 'figure-markets-exchange', 'doppler-finance',
  'infinifi', 'apex-omni', 'manta-cedefi',
]);

const RESEARCHED: Record<string, FarmPlan> = { ...FARMBOOK, ...FARMBOOK2 };

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function main(): void {
  const inputPath = argValue('--input');
  if (!inputPath) throw new Error('usage: node main.ts --input <snapshot.json>');
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || 'out';
  const root = dirname(fileURLToPath(import.meta.url));

  const snap = JSON.parse(readFileSync(inputPath, 'utf8')) as Snapshot;
  const model = buildModel(snap);
  const watch = new Set(snap.watchlist);

  // The board's subjects, as a funnel: every protocol scanned, then those
  // whose record carries no token (both gecko_id and symbol null in the
  // snapshot's own fields), then those that pass the launch-eligibility rule
  // (lib/model.ts) — wrapped, staked, bridged and exchange records of tokens
  // that already trade are not launch candidates.
  const recordsNoToken = snap.protocols.filter((p) => p.gecko_id === null && p.symbol === null);
  const subjects = recordsNoToken.filter(launchEligible);

  const rows = subjects.map((p: Protocol) => {
    const priced = price(p, model);
    const researched = RESEARCHED[p.slug];
    const plan: FarmPlan = researched ?? templatePlan(p);
    const tokenStatus = ALREADY_TRADING.has(p.slug) ? 'already-trading' : 'pre-token';
    return {
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      change_7d: p.change_7d,
      listed_at: p.listed_at,
      watchlist: watch.has(p.slug),
      token_status: tokenStatus,
      rank: 0,
      implied_value_usd: priced.implied,
      implied_low_usd: priced.impliedLo,
      implied_high_usd: priced.impliedHi,
      confidence: priced.confidence,
      model: {
        multiple: round4(priced.multiple),
        multiple_low: round4(priced.multipleLo),
        multiple_high: round4(priced.multipleHi),
        growth_factor: round4(priced.growth),
        maturity_factor: round4(priced.maturity),
        days_listed: priced.daysListed,
        peers: priced.peers,
        discount: 0.85,
      },
      farm: {
        source: researched ? 'researched' : 'template',
        status: tokenStatus === 'already-trading' && plan.status !== 'do-not-deposit' ? 'already-trading' : plan.status,
        verdict: plan.verdict,
        venue: plan.venue,
        capital: plan.capital,
        total_cost: plan.totalCost,
        total_time: plan.totalTime,
        safety: plan.safety,
        risks: plan.risks,
      },
      farm_steps: plan.steps,
    };
  });

  rows.sort((a, b) => b.implied_value_usd - a.implied_value_usd || (a.slug < b.slug ? -1 : 1));
  rows.forEach((r, i) => { r.rank = i + 1; });

  // Gate self-check: fail loudly rather than write an invalid board.
  const problems: string[] = [];
  if (rows.length < 100 || rows.length > 4000) problems.push(`row count ${rows.length}`);
  for (const w of snap.watchlist) if (!rows.some((r) => r.slug === w)) problems.push(`watchlist missing ${w}`);
  rows.forEach((r, i) => { if (r.rank !== i + 1) problems.push(`rank gap at ${r.slug}`); });
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].implied_value_usd > rows[i - 1].implied_value_usd) problems.push(`implied rises at rank ${i + 1}`);
  }
  for (const r of rows) {
    if (r.farm_steps.length < 3 || r.farm_steps.length > 12) problems.push(`steps count ${r.slug}`);
    for (const s of r.farm_steps) {
      const n = s.trim().length;
      if (n < 20 || n > 600) problems.push(`step length ${n} in ${r.slug}`);
    }
  }
  if (problems.length > 0) throw new Error('gate self-check failed: ' + problems.slice(0, 8).join('; '));

  const categories = [...model.categories.values()]
    .sort((a, b) => (a.category < b.category ? -1 : 1))
    .map((c) => ({
      category: c.category, peers: c.peers,
      multiple: round4(c.median), multiple_low: round4(c.p25), multiple_high: round4(c.p75),
    }));

  const meta = {
    model: 'SONAR-3',
    as_of: snap.as_of,
    scanned: snap.protocols.length,
    records_no_token: recordsNoToken.length,
    rows: rows.length,
    watchlist_rows: rows.filter((r) => r.watchlist).length,
    researched_rows: rows.filter((r) => r.farm.source === 'researched').length,
    global_multiple: round4(model.globalMedian),
    loocv_median_error_pct: model.loocvMedianErrorPct,
    loocv_mean_error_pct: model.loocvMeanErrorPct,
    loocv_cases: model.loocvCases,
    categories,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'board.json'), JSON.stringify({ meta, rows }, null, 1) + '\n');
  writeFileSync(join(outDir, 'data.js'), 'window.RADAR=' + JSON.stringify({ meta, rows }) + ';\n');
  cpSync(join(root, 'dashboard'), join(outDir, 'dashboard'), { recursive: true });
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  if (!existsSync(join(outDir, 'dossier.json'))) writeFileSync(join(outDir, 'dossier.json'), '');
  writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, { text_max_bytes: 65536 }));
  console.log(`SONAR-3: ${snap.protocols.length} scanned, ${recordsNoToken.length} record no token, ${rows.length} eligible rows, LOOCV median error ${model.loocvMedianErrorPct}% over ${model.loocvCases} peers`);
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

main();
