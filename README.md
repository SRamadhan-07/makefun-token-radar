# SONAR - Token Launch Radar

`make.fun bounty · token-radar-01` · `USDC pool · $1,325` · `first place · $1,000`

**Bounty:** [Build the best token launch radar](https://make.fun/bounty/token-radar-01)

SONAR ranks the pre-token protocols in a sealed DefiLlama snapshot by implied launch value.
The value model (SONAR-2) learns what the market pays for a dollar of TVL in each category
from the snapshot's own already-trading protocols, then prices every pre-token protocol with
that multiple, adjusted for growth, maturity and chain reach. This v2 package keeps that
ranking exactly as submitted in v1 - it reproduced the official snapshot board when
re-derived - and rebuilds the farm-plan layer: the top 27 protocols on the board now carry
farm plans researched by hand on 2026-11-24, each with an honest status. Six have a live
points programme (BitFi, OnRe, Upshift, Symbiotic, Saturn, Tori); several famous names run
no points at all and are labelled yield-only; Plume's points are flagged as ended
(13 Mar 2026); K3 Capital's sBOLD vault carries a do-not-deposit flag after its
~$3.43M exploit on 18 Nov 2026; Saturn is corrected as not Ethena-backed; USDD and
Bittensor dTAO are corrected as already trading. Rows outside the researched batch keep a
category-template plan and are labelled as template plans, in the data and on the page.

## Run it

Requires Node 22 (standard library only, no dependencies, no network):

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts --input <path-to>/snapshot.json
```

The program writes `board.json` (the ranked board), `data.js` (the dashboard's dataset),
copies `dashboard/` and `screenshots/` into the output, and writes `dossier.json` last,
using the unmodified `vendor/makefun-board.ts`.

## Layout

- `main.ts` - entry point: parse, rank, validate against the gate, write the output.
- `lib/model.ts` - the SONAR-2 model: snapshot parsing, category multiples with log-space
  shrinkage, implied values, board construction, gate self-check, dashboard data.
- `lib/farmbook.ts` - the v2 layer: 27 hand-researched farm plans as structured data
  (status, points verdict, venue, sensible capital, steps, risks), keyed by snapshot slug.
- `dashboard/` - a self-contained page (no fetch, no external assets): sortable and
  filterable board, per-protocol detail with the model breakdown and the full farm plan,
  status badges and risk lists, plus an "already trading" view of the pricing peers.
- `screenshots/` - the board, a researched detail view, and the safety-flags filter view.
- `vendor/makefun-board.ts` - the kit's dossier builder, byte-identical to the starter.

## The model in one paragraph

For every tokenised protocol in the snapshot, take mcap / TVL; winsorise the ratios at the
snapshot's own 90th percentile; group by category and take medians; shrink each category
median toward the global median in log space with K = 5 pseudo-peers. Price a pre-token
protocol at TVL x its category multiple x growth x maturity x reach x 0.85 launch discount.
The watchlist is covered in full; exchange, bridge, staking-wrapper and versioned-pool
records are excluded from the early radar because they are products of other protocols,
not launches.

## Reading the farm plans

Every board row states `farm.source` (`researched` or `template`) and, for researched rows,
a status: `points-live`, `points-unverified`, `yield-only`, `cash-rewards`, `points-ended`,
`do-not-deposit`, `already-trading`, or `no-retail-farm`. A plan that says there is nothing
to farm is a research result, not a gap: it means the protocol's own documentation offers a
retail wallet nothing to earn, and inventing steps would mislead the reader. Figures in the
plans are snapshots from the 2026-11-24 research and are labelled as such; programmes
change, so each plan names the official place to re-verify before moving funds.

## Safety notes

Plans never ask for a seed phrase, never route through third-party "claim" services, and
flag the dangerous cases in the plan text itself: the exploited sBOLD vault, Saturn's closed
STRN registration window and ineligible regions, Tori's never-withdrawable YT Lock
positions, and R25's unsecured, KYC-gated rcUSD. This is research, not financial advice.

## Provenance

Farm-plan facts were hand-researched on 2026-11-24 from the protocols' own documentation,
apps and official channels (programmes, multipliers, APYs, fees, exploit and season-end
dates), and are stored as data in `lib/farmbook.ts` with a method note. The screenshots in
`screenshots/` are rendered from this entry's own generated dataset - the same numbers the
dashboard displays - so the pictures and the code cannot drift apart.
