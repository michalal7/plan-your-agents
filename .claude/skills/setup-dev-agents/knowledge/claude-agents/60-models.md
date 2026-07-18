# Models & effort

Model choice and effort levels change fast. This file is a reference point, not a substitute for `/model` and the current model docs. Version/date figures come from the fan-made source (Boris threads); the curator has a knowledge cutoff of May 2025 and can't confirm the specific versions from its own knowledge — verify against docs.claude.com before any safety-/pricing-relevant use.

## Effort levels
- Scale: `low → medium → high → xhigh → max`. Set via `/effort` or `/model`.
- **`low/medium/high/xhigh` persist across sessions; `max` lasts only the session** (except via env `CLAUDE_CODE_EFFORT_LEVEL`). The settings field `effortLevel` only goes up to `xhigh`. `xhigh` doesn't exist on Opus 4.6/Sonnet 4.6.
- Since Opus 4.7: adaptive thinking — the model decides for itself when thinking helps.
- Boris default: high effort for everything; `max` only for the hardest tasks.
- `ultracode` = `xhigh` + automatic workflow orchestration (`30-workflows.md`).

## Version history (fan-made, chronological)
| Model | Date (source) | What matters |
|---|---|---|
| **Opus 4.5** | Jan 2026 | Thinking mode for everything; "less steering + better tool use = faster" |
| **Opus 4.6** | ~Feb–Mar 2026 | Fast Mode; **Auto Mode replaces Plan Mode** (`90-deprecated.md`) |
| **Opus 4.7** | Apr 2026 | Default effort `xhigh`; adaptive thinking. Three shifts vs. 4.6: calibrated response length, less automatic tool use, more sparing subagent spawning |
| **Opus 4.8** | May 2026 | "strongest coding model", more honest about its own work; default effort back to `high` (same tokens as 4.7, better output); Fast Mode (preview, ~2.5×); rate limits raised |
| **Fable 5** | Jun 2026 (Part 17) | **Strongest coding model, replaces Opus 4.8 as the coding default.** Alias `fable` doc-verified (= Claude Fable 5); the detailed figures below are fan-made. |

Verified model aliases: `default`, `best`, `fable`, `sonnet`, `opus`, `haiku`, `sonnet[1m]`, `opus[1m]`, `opusplan`. Documented IDs: `claude-opus-4-8`, `claude-sonnet-5`, `claude-haiku-4-5`, `claude-opus-4-6`, `claude-sonnet-4-5`. Note: `inherit` is a value of the subagent `model` field, but not a model alias. The naming scheme keeps changing — rely on `/model`.

## Fable 5 — details (Part 17, fan-made)
- Positioning: "Mythos-class model, safe for general use"; per the source SOTA on nearly all benchmarks, with the lead growing with task length/complexity.
- Specs (fan-made): model ID `claude-fable-5`, 1M context, 128K max output, adaptive thinking, knowledge cutoff Jan 2026, no Fast Mode yet. Price $10/M in · $50/M out (2× Opus 4.8).
- Behavior: self-verifying debugging "out of the box" (measures, logs, verifies before "done") — verification (#1) + 4.8 honesty in the base model.
- ⚠️ The safety classifier is currently "trigger-happy" (flags normal debugging as cyber/bio); on the affected benchmarks Fable falls closer to Opus 4.8. Fable-specific effort/best practices are still undocumented.
- Consequence: the new default for coding; "less prompts and steers" → minimalism (#2) + delegation (#4); the autonomy stack (Auto Mode, `/goal`, nested subagents, workflows) pays off more.

## Fallback chains — what runs when the primary is overloaded (verified)
`fallbackModel` takes an **array**, tried in order: `{"fallbackModel": ["claude-sonnet-5", "claude-haiku-4-5"]}`. CLI `--fallback-model sonnet,haiku` wins over the setting.
- **Capped at three models** after duplicate removal; extras are silently ignored.
- The switch **lasts the current turn only** — it is overload relief, not a downgrade that sticks.
- `/status` does not show the chain, so a run can be on a fallback without it being visible. Worth knowing before attributing a quality drop to the prompt.
Source: /en/model-config#fallback-model-chains (verified 2026-07-18).

## Practical consequences for the setup agent
- Higher effort ⇒ less steering needed, but more tokens/time. For routine `high`, for hard one-off problems `xhigh`/`max`.
- Newer models plan implicitly and spawn subagents more selectively → explicit Plan Mode/subagent enforcement from older advice is often unnecessary (`90-deprecated.md`).
- In workflows/teams every agent uses the session model unless routed otherwise; set team-wide teammate defaults separately in `/config`.
