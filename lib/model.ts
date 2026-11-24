// SONAR model: a pre-token protocol's implied launch value, derived only from the snapshot's figures.
//
// The idea: the snapshot itself contains the market's own pricing of protocols that already trade.
// For every token-bearing protocol with a market cap and a TVL, the ratio mcap / TVL is what the
// market currently pays for one dollar of that kind of protocol's locked value. Group those ratios
// by category, take each category's median, and shrink it toward the global median in proportion
// to how few peers the category has (empirical-Bayes shrinkage, K = 5 pseudo-peers):
//
//   peers(c)   = tokenised protocols in category c with mcap_usd and tvl_usd both recorded
//   rawMult(c) = median of mcap / TVL over peers(c), each ratio first winsorised at the snapshot's
//                own 90th percentile, so one peer priced on hype rather than TVL (a ratio of 400
//                exists in this snapshot) cannot price a whole category
//   compMult   = exp((n * ln(rawMult(c)) + K * ln(globalMedian)) / (n + K))
//                — shrinkage in log space, because multiples compound: one hot peer in a category
//                of one pulls its multiple toward the global median geometrically, not past it
//                (n = 0: the global median itself)
//
// A pre-token protocol is then priced as its TVL at its category's own multiple, adjusted by three
// factors that also come only from its snapshot record:
//
//   growthMult   = 1 + GROWTH_WEIGHT * clamp(change_7d, -60, +120) / 100   (no figure: 1, no claim)
//   maturityMult = 0.78 + 0.22 * min(age_days, 1460) / 1460                (unknown age: 0.89)
//   reachMult    = 1 + 0.02 * min(chains - 1, 10)                          (distribution breadth)
//   implied      = round(TVL * compMult * growthMult * maturityMult * reachMult * LAUNCH_DISCOUNT)
//
// LAUNCH_DISCOUNT (0.85) is one constant applied to every row: a token that does not trade yet has
// no liquidity and no governance record, so it is priced under its seasoned peers. It moves every
// value together and never changes a rank. No protocol name is special-cased anywhere: the same
// function scores every row, and a protocol the snapshot has never seen would be scored the same way.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them. */
export interface ModelConstants {
  shrinkage_k: number;
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_mult: number;
  reach_per_chain: number;
  reach_max_extra: number;
  launch_discount: number;
}

export const MODEL: ModelConstants = {
  shrinkage_k: 5,
  growth_weight: 0.45,
  growth_floor: -60,
  growth_cap: 120,
  maturity_floor: 0.78,
  maturity_range: 0.22,
  maturity_days: 1460,
  unknown_age_mult: 0.89,
  reach_per_chain: 0.02,
  reach_max_extra: 10,
  launch_discount: 0.85,
};

/** The model's version label: the dashboard names it and the board carries it. */
export const MODEL_VERSION = 'sonar-2';

/** How many live-token protocols the dashboard's Live view carries, by market cap. */
export const LIVE_ROWS = 24;

/** One row of board.json: the ranked board's row, its model breakdown and its farm plan. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  watchlist: boolean;
  age_days: number | null;
  implied_value_usd: number;
  model: {
    comp_multiple: number;
    comp_peers: number;
    growth_pct: number | null;
    growth_multiplier: number;
    maturity_multiplier: number;
    reach_multiplier: number;
    launch_discount: number;
  };
  farm_steps: string[];
}

/** The dashboard's view of one board row: everything the page renders, farm plan included. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  listed_at: string | null;
  age_days: number | null;
  watchlist: boolean;
  implied_value_usd: number;
  comp_multiple: number;
  comp_peers: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  reach_multiplier: number;
  farm_steps: string[];
}

/** A live-token protocol: it already trades, so the page shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
  ratio: number | null;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  scanned_size: number;
  pretoken_size: number;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  global_multiple: number;
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The median of a non-empty list of numbers. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * The comparable multiples: for each category, the shrunk median mcap/TVL of the snapshot's own
 * tokenised protocols, plus the global median every category shrinks toward.
 */
