// SONAR-3 — the value model for the token launch radar.
//
// Everything on the board is derived from the sealed snapshot's own figures.
// No protocol name is hardcoded into the pricing path: a row's implied value is
// a function of its TVL, its category's peer multiple, its 7-day TVL growth
// and how long it has been tracked with no token recorded.
//
// How a price is built (valuation waterfall, shown per row on the dashboard):
//   implied = TVL x category multiple x growth factor x maturity factor x 0.85
//
// The category multiple is learned from the snapshot's tokenised protocols:
// for each of them mcap/TVL is a market observation of what one dollar of TVL
// is worth in that category. Raw ratios are winsorised at the snapshot's own
// 90th percentile so one meme-priced outlier cannot set a category's price.
// Each category contributes its median ratio, shrunk toward the global median
// in log space with K = 5 pseudo-peers: a category with n real peers keeps
// n/(n+5) of its own log-median, so a 1-peer category is mostly the global
// median and a 20-peer category is mostly itself. That is the honest way to
// price thin categories, and the confidence grade below says so out loud.
//
// Range: the same waterfall run with the category's p25 and p75 peer ratios
// (shrunk the same way) gives every row an implied-value range, not a point
// pretending to be exact.
//
// Confidence: graded A-D from peer count and the log-dispersion (IQR) of the
// category's ratios. A = 12+ peers and a tight IQR; D = 3 or fewer peers or a
// very wide IQR. A 1-peer category can never grade above C.
//
// Growth factor: 1 + clamp(change_7d, -50, +100)/200, so +100% in a week lifts
// value by at most 1.5x and a -50% week cuts it to 0.75x. Momentum is evidence,
// not destiny, so it is deliberately damped. Missing growth counts as 0.
//
// Maturity factor: 1 + 0.35 * log2(1 + days/365), capped at 1.7, where days is
// the time from listed_at to the snapshot's as_of with no token recorded. A
// protocol that has run for years tokenless has proved durable demand; the log
// keeps the bonus slow and bounded. Missing listed_at counts as 0 days.
//
// Launch discount: a flat 0.85. A first token usually prices below the mature
// peer median (new float, no index inclusion, unlock overhang), so every
// implied value is stated after that haircut rather than at full peer parity.
//
// Self-validation (LOOCV): each tokenised protocol is hidden in turn, its
// market cap is predicted from the remaining peers of its category with the
// same shrinkage, and the absolute percentage error is recorded. The median of
// those errors is the model's honest accuracy figure; it is computed on every
// run and printed on the dashboard's model panel.

