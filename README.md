# makefun-token-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/SRamadhan-07/makefun-token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/SRamadhan-07/makefun-token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

SONAR is a token launch radar over the sealed DefiLlama snapshot of 758 protocols. It ranks 198 pre-token protocols — all 40 of the snapshot's watchlist plus 158 early finds below the floor — by an implied token value derived only from the snapshot's own figures: each protocol's TVL is multiplied by its category's median market-cap/TVL multiple among already-tokenised peers (winsorised at the snapshot's 90th percentile and shrunk toward the global median in log space), then adjusted for seven-day TVL growth, length of track record and chain reach, with a flat launch discount. Every row carries a seven-step farm plan with concrete costs and durations. The dashboard is a static, offline page: a sortable, filterable board, a detail view per protocol showing the value waterfall factor by factor, and a separate live-tokens view of the already-tokenised protocols, which serve only as the model's pricing peers and are never ranked.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input snapshot.json
```

---

Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards
