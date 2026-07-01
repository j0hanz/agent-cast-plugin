---
name: AgentCast
description: Instrument-panel control center for an autonomous frontend coding agent's build-preview-critique-test loop.
colors:
  bg: "#0b0c0d"
  surface: "#15171a"
  surface-2: "#1e2125"
  line: "#ffffff12"
  line-2: "#ffffff1f"
  text: "#f4f6f7"
  dim: "#c8cdd2"
  mut: "#b0b6c0"
  accent: "#f5a524"
  accent-text: "#f8c069"
  ok: "#34d399"
  warn: "#fb923c"
  bad: "#f87171"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw + 0.5rem, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(1.2rem, 1.8vw + 0.4rem, 1.45rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
  readout:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  s0: "4px"
  s1: "8px"
  s2: "12px"
  s3: "16px"
  s4: "24px"
  s5: "32px"
components:
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.dim}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "12px"
    height: "44px"
  nav-item-active:
    backgroundColor: "rgba(245, 165, 36, 0.08)"
    textColor: "{colors.accent-text}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "12px"
    height: "44px"
  panel-title:
    backgroundColor: "rgba(255, 255, 255, 0.015)"
    textColor: "{colors.accent-text}"
    typography: "{typography.label}"
    padding: "12px 16px"
  status-pill-live:
    backgroundColor: "rgba(245, 165, 36, 0.08)"
    textColor: "{colors.accent-text}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  search-input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "36px"
  chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.dim}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "30px"
  chip-active:
    backgroundColor: "rgba(245, 165, 36, 0.08)"
    textColor: "{colors.accent-text}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "30px"
  seg-button-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
    rounded: "3px"
  prototype-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
---

# Design System: AgentCast

## 1. Overview

**Creative North Star: "The Phosphor Viewfinder"**

AgentCast reads as an old CRT instrument that happens to watch a camera: a dark graphite console lit by a single amber phosphor signal, aimed through a viewfinder at whatever the agent is building. The reticle brackets, crosshair, "capture region" readout, and CRT scanline texture on every screenshot preview aren't decoration — they're the console's own language for saying *this is what's being observed right now*. Everything else stays quiet on purpose: neutral graphite chrome, no second accent, no celebratory color, so that when amber appears it means exactly one thing — live.

This is a solo operator's panel, not a pitch deck. It rejects the cheerful, cards-everywhere, gradient-accented consumer-SaaS look. Density and traceability (timestamps, call logs, tabular-nums readouts) are the point; warmth and persuasion are not.

**Key Characteristics:**
- Near-black graphite base with exactly one signal color (amber), spent only on "live"
- Camera/instrument motif: crop-bracket corners, crosshair, grid overlay, scanline texture
- Three-voice type system: geometric display, humanist body, monospace readout — each with one job
- Panels are physically layered (heavy ambient shadow), cards lift and glow amber on hover
- Status is always derived from real data (timestamps, call counts), never a hand-set flag

## 2. Colors

A near-black neutral base carries almost the whole surface; amber phosphor is the only color allowed to mean "alive."

### Primary
- **Amber Phosphor** (`#f5a524`): The live signal. Reserved exclusively for active/running state — the agent-running pill, the live nav item, the capture-region record dot, card hover glow. Never used decoratively.
- **Amber Phosphor (Text)** (`#f8c069`): Lighter tint of the accent, used wherever amber sits as *text* on a dark chip/pill so it clears body-text contrast rather than reusing the saturated swatch value directly.

### Tertiary: Status Signals
- **Pass Green** (`#34d399`): Passed tests, healthy state.
- **Caution Orange** (`#fb923c`): Warnings. Deliberately shifted away from the accent's hue so a warning is never mistaken for "live."
- **Fail Red** (`#f87171`): Failed tests, errors.

### Neutral
- **Void** (`#0b0c0d`): App background.
- **Graphite Surface** (`#15171a`): Sidebar and panel background — the primary raised surface.
- **Raised Graphite** (`#1e2125`): Second-order raised surface (inputs, chips, thumbnail frames, code-adjacent chrome) — one step lighter than Surface so nested chrome stays legible without a border.
- **Phosphor White** (`#f4f6f7`): Primary text.
- **Dim Signal** (`#c8cdd2`): Secondary text — nav labels, unselected toggle text.
- **Muted Steel** (`#b0b6c0`): Tertiary text and icon stroke — meta rows, timestamps, placeholder copy. Clears 8.8:1 against Surface and 7.9:1 against Surface-2 — WCAG AAA, not just AA, for its role.
- **Hairline** (`#ffffff12` / `#ffffff1f`): Structural borders and dividers. Kept as a neutral white overlay, never tinted amber, so structure and "live" signal never compete.