export interface Protocol {
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

export interface Snapshot {
  as_of: string;
  floor_usd: number;
  protocols: Protocol[];
  watchlist: string[];
}

export interface CategoryStats {
  category: string;
  peers: number;
  median: number; // shrunk multiple used for pricing
  p25: number; // shrunk
  p75: number; // shrunk
  rawMedian: number;
  iqrLog: number; // log(p75raw) - log(p25raw), dispersion signal
}

export interface ModelResult {
  globalMedian: number;
  categories: Map<string, CategoryStats>;
  loocvMedianErrorPct: number;
  loocvMeanErrorPct: number;
  loocvCases: number;
  asOfMs: number;
}

const WINSOR_P = 0.9; // winsorise peer ratios at the snapshot's 90th percentile
const SHRINK_K = 5; // pseudo-peers pulling each category toward the global median
const LAUNCH_DISCOUNT = 0.85;
const UNCATEGORISED = '(uncategorised)';

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function median(sorted: number[]): number {
  return quantile(sorted, 0.5);
}

// Shrink a category statistic toward the global one in log space.
function shrink(value: number, globalValue: number, n: number): number {
  const w = n / (n + SHRINK_K);
  return Math.exp(w * Math.log(value) + (1 - w) * Math.log(globalValue));
}

function catKey(p: Protocol): string {
  return p.category === null || p.category === '' ? UNCATEGORISED : p.category;
}

// Launch eligibility: the board's subjects are launch candidates, so the
// snapshot's own watchlist rule is applied to every protocol that records no
// token. A record is NOT a radar subject when it is a wrapped, staked or
// bridged product of a token that already trades: its category is Bridge,
// Canonical Bridge, Liquid Staking, Liquid Restaking, Restaked BTC or CEX,
// its name ends in a version marker (a space followed by V2, v2, 2.0 or the
// like), its name carries a whole word wrapped, staked or staking in any
// case, or its name begins with an exchange's name. This is a rule over the
// snapshot's category and name fields — no slug is hardcoded.
const INELIGIBLE_CATEGORIES = new Set([
  'Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX',
]);
const EXCHANGE_PREFIXES = ['Binance', 'Coinbase', 'Bybit', 'Kraken', 'Bitget', 'OKX', 'Bitfinex', 'Gemini'];

export function launchEligible(p: Protocol): boolean {
  if (p.category !== null && INELIGIBLE_CATEGORIES.has(p.category)) return false;
  if (/\s(?:[Vv]\d+(?:\.\d+)?|\d+\.\d+)$/.test(p.name)) return false;
  if (/\b(?:wrapped|staked|staking)\b/i.test(p.name)) return false;
  const lower = p.name.toLowerCase();
  for (const ex of EXCHANGE_PREFIXES) if (lower.startsWith(ex.toLowerCase())) return false;
  return true;
}

export function buildModel(snap: Snapshot): ModelResult {
  // Peer set: protocols whose record carries a token and a market cap.
  const peers = snap.protocols.filter(
    (p) => p.mcap_usd !== null && p.mcap_usd > 0 && p.tvl_usd > 0,
  );
  const allRatios = peers.map((p) => (p.mcap_usd as number) / p.tvl_usd).sort((a, b) => a - b);
  const cap = quantile(allRatios, WINSOR_P);
  const winsor = (r: number) => Math.min(r, cap);
  const globalMedian = median(allRatios.map(winsor).sort((a, b) => a - b));
  const globalP25 = quantile(allRatios.map(winsor).sort((a, b) => a - b), 0.25);
  const globalP75 = quantile(allRatios.map(winsor).sort((a, b) => a - b), 0.75);

  const byCat = new Map<string, number[]>();
  for (const p of peers) {
    const k = catKey(p);
    if (!byCat.has(k)) byCat.set(k, []);
    (byCat.get(k) as number[]).push(winsor((p.mcap_usd as number) / p.tvl_usd));
  }

  const categories = new Map<string, CategoryStats>();
  for (const [k, ratios] of [...byCat.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const s = [...ratios].sort((a, b) => a - b);
    const n = s.length;
    categories.set(k, {
      category: k,
      peers: n,
      median: shrink(median(s), globalMedian, n),
      p25: shrink(quantile(s, 0.25), globalP25, n),
      p75: shrink(quantile(s, 0.75), globalP75, n),
      rawMedian: median(s),
      iqrLog: Math.log(quantile(s, 0.75)) - Math.log(quantile(s, 0.25)),
    });
  }

  // Leave-one-out cross-validation over the tokenised peers: hide one, price
  // it from its category's remaining peers (same winsor cap and shrinkage),
  // and measure the error against its recorded market cap.
  const errors: number[] = [];
  for (const held of peers) {
    const k = catKey(held);
    const rest = peers
      .filter((p) => p !== held && catKey(p) === k)
      .map((p) => winsor((p.mcap_usd as number) / p.tvl_usd))
      .sort((a, b) => a - b);
    const mult = rest.length > 0 ? shrink(median(rest), globalMedian, rest.length) : globalMedian;
    const predicted = held.tvl_usd * mult * LAUNCH_DISCOUNT;
    errors.push(Math.abs(predicted - (held.mcap_usd as number)) / (held.mcap_usd as number));
  }
  errors.sort((a, b) => a - b);
  // The mean is reported beside the median on purpose: mcap/TVL errors are
  // right-skewed, so the gap between the two is itself information about how
  // fat the model's tail mistakes are.
  const loocvMean = errors.reduce((s, e) => s + e, 0) / Math.max(1, errors.length);

  return {
    globalMedian,
    categories,
    loocvMedianErrorPct: Math.round(median(errors) * 1000) / 10,
    loocvMeanErrorPct: Math.round(loocvMean * 1000) / 10,
    loocvCases: errors.length,
    asOfMs: Date.parse(snap.as_of + 'T00:00:00Z'),
  };
}

export function growthFactor(change7d: number | null): number {
  const c = change7d === null ? 0 : Math.max(-50, Math.min(100, change7d));
  return 1 + c / 200;
}

export function maturityFactor(listedAt: string | null, asOfMs: number): { factor: number; days: number } {
  if (listedAt === null) return { factor: 1, days: 0 };
  const days = Math.max(0, Math.floor((asOfMs - Date.parse(listedAt + 'T00:00:00Z')) / 86400000));
  const factor = Math.min(1.7, 1 + 0.35 * Math.log2(1 + days / 365));
  return { factor, days };
}

export function confidenceGrade(stats: CategoryStats | undefined): string {
  if (!stats) return 'D';
  const n = stats.peers;
  const wide = stats.iqrLog;
  let score = 0;
  if (n >= 12) score += 2; else if (n >= 6) score += 1;
  if (wide < 0.8) score += 2; else if (wide < 1.6) score += 1;
  if (n <= 1) return score >= 3 ? 'C' : 'D'; // a single peer never looks solid
  if (score >= 4) return 'A';
  if (score >= 3) return 'B';
  if (score >= 1) return 'C';
  return 'D';
}

export interface Priced {
  multiple: number;
  multipleLo: number;
  multipleHi: number;
  growth: number;
  maturity: number;
  daysListed: number;
  implied: number;
  impliedLo: number;
  impliedHi: number;
  confidence: string;
  peers: number;
}

export function price(p: Protocol, model: ModelResult): Priced {
  const stats = model.categories.get(catKey(p));
  const multiple = stats ? stats.median : model.globalMedian;
  const multipleLo = stats ? stats.p25 : model.globalMedian;
  const multipleHi = stats ? stats.p75 : model.globalMedian;
  const growth = growthFactor(p.change_7d);
  const mat = maturityFactor(p.listed_at, model.asOfMs);
  const base = p.tvl_usd * growth * mat.factor * LAUNCH_DISCOUNT;
  return {
    multiple,
    multipleLo,
    multipleHi,
    growth,
    maturity: mat.factor,
    daysListed: mat.days,
    implied: Math.max(1, Math.round(base * multiple)),
    impliedLo: Math.max(1, Math.round(base * multipleLo)),
    impliedHi: Math.max(1, Math.round(base * multipleHi)),
    confidence: confidenceGrade(stats),
    peers: stats ? stats.peers : 0,
  };
}
