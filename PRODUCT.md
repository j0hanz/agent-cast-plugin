# Product

## Register

product

## Users

A solo developer running Claude Code locally with the AgentCast plugin installed. They are the only user — this is not a shared or multi-tenant tool. Their context: an autonomous coding agent is out working a closed-loop frontend workflow (build, preview, screenshot-critique, refine, test) against a project via the Playwright MCP server, and the developer needs to see and trust what it did.

## Product Purpose

AgentCast is a mission-control dashboard for an AI coding agent's frontend work loop. It surfaces prototypes, versions, screenshots, test results, session state, and the raw MCP call log so the developer can audit exactly what the agent did and why — not just a live status glance, but a deep, traceable record they can dig back through. Success looks like: the developer never has to wonder "what did the agent actually just do" — every screenshot, call, and state transition is inspectable after the fact.

## Brand Personality

Technical, instrument-panel, cockpit/mission-control. Precise and quiet by default; amber is the one signal color, reserved for "live" so it never gets diluted into decoration. No hand-holding, no onboarding chrome — built for one operator who already knows the system. Data density over decoration; real timestamps and derived state over hand-toggled flags or vanity summaries.

## Anti-references

No specific named anti-references. Avoid generic consumer-SaaS dashboard clichés: cheerful multi-color widget grids, cards-as-default-affordance, gradient accents, celebratory micro-copy. This is a panel a solo operator reads under work pressure, not a product being sold to a buyer.

## Design Principles

- **Instrument-panel clarity** — every panel answers "what is the agent doing, and can I trust it" at a glance, before it answers anything else.
- **Audit trail over vanity metrics** — depth and traceability (MCP calls, screenshots, timestamps) win over decorative summarization or rollup stats.
- **Quiet chrome, amber signal** — structure stays neutral graphite; amber is spent exclusively on "live"/active state so it keeps its meaning.
- **Solo-operator efficiency** — no onboarding, tooltips-for-strangers, or persuasive copy; the audience already knows the system.
- **Real data, no staleness** — state derives from actual events and timestamps (e.g. agent-running status derived from the latest screenshot's `capturedAt`) rather than flags that can drift stale.

## Accessibility & Inclusion

Target WCAG AAA contrast (7:1 body text) where practical, beyond the AA baseline already in the token set. `prefers-reduced-motion` must be respected for every animation (already covered for the status pulse; extend the same pattern to any future motion).
