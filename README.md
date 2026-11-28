# SONAR-3 — Token Launch Radar
[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/SRamadhan-07/makefun-token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/SRamadhan-07/makefun-token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

`make.fun bounty · token-radar-01` · `USDC pool · $1,325` · `first place · $1,000`

SONAR-3 scans all 758 protocols in the sealed DefiLlama snapshot. Of those,
342 record no token; the board ranks the 198 of them that also pass the
launch-eligibility rule below — including all 40 watchlist protocols — by the
value its token would carry if its record stayed as it is, and shows what to
do about each one. An implied value here is this entry's own model output. It
is not a prediction that a token will launch, and it is not financial advice.

## The model (SONAR-3)

No name is hardcoded anywhere in the pricing path. The snapshot's tokenised
protocols are the teachers: each gives a market observation of what one dollar
of TVL is worth in its category (market cap ÷ TVL). Those ratios are
winsorised at the snapshot's own 90th percentile, grouped by category, and
each category's median is shrunk toward the global median in log space with
K = 5 pseudo-peers — a 1-peer category is mostly the global median, a 20-peer
category is mostly itself. A pre-token protocol is then priced as:

```
implied = TVL × category multiple × growth factor × maturity factor × 0.85
```

Growth is damped (7-day change clamped to −50%/+100%, halved into the
factor). Maturity rewards time survived with no token recorded, on a slow log
curve capped at 1.7×. The 0.85 is a flat launch discount: first tokens usually
price below mature-peer parity.

**Launch eligibility** decides who is on the board at all, and it is a rule
over snapshot fields (category + name), never a hardcoded slug list — the
same rule the snapshot's own watchlist was built with. A protocol that
records no token is still not a launch candidate when it is a wrapped,
staked or bridged product of a token that already trades: its category is
Bridge, Canonical Bridge, Liquid Staking, Liquid Restaking, Restaked BTC or
CEX; its name ends in a version marker (a space followed by V2, v2, 2.0 or
the like); its name carries a whole word wrapped, staked or staking in any
case; or its name begins with an exchange's name (Binance, Coinbase, Bybit,
Kraken, Bitget, OKX, Bitfinex, Gemini). That is why WBTC, the Coinbase and
Binance bridges and the exchange records themselves are not ranked: they
were never pre-token protocols. The funnel — 758 scanned → 342 record no
token → 198 eligible → 198 ranked — is stated in `board.json` metadata and
on the dashboard's model panel.

Three things are new in SONAR-3 and exist because a point estimate alone
overstates what this kind of model knows:

- **A range on every row.** The same waterfall rerun with the category's p25
  and p75 peer multiples, so each row shows an implied-value range, not a
  single confident number.
- **A confidence grade (A–D) on every row**, derived from the category's peer
  count and the dispersion of its multiples. A row priced off one peer never
  grades above C; the grade is printed on the board, not buried.
- **A leave-one-out self-validation on every run.** Each tokenised protocol
  is hidden in turn and priced from its remaining category peers; the median
  (and mean) absolute percentage error is written into `board.json` metadata
  and printed on the dashboard's model panel. The model grades itself against
  answers it can check, and publishes the score.

Seven rows are flagged **already-trading**: the snapshot records no token for
them, but hand research proves one trades in the real world (USDD, Bittensor
dTAO, Figure Markets Exchange, Doppler Finance, InfiniFi, Apex Omni, Manta
CeDeFi). They stay on the board — coverage is the floor — but they are
labelled in the data (`token_status`) and on the page, never passed off as
pre-token opportunities.

## The farm layer

61 protocols carry **hand-researched farm plans** (researched 2026-11-24 and
2026-11-27 from the protocols' own docs, apps and official channels), each
with a status from one taxonomy — `points-live`, `yield-only`,
`no-retail-farm`, `already-trading`, `cash-rewards`, `points-unverified`,
`points-ended`, `do-not-deposit` — a one-line points verdict, the real venue,
sensible minimum capital, concrete steps carrying costs and times, a
plan-level total cost and time, and risks.

The research corrects the snapshot where the snapshot is wrong, and says so:
Doppler's XDP claim window closes 28 Nov 2026; Extended's and Nado's points
have **ended**; InfiniFi's TGE already happened; Saturn is not Ethena-backed;
Tori's token is trUSD and its engine is off-chain carry; K3 Capital's sBOLD
vault (exploited ~$3.43M) and b14g's CORE leg (∼97M CORE withdrawn without
authorisation) carry do-not-deposit flags; Curvance keeps live points and a
documented governance warning side by side.

Every other row carries a **category-template plan** generated by
`lib/templates.ts` and labelled `source: 'template'` in the data and
"template plan" on the dashboard. A template never invents a points
programme: its first step is how to verify whether one exists. A plan that
says there is nothing to farm is a research result, not a gap.

## The dashboard

A static, offline page (no framework, no network references): a sortable
board (rank, implied value, TVL, growth) with search and faceted filters with
counts — All / Watchlist / Early / Researched / Points live / Yield only /
No retail farm / Already trading / Safety flags. Each row shows its implied
value **and range**, its confidence grade, and its farm status badge with the
points verdict as a tooltip. The detail view shows the full valuation
waterfall (TVL → ×multiple → ×growth → ×maturity → ×discount → implied),
model inputs tagged by provenance (snapshot / derived / researched), and the
complete farm plan, with red alert styling on do-not-deposit rows. A model
panel states the methodology in plain words, the LOOCV error the run
computed, and every category's peer count and multiples.

The three screenshots are rendered with PIL from this program's own
generated dataset, in the dashboard's palette, so the numbers in the
pictures are the numbers the program produced.

## Run it

Requires Node 22 (standard library only, no dependencies, no network):

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts --input <path-to>/snapshot.json
```

The program writes `board.json` (198 ranked rows plus model metadata),
`data.js` (the dashboard's dataset), copies `dashboard/` and `screenshots/`
into the output, and writes `dossier.json` last, using the unmodified
`vendor/makefun-board.ts`. It self-checks the gate's shape before writing
(row count, watchlist coverage 40/40, ranks exactly 1..N, implied values
non-increasing, every farm step 20–600 characters) and fails loudly instead
of emitting an invalid board. Two runs produce byte-identical outputs.

## Layout

- `main.ts` — entry point: parse, price, attach farm plans, validate, write.
- `lib/model.ts` — SONAR-3: peer multiples with winsorising and log-space
  shrinkage, ranges, confidence grades, LOOCV validation.
- `lib/farmbook.ts` — the 61 hand-researched farm plans as structured data.
- `lib/templates.ts` — category-template plans for the remaining rows.
- `dashboard/` — the page: `index.html`, `app.css`, `app.js`.
- `screenshots/` — board, a researched detail view, the safety-flags filter.
- `vendor/makefun-board.ts` — the kit's dossier builder, byte-identical.