### Named Rules
**The Single Signal Rule.** Amber is the only saturated color in the system and it means exactly one thing: live/active. It never appears as a generic "brand" accent, a link color, or a decorative highlight — if a state isn't live, it doesn't get amber.

**The Warning-Is-Not-Live Rule.** Caution Orange (`#fb923c`) is deliberately a different hue-and-saturation from Amber Phosphor so a warning state can never be misread as the live signal at a glance.

## 3. Typography

**Display Font:** Space Grotesk (with sans-serif fallback)
**Body Font:** IBM Plex Sans (with system-ui, sans-serif fallback)
**Readout Font:** JetBrains Mono (with monospace fallback)

**Character:** A geometric, slightly technical display face for structure and chrome, paired against a humanist sans for the rare block of prose, with a monospace face doing all the actual instrument reading — timestamps, counts, IDs, URLs, log lines. The contrast between the three is what makes the panel read as instrumentation rather than a plain content app.

### Hierarchy
- **Display** (700, `clamp(1.5rem, 2.5vw + 0.5rem, 2rem)`, 1.2): Page-level `h1`, -0.03em tracking.
- **Headline** (700, `clamp(1.2rem, 1.8vw + 0.4rem, 1.45rem)`, 1.25): Section `h2` and in-page `.dhead` headers, -0.02em tracking.
- **Title** (700, 15px, 1.3): Card titles, empty-state `h2`, nav item labels.
- **Body** (400, 14px, 1.6): The one block of actual prose in the app (empty states, error copy). Capped conceptually at 65-75ch even though most surfaces here are far narrower.
- **Label** (700, 13px, uppercase, 0.08em tracking): Panel titles, chip/pill text, segmented-control text — the "control chrome" label voice.
- **Readout** (500, 11px, monospace, tabular-nums where numeric): Timestamps, MCP call args, log rows, key/value values, URLs. If it's data rather than UI chrome, it's in this voice.

### Named Rules
**The Three-Voice Rule.** Display is structure, Body is prose, Readout is data. A given piece of text uses exactly one; mixing families within a single string (e.g. a display-font label next to a mono-font value) is the point, not an inconsistency.

## 4. Elevation

Panels are layered, not flat: every surface carries an ambient drop shadow plus a 1px inset top-hairline highlight, so raised chrome always reads as physically sitting above the void background. Nothing elevates further on hover except interactive cards, which lift 4px and gain an amber-tinted glow — elevation change is reserved for things the user can act on.

