// Category-template farm plans for rows no hand research covered.
// These are generated, generic and labelled source:'template' in the data and
// "Template plan" on the dashboard. A template never invents a points
// programme: it tells the reader how to verify whether one exists, what the
// category's standard farm motion costs, and what to check before depositing.

import type { FarmPlan } from './farmbook.ts';

interface Proto {
  name: string;
  category: string | null;
  chains: string[];
}

const MOTIONS: Record<string, { venue: string; act: string; capital: string }> = {
  'Lending': { venue: 'the protocol\'s own app', act: 'supply the highest-TVL asset as collateral-free lending supply', capital: '$250+' },
  'Dexs': { venue: 'the protocol\'s own exchange interface', act: 'provide two-sided liquidity to its deepest pool or trade with limit orders', capital: '$250+' },
  'Yield': { venue: 'the protocol\'s own app', act: 'deposit into its flagship yield vault and hold the receipt token', capital: '$250+' },
  'Yield Aggregator': { venue: 'the protocol\'s own app', act: 'deposit into its largest stablecoin vault and hold the share token', capital: '$250+' },
  'RWA': { venue: 'the protocol\'s own app (eligibility checks first)', act: 'complete any eligibility/KYC step, then subscribe to its flagship real-world-asset vault', capital: '$500+' },
  'Derivatives': { venue: 'the protocol\'s own trading app', act: 'deposit collateral and trade modest size, or supply its liquidity vault if one exists', capital: '$500+' },
  'CDP': { venue: 'the protocol\'s own app', act: 'open a small collateralised position well below the maximum loan-to-value, or hold its stablecoin for yield if offered', capital: '$500+' },
  'Risk Curators': { venue: 'the lending venue its vaults live on (e.g. Morpho)', act: 'find its curator filter on the venue, read one vault\'s allocations, and deposit into that vault', capital: '$500+' },
  'Onchain Capital Allocator': { venue: 'the protocol\'s own app', act: 'deposit into its flagship allocator vault and hold the receipt token', capital: '$500+' },
  'Basis Trading': { venue: 'the protocol\'s own app', act: 'mint or buy its delta-neutral dollar and stake it if a staked form exists', capital: '$500+' },
};

const FALLBACK = { venue: 'the protocol\'s own official app', act: 'use its flagship product in the smallest size that still earns any documented reward', capital: '$250+' };

export function templatePlan(p: Proto): FarmPlan {
  const m = (p.category && MOTIONS[p.category]) || FALLBACK;
  const chain = p.chains.length > 0 ? p.chains[0] : 'its main chain';
  const cat = p.category || 'uncategorised';
  return {
    status: 'yield-only',
    verdict: `Template plan (not hand-researched): no points programme for ${p.name} has been verified by this entry. Verify any programme on the protocol's official channels before depositing.`,
    venue: m.venue,
    capital: m.capital,
    totalCost: 'Template estimate: $1-$15 in gas and swap fees for entry and exit on a major chain, less on an L2',
    totalTime: 'Template estimate: about 30 minutes of verification and setup, then 10 minutes a week',
    safety: false,
    steps: [
      `Verify first (about 15 minutes, $0): open ${p.name}'s official site from its DefiLlama page and read its docs for any points, rewards or token programme; if none is documented, treat this row as yield-only.`,
      `Prepare funds on ${chain}: hold the asset its ${cat} product uses plus a little of the chain's gas token; bridging in typically costs $1-$10 and takes about 10 minutes.`,
      `Make the category-standard move at ${m.venue}: ${m.act} (about 10 minutes; gas from cents on an L2 to $2-$15 on Ethereum mainnet).`,
      'Start at the template minimum size and hold for at least a week before adding: undocumented programmes, if any exist, reward duration and consistency, not deposit size alone.',
      'Check the position and the protocol\'s official channels weekly (10 minutes): programmes open and close without notice, and an ended programme is the most common way template rows go stale.',
      'Exit through the same official app and budget the same gas again; if withdrawals are queued or gated, that fact — found in step one — is the reason the verification step comes first.',
    ],
    risks: [
      'Template risk: this plan is generated from the category pattern, not researched against this protocol\'s own documentation',
      'Any points programme may not exist, may have ended, or may exclude your region; the verification step is the plan',
      'Smart-contract and curator risk are unassessed for this specific protocol',
    ],
  };
}
