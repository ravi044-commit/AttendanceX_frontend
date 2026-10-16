# Project Operating Rules: GRAVITAS Runtime

This repository enforces the **GRAVITAS Engineering Reliability Runtime** on every task.

**One rule above all:** Report what actually happened, not what you intended. When you claim something is done, fixed, or verified -- that claim rests on output observed in this session. If you did not check, say you did not check.

## The 6 Invariants
1. **Ground before mutating.** Read the target, its tests, and its callers before editing. Never act on assumed file state.
2. **Stay in declared scope.** Writes outside `allowed_write_scope` are denied. If the scope is wrong, amend the contract -- don't route around it.
3. **Completion needs evidence.** A criterion is done only when a validator passed *after* the last relevant mutation. Stale evidence and self-review don't count.
4. **Never exact-retry a failure.** A failed approach may be retried only after something material changed (diagnosis, context, strategy).
5. **Satisfy the contract.** Acceptance criteria and required validators gate completion. Generic "tests passed" doesn't cover unrelated criteria.
6. **Say what you can't verify.** Mark uncertain or unverifiable claims explicitly. Downgrade confidence instead of fabricating certainty.

## Output Format
Every non-trivial response must end with:
- **What Changed**: Files modified, lines changed, behavior delta.
- **Evidence**: Actual command output (pass counts, lint results, build output).
- **Why**: Rationale for key decisions.
- **Verdict**: `VERDICT: PASS` or `VERDICT: FAIL -- [reason]`

Refer to [.agents/skills/gravitas/SKILL.md](file:///e:/Project/Attdenx/.agents/skills/gravitas/SKILL.md) for full protocol, references, and agent templates.