### Shadow Vocabulary
- **Ambient panel** (`box-shadow: 0 12px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.03)`): Default resting state for every panel/card/preview surface.
- **Hairline highlight** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.02)`): Standalone top-edge highlight for raised chrome that doesn't need the full ambient shadow (active nav items, status readouts).
- **Interactive lift** (`box-shadow: 0 12px 30px rgba(0,0,0,.4), 0 0 20px rgba(245,165,36,.1)`): Hover state for clickable cards — adds the amber glow on top of the ambient shadow.
- **Sidebar separation** (`box-shadow: 4px 0 30px rgba(0,0,0,.25)`): Structural shadow separating the sidebar column from the main content, not tied to interaction.

### Named Rules
**The Amber Glow Rule.** Hover elevation never just gets darker or bigger — it adds an amber-tinted glow on top of the existing ambient shadow. Elevation and "this is interactive" are announced together, in the one signal color.

## 5. Components

### Buttons (Segmented Control / Chips)
There is no traditional filled button in this system — control selection happens through a segmented control (`Seg`) or chip row (`Chips`), both instrument-precise rather than soft.
- **Shape:** 6px radius container, 3px-smaller radius on the active pixel inside a Seg group; chips are fully height-defined pills (30px).
- **Active/Selected:** Seg's active option fills solid Amber Phosphor with Void text and an amber shadow; a Chip's active state instead uses the soft amber tint (`rgba(245,165,36,.08)`) with Amber Phosphor (Text) — deliberately two different "selected" treatments so a Seg (single, exclusive choice) never looks like a Chip (a filter toggle).
- **Hover / Focus:** Chips lift 1px with a soft shadow; both use a 2px amber `:focus-visible` outline, inset for Seg (stays inside the pill) and offset for Chips.
- **Active/Press:** `scale(0.96)` on click for tactile, instrument-switch feedback.

### Cards (Prototype / Screenshot)
- **Corner Style:** 10px radius (`{rounded.md}`).
- **Background:** Graphite Surface, with a near-invisible 1% white wash over the metadata footer to separate it from the thumbnail without a hard line.
- **Shadow Strategy:** Ambient panel at rest, Interactive lift on hover (see Elevation).
- **Border:** None at rest; hover adds a 1px amber border via `border-color` transition, layered under the glow.
- **Internal Padding:** `{spacing.s2}` top, `{spacing.s3}` sides/bottom for the metadata footer.

### Inputs (Search)
- **Style:** Raised Graphite background, 6px radius, no visible border at rest — the surface-vs-surface-2 contrast alone signals "this is a field."
- **Focus:** Background lifts to Graphite Surface, a 3px soft amber ring (`box-shadow: 0 0 0 3px rgba(245,165,36,.15)`) appears, and the search icon stroke switches from Muted Steel to Amber Phosphor.

### Navigation (Sidebar)
- **Style:** Icon + Title-voice label, 6px radius, 44px minimum height (touch target).
- **Default:** Dim Signal text/icon at 80% icon opacity.
- **Hover:** Background steps to Raised Graphite, text goes full Phosphor White, icon nudges 2px right and scales 1.05.
- **Active:** Soft amber background tint + Amber Phosphor (Text) + Hairline Highlight shadow; icon stroke becomes solid Amber Phosphor.
- **Mobile (≤860px):** Collapses to a 64px icon-only rail — labels, section headers, and the sidebar's "Workspace" label all disappear together; the sidebar becomes a pure icon dock.

### Viewfinder Preview (signature component)
The component that carries the whole North Star. A capture surface built to look like it's being observed through a camera, not just displayed in a `<div>`:
- **Chrome bar:** Traffic-dot placeholders, a centered mono URL readout (`localhost:5173 / {id}`), and a right-aligned "Capture region" readout with a pulsing amber record-dot.
- **Frame:** CRT scanline texture (repeating 1px lines at 2.2% white) plus a faint amber radial glow and a 16px grid, all layered as background-images so they cost zero DOM nodes.
- **Reticle:** Four amber crop-bracket corners (2.5px, drop-shadow glow) and a center crosshair — always present, whether or not a real screenshot has loaded.
- **Empty state:** When no capture exists yet, a monitor glyph plus "Screenshot preview" in Readout voice sits inside the reticle, so the instrument still looks armed and waiting rather than broken.
- **Loaded state:** The real screenshot fills the frame behind the reticle chrome (`object-fit: cover`), so the bracket/crosshair overlay reads as actively framing the capture.

## 6. Do's and Don'ts

### Do:
- **Do** keep Amber Phosphor to the live/active signal only — running agent, live nav item, record dot, active toggle, hover glow.
- **Do** put every timestamp, count, ID, or raw value in the Readout voice (JetBrains Mono), even inline next to Display or Body text.
- **Do** derive status from real data (a capture's `capturedAt`, a call's `ts`) rather than a flag that has to be remembered and can drift stale.
- **Do** pair the Interactive Lift shadow with the amber glow together — elevation and "clickable" are announced as one signal, not two.
- **Do** respect `prefers-reduced-motion` for every pulse/glow animation (pattern already set by `.pulse`, `.recDot`, `.liveDot`).

### Don't:
- **Don't** introduce a second saturated accent color. This system rejects the "full palette" and "drenched" strategies entirely — it is Restrained-to-Committed on exactly one hue.
- **Don't** use gradient text or gradient-filled headings anywhere.
- **Don't** default to cards where a list, table, or log row would show the data with less chrome — cards here are earned by the browsable-thumbnail use case (Prototypes/Screenshots), not a default affordance.
- **Don't** write cheerful, celebratory, or persuasive microcopy ("You're all set! 🎉"). The audience is a solo operator auditing their own agent, not a customer being onboarded.
- **Don't** let Caution Orange or Fail Red drift toward the accent's hue — they must stay visibly distinct from Amber Phosphor at a glance.
- **Don't** add a border-left/border-right colored stripe as an accent on any row, card, or callout.