export function compMultiples(snapshot: Snapshot, model: ModelConstants = MODEL): { global: number; byCategory: Map<string, { multiple: number; peers: number }> } {
  const raw: { key: string; ratio: number }[] = [];
  for (const p of snapshot.protocols) {
    if (p.mcap_usd === null || p.mcap_usd <= 0 || p.tvl_usd <= 0) continue;
    raw.push({ key: p.category ?? '', ratio: p.mcap_usd / p.tvl_usd });
  }
  // Winsorise at the 90th percentile of the snapshot's own ratios before any median is taken.
  const sortedRatios = raw.map((r) => r.ratio).sort((a, b) => a - b);
  const cap = sortedRatios.length > 0 ? sortedRatios[Math.min(sortedRatios.length - 1, Math.ceil(0.9 * sortedRatios.length) - 1)]! : 0.2;
  const ratios: number[] = [];
  const grouped = new Map<string, number[]>();
  for (const { key, ratio } of raw) {
    const r = Math.min(ratio, cap);
    ratios.push(r);
    const list = grouped.get(key);
    if (list === undefined) grouped.set(key, [r]);
    else list.push(r);
  }
  const global = ratios.length > 0 ? median(ratios) : 0.2;
  const byCategory = new Map<string, { multiple: number; peers: number }>();
  for (const [key, list] of grouped) {
    const n = list.length;
    const shrunk = Math.exp((n * Math.log(median(list)) + model.shrinkage_k * Math.log(global)) / (n + model.shrinkage_k));
    byCategory.set(key, { multiple: shrunk, peers: n });
  }
  return { global, byCategory };
}

/** The factors and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  comps: { global: number; byCategory: Map<string, { multiple: number; peers: number }> },
  model: ModelConstants = MODEL,
): { implied: number; compMult: number; compPeers: number; growthPct: number | null; growthMult: number; maturityMult: number; reachMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const comp = comps.byCategory.get(protocol.category ?? '') ?? { multiple: comps.global, peers: 0 };
  const growthPct = protocol.change_7d === null ? null : Math.min(model.growth_cap, Math.max(model.growth_floor, finite(protocol.change_7d, 0)));
  const growthMult = growthPct === null ? 1 : 1 + (growthPct / 100) * model.growth_weight;
  const maturityMult = age === null ? model.unknown_age_mult : model.maturity_floor + (Math.min(age, model.maturity_days) / model.maturity_days) * model.maturity_range;
  const reachMult = 1 + model.reach_per_chain * Math.min(Math.max(protocol.chains.length - 1, 0), model.reach_max_extra);
  const implied = Math.max(1, Math.round(protocol.tvl_usd * comp.multiple * growthMult * maturityMult * reachMult * model.launch_discount));
  return { implied, compMult: comp.multiple, compPeers: comp.peers, growthPct, growthMult, maturityMult, reachMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Categories that are a wrapped, staked or bridged product of another protocol, per the house's own watchlist rule. */
const PRODUCT_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** Exchange names a product's name may not begin with, per the same rule. */
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/;

/** A whole word wrapped, staked or staking in a name marks a product of another protocol. */
const PRODUCT_WORD = /\b(wrapped|staked|staking)\b/i;

/**
 * Whether a protocol is one the board may rank on its own: it records no token, and it is a
 * product in its own right rather than a wrapped, staked or bridged wrapper of one that already
 * trades — the same visible-field test the house's watchlist rule states (a WBTC or a staked-ETH
 * wrapper records no token of its own in the snapshot, but it is not a launch waiting to happen).
 * Watchlist rows are exempt: the house already applied the full rule, parent record included.
 */
export function isRankable(p: SnapshotProtocol): boolean {
  return isPreToken(p) && !PRODUCT_CATEGORIES.has(p.category ?? '') && !VERSIONED.test(p.name) && !PRODUCT_WORD.test(p.name) && !EXCHANGE_PREFIX.test(p.name);
}

