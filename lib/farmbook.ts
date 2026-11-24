// The v2 farmbook: hand-researched farm plans for the top of the SONAR-2 board.
//
// v1 generated every farm plan from a category template. For v2, the 27 protocols at the top of
// the board (ranks 1-24, 26, 27 and 30) were researched one by one against the protocols' own
// documentation and apps on 2026-11-24. Each entry below records what the research actually
// found: where the farm happens, whether a points programme exists and whether it is still
// running, what it costs, and the risks a farmer has to price in. Where the research found no
// retail farm, the plan says so plainly instead of dressing up a generic template - an honest
// "do not farm this" is worth more to a reader than a confident-sounding invention.
//
// Status vocabulary:
//   points-live       a documented points programme is running now
//   points-unverified a points programme is documented, but live accrual was not verified
//   yield-only        no points programme; the honest farm is native yield (plus venue campaigns)
//   cash-rewards      rewards exist but are paid in cash/stablecoins, not points or a token
//   points-ended      the points programme is over; new deposits earn yield only
//   do-not-deposit    a named venue in this plan was exploited or paused - keep money out of it
//   already-trading   correction: the token already exists; there is no launch to farm
//   no-retail-farm    no farm a retail wallet can actually run (institution-only, not a vault,
//                     insufficient public information, or no token by design)

export type PlanStatus =
  | 'points-live'
  | 'points-unverified'
  | 'yield-only'
  | 'cash-rewards'
  | 'points-ended'
  | 'do-not-deposit'
  | 'already-trading'
  | 'no-retail-farm';

export interface ResearchedPlan {
  slug: string;
  status: PlanStatus;
  /** Short badge text for the dashboard. */
  status_label: string;
  /** One line: what the points situation honestly is. */
  points: string;
  /** Where the farm actually happens (app, chain, product). */
  venue: string;
  /** Sensible capital for the plan, in words. */
  min_capital: string;
  /** The plan itself: concrete steps with costs and times, each 20-600 characters. */
  steps: string[];
  /** The risks the research surfaced, in short phrases. */
  risks: string[];
}

export const FARMBOOK_VERSION = 'v2-research-2026-11-24';