const bySlugAsc = (a: SnapshotProtocol, b: SnapshotProtocol): number => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const index = new Map(snapshot.protocols.map((p) => [p.slug, p]));
  const watch = new Set(snapshot.watchlist);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug on it is ranked, whatever the filters below say.
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other rankable pre-token protocol in the snapshot, not a TVL-truncated
  // sample — the radar exists to catch launches early, so its board is the whole pre-token field
  // that is a product in its own right.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }
  const comps = compMultiples(snapshot, model);
  const scored = [...chosen.values()].map((p) => ({ p, ...impliedValue(p, snapshot.as_of, comps, model) }));
  scored.sort((a, b) => b.implied - a.implied || bySlugAsc(a.p, b.p));
  // Guard the gate's order rule exactly: after rounding, neighbours can tie but never rise.
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token' as const,
    watchlist: watch.has(s.p.slug),
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      comp_multiple: round4(s.compMult),
      comp_peers: s.compPeers,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      reach_multiplier: round4(s.reachMult),
      launch_discount: model.launch_discount,
    },
    farm_steps: farmSteps(s.p, s.age),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 500;
  if (p.tvl_usd >= 1_000_000_000) return 250;
  if (p.tvl_usd >= 250_000_000) return 150;
  if (p.tvl_usd >= 50_000_000) return 100;
  return 75;
}

/** A realistic per-transaction gas allowance on the protocol's first chain. */
function gasFor(p: SnapshotProtocol): number {
  return p.chains.includes('Ethereum') && chainOf(p) === 'Ethereum' ? 12 : 2;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 45;
  if (age < 180) return 60;
  if (age < 365) return 45;
  if (age < 730) return 35;
  return 30;
}

/** The category's opening action, in words a farmer can follow. */
function openActionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC as collateral to ${name} on ${chain}, then borrow a small amount against it so both sides of the market see the wallet`;
  if (c.includes('dex') || c.includes('derivative') || c.includes('perpetual')) return `Deposit $${capital} on ${name} via ${chain} and place a first small trade or hedge, keeping most of the balance parked in the account`;
  if (c.includes('bridge') || c.includes('cross chain')) return `Bridge $${capital} of USDC to ${chain} through ${name}, then use the bridged funds in one app on the far side so the trip is not empty`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} on ${chain} and keep the staking receipt token in the same wallet`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('yield')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the vault shares untouched while they accrue`;
  if (c.includes('rwa')) return `Mint $${capital} of ${name}'s yield-bearing asset on ${chain} through its own app and hold the position`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} for the longest term it offers and keep the policy active`;
  if (c.includes('prediction')) return `Fund ${name} with $${capital} on ${chain} and take one position in its most liquid market`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain} and hold it in the farming wallet`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} through its own app and keep the position open`;
}

/** The category's second qualifying action: the follow-through that makes the wallet look like a user. */
function secondActionFor(p: SnapshotProtocol, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp')) return `Repay part of the borrow and re-borrow once, so ${name} records a full lend-borrow-repay cycle from the wallet`;
  if (c.includes('dex') || c.includes('derivative') || c.includes('perpetual')) return `Make one more trade in a different market of ${name} on ${chain}, sized under 10% of the deposit, so the activity is not a single swap`;
  if (c.includes('bridge') || c.includes('cross chain')) return `Bridge a small amount back through ${name} a week later, so the wallet shows a round trip rather than a one-way transfer`;
  if (c.includes('staking') || c.includes('restak')) return `Claim the staking rewards once and restake them through ${name}, so the wallet records a rewards cycle`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('yield')) return `Add a small second deposit to the same ${name} vault on ${chain}, so the position grows the way a real user's would`;
  return `Repeat the opening action once at half size on ${chain}, so ${name} records a returning user rather than a single visit`;
}

/**
 * A protocol's farm plan: seven steps, each an action with what it costs and how long it takes.
 * The plan is derived from the protocol's own record (category, chains, TVL, age), never from a
 * hand-written list of names, so a protocol the snapshot has never seen gets a plan the same way.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): string[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const gas = gasFor(p);
  const hold = holdDaysFor(age);
  const steps = [
    `Set up a fresh wallet that holds only the funds for this farm, write its seed phrase on paper and keep it offline; never farm from a wallet that holds other assets. Cost: $0. Time: 10 minutes, once.`,
    `${openActionFor(p, capital, chain)}. Cost: $${capital} of capital plus about $${gas} of gas. Time: 20 minutes to set up.`,
    `${secondActionFor(p, chain)}. Cost: about $${gas} of gas. Time: 10 minutes, in the first week.`,
    `Repeat one qualifying action on ${p.name} every week (a deposit, a trade, a claim or a vote in its app) so the wallet reads as an active user, not a one-off visitor. Cost: about $${gas} of gas a week. Time: 10 minutes a week for ${hold} days.`,
    `Hold the position for at least ${hold} days without withdrawing, so the activity stands in several weekly snapshots of the protocol's usage. Cost: the $${capital} stays in the position. Time: ${hold} days.`,
    `Once a month, open ${p.name}'s own points, rewards or governance page from the link on its official site and take part if a programme is live; never pay a third party to claim anything. Cost: $0 to check. Time: 15 minutes a month.`,
    `Keep a farm log (wallet, chain, dates, transaction hashes, amounts) and set an exit rule now: unwind within a week of any token announcement if you do not want the token itself. Cost: $0. Time: 15 minutes to write, 5 minutes a week to update.`,
  ];
  return steps.map((s) => (s.length > 600 ? `${s.slice(0, 596)}...` : s));
}

/** The live-token protocols, by market cap, for the dashboard's Live view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd || bySlugAsc(a, b))
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
      ratio: p.mcap_usd !== null && p.tvl_usd > 0 ? round4(p.mcap_usd / p.tvl_usd) : null,
    }));
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const comps = compMultiples(snapshot, model);
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    scanned_size: snapshot.protocols.length,
    pretoken_size: snapshot.protocols.filter(isPreToken).length,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: board.filter((r) => !r.watchlist).length,
    live_size: live.length,
    global_multiple: round4(comps.global),
    rows: board.map((row) => ({
      rank: row.rank,
      slug: row.slug,
      name: row.name,
      category: row.category,
      chains: row.chains,
      tvl_usd: row.tvl_usd,
      change_7d: row.change_7d,
      listed_at: row.listed_at,
      age_days: row.age_days,
      watchlist: row.watchlist,
      implied_value_usd: row.implied_value_usd,
      comp_multiple: row.model.comp_multiple,
      comp_peers: row.model.comp_peers,
      growth_multiplier: row.model.growth_multiplier,
      maturity_multiplier: row.model.maturity_multiplier,
      reach_multiplier: row.model.reach_multiplier,
      farm_steps: row.farm_steps,
    })),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  if (board.length < 100 || board.length > 4000) return `the board holds ${board.length} rows, outside 100..4000`;
  const slugs = new Set(board.map((r) => r.slug));
  if (slugs.size !== board.length) return 'a slug appears on the board more than once';
  const known = new Set(snapshot.protocols.map((p) => p.slug));
  for (const r of board) if (!known.has(r.slug)) return `${r.slug} is not a protocol in the snapshot`;
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  const byRank = [...board].sort((a, b) => a.rank - b.rank);
  for (let i = 1; i < byRank.length; i++) if (byRank[i]!.implied_value_usd > byRank[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && byRank[0]!.implied_value_usd === byRank[byRank.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) {
      const t = s.trim();
      if (t.length < 20 || t.length > 600) return `${r.slug} has a farm step of ${t.length} characters`;
    }
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