export const RESEARCHED_PLANS: ResearchedPlan[] = [
  {
    slug: 'steakhouse-financial',
    status: 'yield-only',
    status_label: 'Yield only - no points',
    points: 'No points programme and no Steakhouse token are documented. The farm is native lending yield, plus any Merkl campaign rewards the Morpho app shows for the vault.',
    venue: 'Morpho app on Base: Steakhouse Prime USDC (steakUSDC) or Steakhouse High Yield USDC',
    min_capital: '$500-$1,000 (Base gas is under $0.10, so the position size is the only real cost driver)',
    steps: [
      'Set up a dedicated farming wallet, write its seed phrase on paper and keep it offline; fund it with USDC on Base only. Cost: $0 plus under $0.10 of gas to move funds. Time: 15 minutes, once.',
      'In the Morpho app, filter vaults by curator Steakhouse Financial and deposit $500-$1,000 of USDC into Steakhouse Prime USDC (steakUSDC); snapshot APYs for the Prime and High Yield vaults ran about 2.6-4.2%. Cost: the deposit, gas under $0.10. Time: 10 minutes.',
      'Hold the steakUSDC shares untouched so the position accrues native yield continuously; do not chase the Term or Turbo variants, which are different products with different risk. Cost: $0. Time: ongoing, check monthly.',
      'Once a month, open the Merkl campaign page linked from the Morpho app and claim any campaign rewards the vault is distributing; Steakhouse runs no points programme of its own, so venue campaigns are the only extra. Cost: $0 to check. Time: 10 minutes a month.',
      'Keep a farm log (wallet, vault, dates, amounts) and set the exit rule now: withdraw through the Morpho app, and allow for withdrawal liquidity - the vault targets about 90% utilisation, so a full exit can queue when borrow demand is high. Cost: $0. Time: 15 minutes.',
    ],
    risks: [
      'No points programme: returns are yield only, there is no airdrop to qualify for',
      'Withdrawal liquidity: the vault targets ~90% utilisation, so exits can queue',
      'Bad debt is socialised through the vault share price',
      'Term and Turbo variants carry different risk from the Prime vault',
    ],
  },
  {
    slug: 'sentora-curator',
    status: 'yield-only',
    status_label: 'Yield only - no points',
    points: 'No points programme and no Sentora token are documented. The farm is native yield on the PYUSD and RLUSD vaults Sentora curates on Morpho.',
    venue: 'Morpho app on Ethereum: Sentora PayPal USD Main or Sentora RLUSD Main vaults',
    min_capital: '$1,000-$2,500 (the position must first be converted into PYUSD or RLUSD, so allow for two conversion legs)',
    steps: [
      'Set up a dedicated farming wallet, seed phrase on paper, offline. Fund it on Ethereum with USDC. Cost: $0 plus Ethereum gas. Time: 15 minutes, once.',
      'Convert $1,000-$2,500 of USDC into PYUSD or RLUSD through a major exchange or DEX; Sentora curates vaults for those two stablecoins, not for USDC directly, so this conversion leg is part of the farm. Cost: swap fees plus gas. Time: 20 minutes.',
      'In the Morpho app, deposit into Sentora PYUSD Main (about 5.15% APY at research snapshots) or Sentora RLUSD Main (about 6.15%); Sentora is the IntoTheBlock and Trident risk teams merged, and curation is the product. Cost: the deposit plus gas. Time: 10 minutes.',
      'Hold the vault shares and let the yield accrue; re-check the vault allocation monthly in the Morpho app, because only about a quarter of the main vaults was liquid at research time. Cost: $0. Time: 10 minutes a month.',
      'Plan the exit before entering: convert back through the same two legs (vault withdrawal, then PYUSD/RLUSD back to USDC), and expect the withdrawal leg to be slow when the vault is heavily lent out. Cost: swap fees plus gas. Time: 30 minutes when you exit.',
    ],
    risks: [
      'No points programme: returns are yield only',
      'Only ~25% of the main vaults was liquid at research time - exits can be slow',
      'Two conversion legs (USDC to PYUSD/RLUSD and back) add cost and slippage',
      'Ethereum mainnet gas applies to every step',
    ],
  },
  {
    slug: 'gauntlet',
    status: 'yield-only',
    status_label: 'Yield only + one venue campaign',
    points: 'No points programme and no Gauntlet token are documented. The only points-like extra is a venue campaign: OKX Wallet ran a $350K X Layer campaign paying a bonus APR for supplying USDC to the Gauntlet vault there.',
    venue: 'Morpho app on Base: Gauntlet USDC Prime (gtUSDCp); optional OKX Wallet campaign on X Layer',
    min_capital: '$500-$1,000 on Base; the X Layer campaign leg works at similar size',
    steps: [
      'Set up a dedicated farming wallet, seed phrase on paper, offline; fund it with USDC on Base. Cost: $0 plus under $0.10 of gas. Time: 15 minutes, once.',
      'In the Morpho app, deposit $500-$1,000 of USDC into Gauntlet USDC Prime on Base (about 4.16% APY at research snapshots) and hold the gtUSDCp shares. Cost: the deposit, gas under $0.10. Time: 10 minutes.',
      'Optional campaign leg: in OKX Wallet, supply USDC to the Gauntlet vault on X Layer to earn the campaign bonus (up to 3% bonus APR from a $100K pool for that vault, inside a $350K campaign). Check the campaign is still live in the wallet before moving funds. Cost: bridge and gas fees. Time: 20 minutes.',
      'Skip the Gauntlet Frontier vault unless you deliberately want riskier collateral for a higher rate; Prime is the conservative product and the one this plan prices. Cost: $0. Time: 5 minutes to check which vault you are in.',
      'Hold for at least a full quarter so the yield compounds, and log the position (wallet, vault, chain, amounts); exit through the Morpho app, noting some Gauntlet V1 vault supply queues were partly shut in November 2026 - use the current vaults the app lists. Cost: $0. Time: 15 minutes to log.',
    ],
    risks: [
      'No Gauntlet points programme or token: the base farm is yield only',
      'The OKX campaign is a venue promotion with an end date, not a protocol programme',
      'Frontier vaults lend against riskier collateral than Prime',
      'Some V1 vault supply queues were partly shut in November 2026',
    ],
  },
  {
    slug: 'usdd',
    status: 'already-trading',
    status_label: 'Not a launch - token already live',
    points: 'Correction: USDD is not a pre-token protocol. USDD is itself the live $1 stablecoin (TRON DAO Reserve); there is no governance token and no airdrop to farm. The only play is stablecoin yield.',
    venue: 'USDD Earn (sUSDD) on TRON, entered through the USDD PSM swap',
    min_capital: '$250-$500 (yield at ~4% needs size to matter after fees)',
    steps: [
      'Do not farm USDD for a launch: there is none. USDD already trades as a $1 stablecoin, its snapshot record simply carries no market-cap field. Treat this entry as a yield position only, or skip it entirely. Cost: $0. Time: 5 minutes to decide.',
      'If you want the yield: swap USDT or USDC into USDD 1:1 through the USDD PSM, so no premium is paid for the token. Cost: the swap amount plus TRON fees. Time: 15 minutes.',
      'Deposit the USDD into USDD Earn to hold sUSDD at about 4% base APY at research time (the rate has stepped down: 20% in Jan 2025, 5% in Feb 2026, ~4% since). Cost: $0 beyond the deposit. Time: 10 minutes.',
      'Never mint USDD through a collateral vault to farm the Earn rate: vault minting costs about 4.25-5% while Earn pays about 4%, so that loop is net-negative by construction. Cost of ignoring this warning: a guaranteed small loss. Time: 0 minutes.',
      'Exit by redeeming sUSDD back to USDD and swapping out through the PSM; keep the position sized as cash, not as an airdrop farm, in your log. Cost: TRON fees. Time: 15 minutes.',
    ],
    risks: [
      'No token launch or airdrop exists for this entry - implied value is a snapshot artefact',
      'Earn APY has fallen steadily (20% to ~4%) and can fall further',
      'Minting USDD at 4.25-5% to earn 4% in Earn is net-negative',
      'Stablecoin and TRON-ecosystem risk sits with the holder throughout',
    ],
  },
  {
    slug: 'veda',
    status: 'yield-only',
    status_label: 'Yield via partners - points are historical',
    points: 'Veda Points existed in 2024-25 seasons, but no live Veda-run season and no Veda token were documented as of the 13 Nov 2026 research. Veda is vault infrastructure (BoringVault); farming happens in partner front-ends.',
    venue: 'Partner apps built on Veda vaults: ether.fi Liquid, Lombard DeFi Vault, Kraken DeFi Earn',
    min_capital: '$250-$1,000 depending on the partner vault',
    steps: [
      'Do not look for a Veda app or a Veda points page: Veda is infrastructure and runs no consumer front-end. Choose a partner product instead - ether.fi Liquid (liquidUSD/ETH/BTC), the Lombard DeFi Vault (LBTCv), or Kraken DeFi Earn. Cost: $0. Time: 15 minutes to choose.',
      'Set up a dedicated wallet (seed phrase on paper, offline) or a Kraken account for the Earn route, and fund it with the asset the chosen vault takes. Cost: $0 plus chain gas. Time: 15 minutes.',
      'Deposit $250-$1,000 into the chosen partner vault and hold the receipt token (for example LBTCv, which carries a 1.5% management fee). The yield is real; any points come from the partner programme, not from Veda. Cost: the deposit plus gas. Time: 10 minutes.',
      'Calendar the withdrawal terms before depositing: partner vault queues run up to 3-7 days, so this is not same-day money. Cost: $0. Time: 5 minutes.',
      'Log the position under the partner protocol, not under Veda, and exit through the same partner app; if a partner announces its own points season, that programme - not Veda - is what your activity counts toward. Cost: $0. Time: 10 minutes a month to check.',
    ],
    risks: [
      'Veda Points are historical (2024-25); no live Veda season or token is documented',
      'Withdrawal queues on partner vaults run up to 3-7 days',
      'ether.fi Liquid is not available to US residents',
      'Lombard DeFi Vault charges a 1.5% management fee',
    ],
  },
  {
    slug: 'nonce-capital',
    status: 'no-retail-farm',
    status_label: 'No retail farm - service provider only',
    points: 'No points programme and no Nonce token are documented, and no verifiable Nonce-curated Morpho vault could be found. Nonce is a service provider (strategy for ether.fi Liquid, risk admin for ether.fi Cash on Aave V4), not a farmable product.',
    venue: 'None directly. The only indirect route is ether.fi Liquid, which belongs to the Veda entry, not to Nonce',
    min_capital: 'None - there is no Nonce position to size',
    steps: [
      'Do not deposit anywhere "for Nonce Capital": the research could not verify a single Nonce-curated vault a retail wallet can enter, and no points or token exist to earn. Any site selling a Nonce farm is inventing it. Cost: $0. Time: 5 minutes.',
      'Understand what Nonce actually is before skipping: a strategy provider inside ether.fi Liquid vaults and the risk administrator for ether.fi Cash on Aave V4. Those are service contracts, not user products. Cost: $0. Time: 10 minutes of reading.',
      'If the underlying exposure is what you want, run the ether.fi Liquid plan from the Veda entry instead and log it as an ether.fi position; do not record it as farming Nonce. Cost: as priced in the Veda plan. Time: as in the Veda plan.',
      'Re-check once a quarter whether Nonce has launched a public vault or programme; until its own documentation names one, this entry stays a no-farm. Cost: $0. Time: 10 minutes a quarter.',
    ],
    risks: [
      'Insufficient public information: no verifiable retail product exists',
      'Third parties may invent "Nonce vaults" - none is verified',
      'Service-provider revenue does not accrue to depositors anywhere else',
    ],
  },
  {
    slug: 'polymarket-international',
    status: 'cash-rewards',
    status_label: 'Cash rewards - no points, no token drop documented',
    points: 'No points programme and no documented POLY airdrop allocation. All rewards are cash in pUSD: Liquidity Rewards for two-sided quotes, Maker Rebates at high volume, and 3.25%/yr Holding Rewards on eligible long-dated markets.',
    venue: 'Polymarket International: limit-order book markets and long-dated position markets',
    min_capital: '$500-$1,000 of working capital for two-sided quoting (rewards need resting size inside the max spread)',
    steps: [
      'First check you may legally use the venue: 33 countries are close-only (including the US, UK, France, Germany and Singapore). Indonesia was not on the blocked or close-only lists the research consulted, but that is not a legality opinion - verify for yourself before funding. Cost: $0. Time: 15 minutes.',
      'Fund a dedicated account with $500-$1,000 and pick one liquid market with an active Liquidity Rewards programme; rewards require two-sided resting limit orders inside the maximum spread and at or above the minimum size. Cost: the working capital. Time: 30 minutes to set up.',
      'Keep both quotes resting and re-centre them as the market moves; rewards are sampled every minute and paid daily in pUSD with a $1 minimum payout, so uptime matters more than trade count. Cost: $0 beyond capital at risk. Time: 20 minutes a day.',
      'Add a small long-dated position only if you actually hold a view: eligible long-dated markets pay 3.25%/yr Holding Rewards, which is a supplement, not a reason to buy. Maker Rebates are not a starter farm - tiers begin at $200K of 30-day maker volume. Cost: position size. Time: 15 minutes.',
      'Log every market, quote size and reward payout weekly; exit by cancelling quotes and withdrawing pUSD. If a POLY token is ever formally announced, this log is your evidence - until then, price this farm as cash yield only. Cost: $0. Time: 15 minutes a week.',
    ],
    risks: [
      'Geo restrictions are the top risk: 33 countries are close-only; verify your own eligibility',
      'No POLY airdrop is documented - rewards are cash (pUSD), not a token claim',
      'Two-sided quoting carries inventory risk when a market moves fast',
      'Maker Rebate tiers start at $200K 30-day volume - out of starter reach',
    ],
  },
  {
    slug: 'rockawayx',
    status: 'yield-only',
    status_label: 'Yield only - no points',
    points: 'No points programme, token or airdrop is documented for RockawayX. The farm is curated lending yield on Morpho (Ethereum) or the RockawayX RWA Vault on Kamino (Solana).',
    venue: 'Morpho app on Ethereum (RockawayX USDC vaults) or Kamino on Solana (RockawayX RWA Vault)',
    min_capital: '$1,000+ on Ethereum (gas), or $100-$500 on the Kamino route',
    steps: [
      'Set up a dedicated farming wallet, seed phrase on paper, offline. Pick the chain first: Ethereum for the Morpho vaults, Solana for the cheaper Kamino route. Cost: $0. Time: 15 minutes, once.',
      'Ethereum route: in the Morpho app, deposit $1,000+ of USDC into a RockawayX vault - USDC Prime for the conservative book, or USDC Yield (about 6.41% APY at research snapshots, roxUSDCy) for the higher rate. Cost: the deposit plus Ethereum gas. Time: 10 minutes.',
      'Solana route: deposit $100-$500 of USDC into the RockawayX RWA Vault on Kamino (about 4.8% at research snapshots) through the Kamino app. Cost: the deposit plus minimal Solana fees. Time: 10 minutes.',
      'Hold the vault shares for at least a quarter and re-check the curator allocation monthly in the app; there are no points to chase, so the only decision is whether the yield still pays for the risk. Cost: $0. Time: 10 minutes a month.',
      'Exit through the same app you entered with and log the realised yield; if RockawayX ever documents a programme, this position history is already in place. Cost: gas or Solana fees. Time: 15 minutes.',
    ],
    risks: [
      'No points or token: returns are yield only',
      'Ethereum gas makes small positions uneconomic on the Morpho route',
      'RWA vault yield depends on off-chain borrowers the holder cannot audit',
    ],
  },
  {
    slug: 'bittensor-dtao',
    status: 'already-trading',
    status_label: 'Correction - TAO already trades',
    points: 'Correction: Bittensor is not pre-token. TAO already trades (about $185 and a ~$2.16B market cap at research time); there are no points and no airdrop. The only play is native TAO staking yield.',
    venue: 'Bittensor native staking via btcli with a coldkey wallet (root network or subnets)',
    min_capital: 'About 1 TAO to make staking worthwhile after fees',
    steps: [
      'Do not farm Bittensor for a launch: TAO has traded for years, and this board row exists only because the snapshot record carries no market-cap field. There is no airdrop at the end of any Bittensor activity. Cost: $0. Time: 5 minutes to decide.',
      'If you want TAO exposure itself, buy TAO on a major exchange and move it to a btcli coldkey wallet you control; never stake through a site that asks for your seed phrase. Cost: the TAO purchase plus transfer fees. Time: 30 minutes.',
      'Conservative route: root staking on netuid 0. Your principal stays in TAO and earns about 5% APY at research snapshots - the near-passive option. Cost: $0 beyond the stake. Time: 15 minutes to delegate.',
      'Speculative route, only with money you can lose: subnet staking swaps your TAO into a subnet alpha token. Alpha is volatile and an unstake can return LESS TAO than you put in; validators take a cut (default 18%). Cost: potential principal loss in TAO terms. Time: 1 hour to research a subnet first.',
      'Log the stake (netuid, validator, amount, date) and review quarterly; unstaking from subnets is a swap back to TAO, so time exits rather than assuming par. Cost: $0. Time: 15 minutes a quarter.',
    ],
    risks: [
      'No airdrop or points exist - this is a staking yield play on a live token',
      'Subnet alpha tokens are volatile; unstaking can return less TAO than staked',
      'Validator take defaults to 18% of emissions on subnets',
      'TAO price risk applies to the whole position',
    ],
  },
  {
    slug: 'bitfi-basis',
    status: 'points-live',
    status_label: 'Points live - airdrop stated in docs',
    points: 'BitFi Points are live, and BitFi documentation states a future token airdrop will be distributed based on total points - the clearest documented points-to-airdrop link in this batch.',
    venue: 'BitFi app: bfUSD quests (mint, stake, Curve LP) and bfBTC HODL points',
    min_capital: '$100 scale per quest line (quests are sized at 100 bfUSD); bfBTC in clean 0.0001 BTC increments',
    steps: [
      'Set up a dedicated wallet, seed phrase on paper, offline, and read the BitFi points documentation first: it states the future token airdrop is distributed by total points, which is the whole reason to run this farm. Cost: $0. Time: 20 minutes.',
      'Complete the bfUSD starter quests at their designed $100 scale: first mint of 100 bfUSD, first stake of 100 bfUSD into Horizon or Pulsar, and a first 100 bfUSD Curve LP position. Each is a one-time quest, so do them once, properly. Cost: about $300 of rotating capital plus gas. Time: 45 minutes.',
      'For the bfBTC line, deposit BTC in clean 0.0001 BTC increments only: HODL points pay 10 points per 0.0001 bfBTC per ~24h epoch on whole increments, so a ragged amount silently wastes the remainder. Cost: the BTC deposited. Time: 15 minutes.',
      'Check the points balance weekly and keep every position open; points accrue per epoch while the assets stay put, so churn costs points rather than earning them. Cost: $0. Time: 10 minutes a week.',
      'Log every quest, epoch balance and fee you actually paid (BitFi does not publish its fee schedule, so your own log is the only record). Exit rule: if the custody or audit picture worsens, withdraw first and ask questions later. Cost: $0. Time: 15 minutes to set up the log.',
    ],
    risks: [
      'CeFi desk and custody risk: assets sit with a centralised desk (Ceffu custody)',
      'DefiLlama lists 0 audits for BitFi',
      'Fees are unpublished - true net yield is hard to verify',
      'bfUSD has been seen trading near $0.986, under its $1 target',
    ],
  },
  {
    slug: 'hyperithm',
    status: 'yield-only',
    status_label: 'Yield only - no points (not Hyperbeat)',
    points: 'No Hyperithm points programme exists - do not confuse Hyperithm with Hyperbeat, a different protocol that does run one. The farm is curator yield on Morpho (Monad) or Accountable, plus venue incentives such as WMON via Merkl when they appear.',
    venue: 'Morpho on Monad: Hyperithm USDC Apex (hyperUSDCa); or Accountable aHYPER directly',
    min_capital: '$250-$500 on Morpho; $1,000 minimum for the Accountable aHYPER route',
    steps: [
      'Set up a dedicated farming wallet, seed phrase on paper, offline; fund it with USDC on Monad for the Morpho route. Cost: $0 plus gas. Time: 15 minutes, once.',
      'In the Morpho app, deposit $250-$500 of USDC into Hyperithm USDC Apex. Read the allocation first: about 92.7% of it lent against aHYPER at research time, so this vault is largely a loan against Hyperithm\'s own token - size it as such. Cost: the deposit plus gas. Time: 15 minutes.',
      'Alternative route: deposit at least $1,000 into aHYPER through Accountable directly (0.5% management fee) if you prefer holding the asset to lending against it. Cost: the deposit plus the fee drag. Time: 15 minutes.',
      'Once a month, check Merkl for WMON or other venue incentives attached to the vault and claim what is live; venue incentives are the only extra - there is no Hyperithm points balance to grow. Cost: $0 to check. Time: 10 minutes a month.',
      'Hold for at least a quarter, log the position and the vault allocation share each month, and exit through Morpho if the aHYPER concentration rises further. Cost: gas. Time: 15 minutes a month.',
    ],
    risks: [
      'Self-referential concentration: ~92.7% of the Apex vault lent against aHYPER at research time',
      'No points programme - venue incentives only, and they come and go',
      'Accountable route charges a 0.5% management fee with a $1,000 minimum',
      'Monad is a young chain; bridge and liquidity risk apply',
    ],
  },
  {
    slug: 'onre',
    status: 'points-live',
    status_label: 'Points live - token NOT confirmed',
    points: 'OnRe Points accrue daily: 1 point per ONyc per day held (1x), 2x for LP positions, 3x for lending/borrowing on Kamino, 4x for YT-ONyc on Exponent. Honesty flag: OnRe has NOT confirmed a token or airdrop, and the points carry no stated cash value.',
    venue: 'Solana: hold ONyc, or LP on Kamino/Orca/Raydium, lend on Kamino, or YT-ONyc on Exponent',
    min_capital: '$100-$500 of ONyc (points are per-dollar per-day, so size and duration both count)',
    steps: [
      'Set up a dedicated Solana wallet, seed phrase on paper, offline; fund it with USDC on Solana. Cost: $0 plus minimal Solana fees. Time: 15 minutes, once.',
      'Buy $100-$500 of ONyc, the yield-bearing dollar backed by reinsurance premiums, and simply hold it: holding earns 1 point per ONyc per day at 1x while the asset itself yields. Cost: the ONyc purchase. Time: 15 minutes.',
      'To multiply points, choose ONE boosted route and understand it first: LP ONyc on Kamino, Orca or Raydium for 2x, lend or borrow against it on Kamino for 3x, or buy YT-ONyc on Exponent for 4x (yield tokens decay to zero at expiry - the 4x is not free). Cost: position fees. Time: 30 minutes.',
      'Check the in-app campaign multipliers before sizing up: campaign boosts above the base 1x-4x have been reported, but only the app\'s current figures count. Cost: $0. Time: 10 minutes a week.',
      'Plan the exit through the secondary market (DEX liquidity), not direct redemption: redeeming ONyc at NAV is gated to qualified investors with KYC, which most retail farmers cannot use. Log points and balances weekly. Cost: swap fees. Time: 15 minutes a week.',
    ],
    risks: [
      'OnRe has NOT confirmed a token or airdrop; points have no stated cash value',
      'Direct redemption at NAV is qualified-investor and KYC gated - retail exit is the secondary market',
      'YT-ONyc decays to zero at expiry; the 4x multiplier carries real cost',
      'ONyc value rests on reinsurance underwriting, an off-chain risk',
    ],
  },
  {
    slug: 'k3-capital',
    status: 'do-not-deposit',
    status_label: 'SAFETY FLAG - sBOLD exploited, alternatives only',
    points: 'No K3 points programme or token is documented. Safety first: K3\'s sBOLD vault was exploited for about $3.42-3.43M on 18 Nov 2026 and is paused; Liquity told users not to deposit. This plan routes around K3\'s own vaults entirely.',
    venue: 'NOT sBOLD. Alternatives: K3 cbMaxxxing USDC on Morpho (Base), K3 USDC Vault V2 on HyperEVM',
    min_capital: '$250-$500 for the Morpho Base alternative',
    steps: [
      'STOP - do not deposit into K3 Capital\'s sBOLD vault or any K3 epoch-staged vault: sBOLD was exploited for roughly $3.42-3.43M on 18 Nov 2026, the vault is paused, and Liquity instructed users not to deposit. The k3-capital.net site and its epoch vaults are also unverified - K3\'s identity there is not confirmed. Cost: $0. Time: 5 minutes.',
      'If you already hold sBOLD or a K3 vault position, follow only Liquity\'s and K3\'s official channels for withdrawal instructions; never follow a "recovery" link from social media or a DM. Cost: $0. Time: 30 minutes to verify channels.',
      'Retail-cleanest alternative: in the Morpho app on Base, deposit $250-$500 of USDC into K3 cbMaxxxing USDC, a plain curated lending vault unrelated to the exploited sBOLD product. Cost: the deposit plus Base gas under $0.10. Time: 10 minutes.',
      'Smaller alternative: K3 USDC Vault V2 on HyperEVM (5% performance fee, only about $1.2M in size at research time) - treat the small size itself as a risk and keep any position minor. Cost: the deposit plus gas. Time: 10 minutes.',
      'Avoid the Galaxy AUSD vault on Accountable as a K3 route unless you accept single-borrower credit with redemptions capped at 30% a month on 90-day loans. Log whichever alternative you used and re-check the sBOLD post-mortem before ever reconsidering K3\'s own vaults. Cost: $0. Time: 15 minutes.',
    ],
    risks: [
      'EXPLOITED: sBOLD vault lost ~$3.42-3.43M on 18 Nov 2026 and is paused - do not deposit',
      'The k3-capital.net epoch vaults are unverified; the operator identity is not confirmed',
      'HyperEVM vault is small (~$1.2M) with a 5% performance fee',
      'Accountable Galaxy AUSD is single-borrower credit, redemptions capped at 30%/month',
    ],
  },
  {
    slug: 'hive-protocol',
    status: 'yield-only',
    status_label: 'Liquid $B2 rewards - no points',
    points: 'There is no Hive points programme. Rewards are liquid $B2 tokens paid from the HIVE staking allocation - 20% of the 210M supply, released linearly over 96 months. The historical B2 airdrop snapshot was 18 Apr 2025; do not farm expecting another retroactive drop.',
    venue: 'B2 Network: bridge BTC, stake at hive.bsquared.network',
    min_capital: '0.001 BTC minimum stake (about $85-$95)',
    steps: [
      'Set up a dedicated wallet for the B2 position, seed phrase on paper, offline. This farm pays in a live token ($B2), so the decision is whether you want $B2 exposure at all. Cost: $0. Time: 15 minutes, once.',
      'Bridge at least 0.001 BTC (about $85-$95, the minimum stake) to the B2 network through the official bridge linked from hive.bsquared.network. Cost: the BTC plus bridge and network fees. Time: 30 minutes.',
      'Stake the bridged BTC in Hive at hive.bsquared.network; rewards are paid in $B2 from the staking allocation (20% of supply over 96 months), so the emission rate thins as more BTC stakes. Cost: $0 beyond the stake. Time: 10 minutes.',
      'Claim $B2 rewards monthly and decide in advance whether to hold or sell them - they are liquid, so this is portfolio management, not points farming. Cost: claim fees. Time: 10 minutes a month.',
      'Unstaking takes about 24 hours before you can bridge back; log the stake, claims and the 24h delay in your farm log so the exit is never a surprise. Cost: $0. Time: 15 minutes.',
    ],
    risks: [
      'Rewards are a live token ($B2): price risk from the day they are claimed',
      'The April 2025 airdrop snapshot has passed - no retroactive drop to farm',
      'Bridged BTC carries bridge and B2-network risk',
      'Unstake takes ~24 hours before funds can move',
    ],
  },
  {
    slug: 'opentrade',
    status: 'no-retail-farm',
    status_label: 'No retail farm - B2B, KYC-gated',
    points: 'No OpenTrade token and no points programme exist. OpenTrade is B2B infrastructure: direct access requires KYC/KYB onboarding and a whitelisted wallet, so there is no farm a retail wallet can run.',
    venue: 'None directly. Retail exposure only inside partner apps: WOO X Earn RWA vault, Littio, belo, Ontop, Nest on Plume',
    min_capital: 'Partner-app minimums only (the direct route has no retail size - it is not open to retail)',
    steps: [
      'Do not try to farm OpenTrade directly: it onboards institutions and platforms through KYC/KYB with whitelisted wallets. There is no points balance, no token and no retail vault to deposit into. Cost: $0. Time: 5 minutes.',
      'If you want the underlying yield (tokenised Treasury and credit products paying roughly 2-5.2%), take it through a partner app you already trust - the WOO X Earn RWA vault is the most accessible route. Cost: the partner app\'s minimum deposit. Time: 20 minutes.',
      'Other partner routes exist for specific regions (Littio, belo, Ontop, and Nest on Plume); use one only if it serves your country and you have verified it independently. Cost: as the app sets. Time: 20 minutes.',
      'Price this as plain yield, not as a farm: nothing you deposit accrues points or token eligibility anywhere, so compare the rate against a plain Treasury product and choose on yield and counterparty alone. Cost: $0. Time: 15 minutes.',
      'Re-check yearly whether OpenTrade has opened a retail product or programme; until its own site documents one, this entry stays a no-farm. Cost: $0. Time: 10 minutes a year.',
    ],
    risks: [
      'Insufficient retail access: direct route is KYC/KYB and whitelist gated',
      'No token or points - yield only, at 2-5.2%',
      'Partner-app exposure adds a second counterparty on top of OpenTrade',
    ],
  },
  {
    slug: 'clearstar',
    status: 'yield-only',
    status_label: 'Yield only - no points',
    points: 'No Clearstar points programme or token is documented. The farm is curated lending yield on Morpho (Base); Clearstar Labs is operated by NovaFusion SA.',
    venue: 'Morpho app on Base: Clearstar cbAssets Vault; optional earnXRP via Upshift on Flare',
    min_capital: '$250-$500 on Base',
    steps: [
      'Set up a dedicated farming wallet, seed phrase on paper, offline; fund it with USDC on Base. Cost: $0 plus under $0.10 of gas. Time: 15 minutes, once.',
      'In the Morpho app, deposit $250-$500 of USDC into the Clearstar cbAssets Vault (about 25.9M USDC in size and about 6.2% APY at research snapshots) and hold the shares. Cost: the deposit, gas under $0.10. Time: 10 minutes.',
      'Avoid the sibling product Yield Clearstar USDC: it charges a 25% performance fee and lends against frontier collateral for a lower net APY - the worse deal wearing the same brand. Cost of ignoring this: a quarter of your yield. Time: 5 minutes to check the vault name.',
      'Treat the Clearstar Base RWA vault with care despite its 0% fee: about 99% of it sat in a single market (mGLO) at research time, so it is a concentrated position, not a diversified one. Cost: $0. Time: 5 minutes to read the allocation.',
      'Optional XRP route: earnXRP on Upshift over Flare (FXRP) pays XRP-denominated yield with a 72-hour withdrawal window - only for capital already held in XRP. Log the main position monthly and exit through Morpho. Cost: $0. Time: 10 minutes a month.',
    ],
    risks: [
      'No points or token: returns are yield only',
      'Yield Clearstar USDC takes a 25% performance fee against frontier collateral',
      'Base RWA vault is ~99% concentrated in one market (mGLO)',
      'earnXRP withdrawals take 72 hours',
    ],
  },
  {
    slug: 'upshift',
    status: 'points-live',
    status_label: 'Points live - Season 2, no token announced',
    points: 'Upshift Points Season 2 is live (began 2 Jul 2025): deposits earn 1x, rising to 5x while total Upshift deposits stay under $750M, partner markets up to 7.5x, and Monday Acceleration Missions have paid 10x. No token is announced - the points are unpriced optionality on top of real vault yield.',
    venue: 'Upshift app: Sentora USD (sentUSD), Upshift USDC (upUSDC), Gamma USDC and partner markets',
    min_capital: '$250-$1,000 (points are per-dollar, and redemptions are queued, so size for a hold)',
    steps: [
      'Set up a dedicated farming wallet, seed phrase on paper, offline. Read the Season 2 points rules in the Upshift app before depositing: the 5x multiplier applies only while total deposits stay under $750M, so the rate you start at is not guaranteed. Cost: $0. Time: 20 minutes.',
      'Deposit $250-$1,000 into one flagship vault: Sentora USD (sentUSD, about 7.31% 30-day APY at research snapshots), Upshift USDC (upUSDC, about 5.35%), or Gamma USDC Enhanced (about 13.96%, with the risk that pays for the difference). Cost: the deposit plus gas. Time: 15 minutes.',
      'Check the app every Monday for Acceleration Missions, which have paid 10x points; partner markets can pay up to 7.5x if you deliberately route part of the position there. Cost: $0 to check. Time: 15 minutes a week.',
      'Hold through redemption terms you have read first: exits are epoch-based or queued (at least a day, some vaults 7-30 days), or instant for a fee. Never size this farm with money needed inside a month. Cost: $0. Time: 5 minutes.',
      'Log points, multiplier tier and vault weekly. The honest expectation: real yield now, points that may never convert - Upshift has announced no token, so never pay a premium anywhere for "Upshift exposure". Cost: $0. Time: 10 minutes a week.',
    ],
    risks: [
      'No token announced: points are unpriced optionality and may convert to nothing',
      'The 5x multiplier lasts only while total deposits stay under $750M',
      'Redemptions are queued: 1 day minimum, some vaults 7-30 days, or instant for a fee',
      'Contagion precedent: the Kelp DAO exploit (Apr 2026) forced Upshift vault freezes',
    ],
  },
  {
    slug: 'cian-yield-layer',
    status: 'points-unverified',
    status_label: 'Points documented - live accrual NOT verified',
    points: 'CIAN Voyage Points are documented (points on unleveraged deposit value, plus Galxe OAT, Ambassador, Whitelist and Proposal points), but whether points were still accruing in Nov 2026 was NOT verified. No token and no conversion rate are published.',
    venue: 'CIAN app on Ethereum: stETH Yield Layer (deposit stETH/wstETH, receive ylstETH); points at point.cian.app',
    min_capital: 'A small test deposit first ($50-$100), scaling only after points visibly accrue',
    steps: [
      'Start with verification, not size: deposit a $50-$100 test amount of stETH or wstETH into the stETH Yield Layer, then check point.cian.app after a few days to confirm Voyage Points are actually accruing in November 2026. The programme is documented; its live status is not. Cost: the test deposit plus Ethereum gas. Time: 30 minutes.',
      'Only if points visibly move, scale the deposit up. Points are calculated on unleveraged deposit value - the recursive Aave looping inside the vault does NOT multiply your points, so do not pay loop risk expecting loop points. Cost: the scaled deposit plus gas. Time: 15 minutes.',
      'Understand the product you hold: ylstETH is a leveraged stETH position built by recursive Aave borrowing inside the vault, with a two-phase redemption process. Read both phases before depositing size. Cost: $0. Time: 20 minutes of reading.',
      'Pick up the side points only if they are free: Galxe OAT, Ambassador, Whitelist and Proposal points are documented alongside Voyage Points. Never buy anything to earn them. Cost: $0. Time: 15 minutes.',
      'Log the test result (did points accrue, at what rate) and the redemption timeline; if the test shows no accrual after a week, withdraw and treat CIAN as yield-only until CIAN documents otherwise. Cost: gas. Time: 15 minutes.',
    ],
    risks: [
      'Live points accrual in Nov 2026 is UNVERIFIED - test small before sizing',
      'Loop leverage does not multiply points, but does multiply liquidation risk',
      'Two-phase redemption: exits are not instant',
      'No token and no published conversion rate for points',
    ],
  },
  {
    slug: 'defi-saver-asset-management',
    status: 'no-retail-farm',
    status_label: 'Not a vault - nothing to farm',
    points: 'There is nothing to farm here: DeFi Saver Asset Management is not a vault. The TVL in its snapshot record measures users\' own positions on Aave, Maker and Compound that are managed through DeFi Saver Smart Wallets. No token has ever existed and no points or rewards are documented.',
    venue: 'None. DeFi Saver is tooling for managing positions on Aave, Maker, Compound and similar protocols',
    min_capital: 'None - there is no DeFi Saver position to size',
    steps: [
      'Do not deposit anything "into DeFi Saver": it takes no deposits. Its TVL figure is the sum of its users\' positions on other protocols, so a farm plan addressed to DeFi Saver itself would be farming an accounting label. Cost: $0. Time: 5 minutes.',
      'Use DeFi Saver for what it is - management tooling. If you run leveraged positions on Aave, Maker or Compound, its Smart Wallet automation (protection, boosts, one-transaction adjustments) can manage them for a 0.25% fee on advanced actions, plus 0.05% on automated ones. Cost: fees only when you act. Time: 30 minutes to set up.',
      'Farm the underlying protocols instead: any points or rewards come from Aave, Maker, Compound or the asset you hold - open those protocols\' own pages and follow their documented programmes, logging DeFi Saver only as the tool you used. Cost: as those programmes set. Time: varies.',
      'Re-check if DeFi Saver ever ships a token or rewards programme of its own; in a decade of operation it has not, so treat any "DeFi Saver airdrop" claim as a scam until its official channels say otherwise. Cost: $0. Time: 5 minutes.',
    ],
    risks: [
      'Not a farm: no token, no points, no rewards exist or are documented',
      'TVL is an accounting aggregate of users\' positions elsewhere, not a pool',
      'Fees apply to the tooling itself (0.25% advanced actions, +0.05% automated)',
    ],
  },
  {
    slug: 'plume-vaults',
    status: 'points-ended',
    status_label: 'POINTS ENDED 13 Mar 2026 - yield only now',
    points: 'Correction to v1-era assumptions: Plume Nest Points Season 1 accrual ENDED on 13 Mar 2026 and Plume Points Season 2 closed 31 Mar 2026. No live season is documented - new deposits earn vault yield only, and farming Plume for points today earns nothing.',
    venue: 'Nest vaults on Plume: nTBILL, nALPHA, nOPAL, nBASIS (yield only)',
    min_capital: '$250-$500, sized as a yield position, not a points farm',
    steps: [
      'Do not deposit for points: Nest Points Season 1 stopped accruing on 13 Mar 2026 and Season 2 closed on 31 Mar 2026. Any guide still presenting Plume points as live is out of date, and deposits made now earn no points at all. Cost: $0. Time: 5 minutes.',
      'If the yield itself is the goal, choose a Nest vault on its merits: nTBILL (about 3.7%), nBASIS (30-day about 6.8%), nALPHA (30-day about 9.08%) or nOPAL (30-day about 10.9%, Brazilian card receivables - the yield is high because the credit is real). Cost: the deposit plus gas. Time: 15 minutes.',
      'Check eligibility first: US persons and residents are excluded from these vaults. Cost: $0. Time: 5 minutes.',
      'Read the redemption window of the specific vault before depositing: most run 1-4 days, but nACRDX can take up to 90 days. Cost: $0. Time: 10 minutes.',
      'Log the position as yield-only with the points-ended flag, and re-check Plume\'s official channels quarterly for a genuinely new season announcement - only an official announcement restarts this farm. Cost: $0. Time: 10 minutes a quarter.',
    ],
    risks: [
      'Points are OVER: S1 accrual ended 13 Mar 2026, S2 closed 31 Mar 2026 - no points for new deposits',
      'US persons and residents are excluded',
      'Redemptions run 1-4 days, up to 90 days for nACRDX',
      'nOPAL yield is Brazilian card-receivable credit risk, not a free lunch',
    ],
  },
  {
    slug: 'symbiotic',
    status: 'points-live',
    status_label: 'Points live - terms say NO cash value',
    points: 'Symbiotic Points have run since Jun 2024 with no announced end: Core V2 accrues roughly 0.001 points per hour per $1 of stake actually allocated (idle pre-deposit collateral earns less; delegated stake earns 2x idle). Honesty flags: Symbiotic has NOT announced a token, and its terms state points carry NO cash or monetary value.',
    venue: 'Symbiotic app on Ethereum: restaking vaults (Core V2)',
    min_capital: '$500-$1,000 (points are per-dollar per-hour, and Ethereum gas applies)',
    steps: [
      'Set up a dedicated Ethereum wallet, seed phrase on paper, offline. Read the points terms first - including the sentence that points carry no cash or monetary value - so the position is sized as speculation, not savings. Cost: $0. Time: 20 minutes.',
      'Deposit $500-$1,000 of an accepted collateral asset into a Symbiotic Core V2 vault, and make sure the stake is actually ALLOCATED to a network: idle pre-deposit collateral earns materially fewer points than allocated stake (delegated stake earns 2x the idle rate). Cost: the deposit plus Ethereum gas. Time: 20 minutes.',
      'Choose the vault by its slashing terms, not its headline rate: slashing risk is real and vault-specific, and about 90%+ of points go to stakers with up to 5% each to operators and networks and up to 5% of points as curator admin fee. Cost: $0. Time: 30 minutes of reading.',
      'Hold and monitor monthly: points accrue per hour on allocated stake, so uptime of the allocation matters. Note the context in your log - Symbiotic TVL has fallen from about $2.7B to roughly $218M, which is either neglect or opportunity, but is not neutral. Cost: $0. Time: 15 minutes a month.',
      'Exit by withdrawing through the same vault and respecting its unbonding terms; if a token is ever formally announced, your points history is already recorded - until then, value the points at zero in your own accounts. Cost: gas. Time: 15 minutes.',
    ],
    risks: [
      'No token announced; the terms state points carry NO cash or monetary value',
      'Slashing risk is real and differs per vault and network',
      'Idle, unallocated collateral earns materially fewer points',
      'TVL has fallen from ~$2.7B to ~$218M - a much smaller system than at peak',
      'Ethereum only; mainnet gas applies',
    ],
  },
  {
    slug: 'r25',
    status: 'no-retail-farm',
    status_label: 'Insufficient info - gated, unpublished terms',
    points: 'No points or airdrop programme is documented anywhere for R25, and neither fees nor minimums are published. What exists is eligibility-gated RWA yield - not a farm a retail wallet can plan around.',
    venue: 'Sui lane (rcUSD, staked to rcUSDp) or Pharos lane (pRNH and Axil credit vaults) - both gated',
    min_capital: 'Not published - which is itself the finding',
    steps: [
      'Do not size a position here yet: R25 publishes no points programme, no fee schedule and no minimum, so there is nothing concrete to farm and no honest plan can promise one. Cost: $0. Time: 5 minutes.',
      'Understand the Sui lane before touching it: buy rcUSD, stake it to rcUSDp for yield - but redemption requires KYC, and rcUSD is an UNSECURED obligation of RiftWriter Company Limited. US, China and sanctioned-country residents are barred. Cost of the lesson: $0 if learned here. Time: 15 minutes.',
      'Understand the Pharos lane: the pRNH vault targets about 7%, and Axil credit vaults lock funds for 3 months with up to 20 further days for redemption. That is a quarter-year commitment to an opaque counterparty. Cost: $0 to decline. Time: 10 minutes.',
      'If you proceed anyway, proceed as a credit investor, not a farmer: smallest test size, written exit dates, and the KYC requirement accepted in advance. Log everything, because R25\'s own disclosures will not fill the gaps. Cost: test size only. Time: 30 minutes.',
      'Re-check quarterly for published fees, minimums or a documented programme; until R25 publishes them, this entry stays insufficient-information and no-farm. Cost: $0. Time: 10 minutes a quarter.',
    ],
    risks: [
      'Insufficient public information: no points, fees or minimums are published',
      'rcUSD is an UNSECURED obligation of RiftWriter Company Limited',
      'Redemption requires KYC; US, China and sanctioned residents are barred',
      'Axil vaults lock for 3 months plus up to 20 days redemption',
    ],
  },
  {
    slug: 'galaxy-curation',
    status: 'no-retail-farm',
    status_label: 'Institution-only - no retail product',
    points: 'No points programme and no Galaxy Curation token are documented. Galaxy Digital distributes its Morpho curation through Fireblocks Earn to 2,400+ institutional clients; there is no retail app, fee schedule, minimum or APY target published.',
    venue: 'None for retail. Permissionless Morpho listings exist (Galaxy USDC Quality, gUSDCq) but are unsupported for retail',
    min_capital: 'None - there is no retail position to size',
    steps: [
      'Do not plan a Galaxy Curation farm: the product is sold institutionally through Fireblocks Earn, and Galaxy publishes nothing a retail wallet can act on - no app, no fees, no minimums, no programme. Cost: $0. Time: 5 minutes.',
      'If you find Galaxy-curated vaults listed permissionlessly in the Morpho app (for example Galaxy USDC Quality, gUSDCq; a Galaxy USDC vault on Arc showed 0.97% APY at research snapshots), treat them as plain Morpho lending yield with no curator support channel for you. Cost: standard Morpho deposit, if you choose it. Time: 10 minutes.',
      'Price that choice honestly: at sub-1% to standard lending rates with no points and no token, the same USDC usually earns as much in a curator vault that actually documents its terms. Cost: $0. Time: 10 minutes to compare.',
      'Re-check if Galaxy ever launches a documented retail product; an institutional brand is not a farm. Cost: $0. Time: 10 minutes a year.',
    ],
    risks: [
      'Institution-only distribution (Fireblocks Earn, 2,400+ institutional clients)',
      'No retail app, fee schedule, minimum or APY target is published',
      'No points or token - plain lending yield at best',
    ],
  },
  {
    slug: 'lightning-network',
    status: 'no-retail-farm',
    status_label: 'No token by design - routing income only',
    points: 'There is no Lightning token, no points programme and no airdrop - by design, ever. The Lightning Network is a Bitcoin payments layer; the only income is routing fees and liquidity-lease premiums. Airdrop expected value is exactly zero.',
    venue: 'Your own Lightning node; liquidity marketplaces Amboss Magma and Lightning Pool',
    min_capital: 'About 0.05-0.1 BTC locked in channels before routing income matters',
    steps: [
      'Do not farm Lightning for an airdrop: none can exist. No token will be issued for routing payments, and any "Lightning airdrop" claim is a scam by definition. Cost: $0. Time: 5 minutes.',
      'If you want routing income as a business, run an always-online Lightning node and open channels with 0.05-0.1 BTC of capacity; below that, fees earned rarely cover the effort. Cost: the BTC locked in channels plus hardware and electricity. Time: a weekend to set up.',
      'Sell liquidity deliberately: lease channel capacity through Amboss Magma or Lightning Pool, where activity has historically earned about 1-4% APY (per Amboss figures), rather than hoping for organic routing flow. Cost: $0 beyond channel capital. Time: 1 hour to list.',
      'Budget the real work: 1-3 hours a week of channel rebalancing and node maintenance, every week, indefinitely. Routing is operations, not a deposit. Cost: your time. Time: 1-3 hours a week.',
      'Log fee income against the BTC locked and the hours spent quarterly; if the hourly return is poor, close channels and hold the BTC - the honest exit most routing guides skip. Cost: closing fees. Time: 1 hour a quarter.',
    ],
    risks: [
      'Airdrop expected value is exactly zero - no token exists or will',
      'Requires an always-online node and 0.05-0.1 BTC in channels to matter',
      'Ongoing operations: 1-3 hours a week of channel management',
      'Hot-wallet risk: node keys are online by necessity',
    ],
  },
  {
    slug: 'armitage-by-wintermute',
    status: 'yield-only',
    status_label: 'Yield only - no points',
    points: 'No Armitage or Wintermute points programme is documented. The farm is curated lending yield on Morpho (Ethereum), including vaults that lend against Wintermute\'s own unsecured debt - a conflict the plan prices openly.',
    venue: 'Morpho app on Ethereum: Wintermute USDC Prime or Wintermute USDC Select; Pendle Ecosystem vaults',
    min_capital: '$1,000+ (Ethereum gas)',
    steps: [
      'Set up a dedicated farming wallet, seed phrase on paper, offline; fund it with USDC on Ethereum. Cost: $0 plus Ethereum gas. Time: 15 minutes, once.',
      'Conservative route: in the Morpho app, deposit $1,000+ into Wintermute USDC Prime (target 4-5% at research time, 0% fees) and hold the shares. Cost: the deposit plus gas. Time: 10 minutes.',
      'Higher-yield route, only with the conflict understood: Wintermute USDC Select targets 5-8% but lends against v-wmtUSDC - Wintermute\'s own unsecured Wildcat debt. Wintermute is simultaneously borrower, issuer, curator and liquidator on that exposure. Size it as unsecured credit to one firm, not as a vault deposit. Cost: the deposit plus gas. Time: 20 minutes to read the allocation.',
      'Ignore anything calling itself Armitage Apex: the Apex tier is planned only and does not exist yet, so a live "Apex" vault is not Wintermute\'s. Pendle Ecosystem vaults (5%/10% performance fees) are a separate, documented alternative. Cost: $0. Time: 5 minutes.',
      'Hold for at least a quarter, log which side of the Prime/Select line each dollar sits on, and exit through Morpho; there are no points to protect, so the exit decision is purely yield versus credit risk. Cost: gas. Time: 15 minutes.',
    ],
    risks: [
      'No points programme: returns are yield only',
      'Select vaults lend against Wintermute\'s own unsecured debt - borrower, issuer, curator and liquidator are the same firm',
      'Armitage Apex does not exist yet; anything using the name is not official',
      'Ethereum gas makes small positions uneconomic',
    ],
  },
  {
    slug: 'saturn',
    status: 'points-live',
    status_label: 'Points live - but NOT Ethena-backed, read the flags',
    points: 'Orbital Points Season 2 runs 9 Aug to 8 Dec 2026 (hold USDat 5x, sUSDat 1x, Curve LPs 25x, Pendle YT-USDat 30x, AUSD borrow 2x) and STRN is confirmed with up to 5% of initial supply for S2 participants - BUT the STRN registration window (9-16 Nov 2026) is already CLOSED, and US/UK/EU residents are ineligible for the points programme.',
    venue: 'Saturn app: USDat and sUSDat, plus Curve and Pendle (YT-USDat) positions',
    min_capital: '$250-$500 (multipliers reward holding, but read the risk flags before sizing)',
    steps: [
      'Correct the record first: Saturn is NOT backed by Ethena. USDat is backed by tokenised Treasuries via $M (currently PYUSDx), and sUSDat yield comes from Strategy (MicroStrategy) STRC digital credit via Ondo - a very different risk from a Treasury bill. Cost: $0. Time: 10 minutes.',
      'Price the known accident: sUSDat crashed to about $0.70 in June 2026 when STRC repriced, and unstaking runs a 3-7 day queue, so you cannot exit mid-crash. Only size what can ride out a repeat. Cost: $0. Time: 5 minutes.',
      'Check eligibility before depositing: US, UK and EU residents are ineligible for the Orbital Points programme, and the STRN registration window closed on 16 Nov 2026 - if you did not register then, confirm in the app whether S2 points can still convert for you at all. Cost: $0. Time: 15 minutes.',
      'If eligible and registered: hold USDat for 5x points (it pays 0% yield - the points are the whole return) or sUSDat for 1x plus yield; Curve LPs pay 25x and Pendle YT-USDat 30x, with YT decaying to zero at expiry. Pick one line and understand it fully. Cost: $250-$500 of position. Time: 30 minutes.',
      'Log points, multiplier and the sUSDat price weekly; third-party risk reports flag admin-key and EOA upgrade control, so any governance surprise is an exit signal, not a discussion. Cost: $0. Time: 10 minutes a week.',
    ],
    risks: [
      'CORRECTION: Saturn is NOT Ethena-backed; sUSDat yield is Strategy STRC digital credit via Ondo',
      'sUSDat crashed to ~$0.70 in June 2026; unstake queue is 3-7 days',
      'STRN registration window (9-16 Nov 2026) is CLOSED - unregistered farmers may earn nothing',
      'US, UK and EU residents are ineligible for the points programme',
      'Admin-key / EOA upgrade findings in third-party risk reports',
    ],
  },
  {
    slug: 'tori-finance',
    status: 'points-live',
    status_label: 'Points live - docs say NOT a token promise',
    points: 'Cores points Season 1 began 23 Jun 2026 with no announced end date. Tori\'s own documentation states verbatim that "Cores are not a promise of any token or payment" - no token, tokenomics or TGE has been announced. Also corrected: the token is trUSD (staked: strUSD), not "toriUSD".',
    venue: 'Tori app: hold trUSD for Cores, or stake to strUSD for Cores plus yield',
    min_capital: '$250-$500 (Cores accrue on holdings; strUSD yield was about 10% APY at research snapshots)',
    steps: [
      'Set up a dedicated wallet, seed phrase on paper, offline, and read Tori\'s Cores documentation first - including its own sentence that Cores are not a promise of any token or payment. Enter only if the yield alone justifies it. Cost: $0. Time: 20 minutes.',
      'Acquire trUSD (note the name: trUSD, staked form strUSD - "toriUSD" in some trackers is wrong) and hold it to earn Cores only, or stake it to strUSD to earn Cores plus yield at about 10% APY at research snapshots, a rate that already nets out a 10% performance fee. Cost: $250-$500 of position. Time: 20 minutes.',
      'Understand the engine before sizing: returns come mostly from an OFF-CHAIN hedged money-market carry trade run by the desk, not from on-chain perpetual basis you can inspect. You are trusting the desk\'s reporting. Cost: $0. Time: 20 minutes of reading.',
      'Never use YT Lock positions: once locked, they can NEVER be withdrawn. And respect the 7-day unstake cooldown on strUSD when planning any exit. Cost of ignoring the lock warning: the whole locked position. Time: 5 minutes.',
      'Treat tracker multipliers (25x hold, 35x Ecosystem Vault, up to 45x Pendle) as stale late-October figures - verify the current rates in the app before acting on them. Log Cores and yield weekly, valuing Cores at zero until Tori announces otherwise. Cost: $0. Time: 10 minutes a week.',
    ],
    risks: [
      'Tori docs state Cores are "not a promise of any token or payment"; no TGE is announced',
      'The yield engine is mostly off-chain - returns rest on the desk\'s reporting',
      'YT Lock positions can NEVER be withdrawn once locked',
      '7-day unstake cooldown on strUSD',
      'Published multipliers are stale tracker figures - verify in-app',
    ],
  },
];

/** The researched plan for one snapshot slug, or undefined when the row keeps the template plan. */
export const PLAN_BY_SLUG: ReadonlyMap<string, ResearchedPlan> = new Map(RESEARCHED_PLANS.map((p) => [p.slug, p]));

/** How many of the board's protocols carry a hand-researched plan. */
export function researchedCount(): number {
  return RESEARCHED_PLANS.length;
}

// Method note: every fact in this file (programmes, multipliers, APYs, fees, dates, the sBOLD
// exploit, the Plume season end, the Saturn backing correction) comes from the 2026-11-24 hand
// research of the protocols' own documentation, apps and official channels, cross-checked
// against the research log the entry's SUBMIT-PLAN.md points to. Figures are snapshots from
// that research, stated as such in the plan text; programmes change, and each plan tells the
// reader where to re-verify (the protocol's own app or docs) before moving funds.
