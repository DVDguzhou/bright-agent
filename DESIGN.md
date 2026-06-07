---
name: Life Agent Marketplace
description: A curated marketplace of real human experience — warm, tactile, authoritative.
colors:
  paper: "#f4efe6"
  paper-light: "#faf7f1"
  paper-mid: "#ebe3d4"
  paper-deep: "#dccfb8"
  ink: "#1a1714"
  ink-soft: "#4d463f"
  ink-muted: "#8d8478"
  ink-faint: "#bfb6aa"
  hairline: "#d8cfbf"
  oxblood: "#7a1f1f"
  oxblood-deep: "#4d1414"
  oxblood-light: "#f1d9d9"
  olive: "#4a5a2f"
  olive-light: "#5d7140"
typography:
  display:
    fontFamily: "Source Han Serif SC, Noto Serif SC, Songti SC, STSong, Georgia, serif"
    fontSize: "clamp(2rem, 6vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Source Han Serif SC, Noto Serif SC, Songti SC, STSong, Georgia, serif"
    fontSize: "clamp(1.5rem, 4vw, 2rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "ui-sans-serif, system-ui, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "ui-sans-serif, system-ui, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "ui-sans-serif, system-ui, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.2em"
rounded:
  none: "0"
  xs: "2px"
  sm: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  "2xl": "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-light}"
    rounded: "{rounded.xs}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.paper-light}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "12px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-light}"
  card:
    backgroundColor: "{colors.paper-light}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
---

# Design System: Life Agent Marketplace

## 1. Overview

**Creative North Star: "The Living Archive"**

This design system is built around a single conviction: the person behind the agent is the product. Not the AI powering it, not the platform hosting it — the human whose experience, judgment, and story live inside. Every surface decision follows from that conviction. The palette is warm paper and deep ink because this is a library of real lives, not a tech product. The typography reaches for editorial weight and serif authority because real experience deserves a serious frame. The components are stripped of decoration because the content is the decoration.

The system rejects its most obvious temptations. It is not a productivity tool: no neutral grids, no utility-first chrome. It is not a social network: no follower counts, no engagement metrics, no visual language borrowed from Xiaohongshu or Instagram. It is not an AI brand: no dark mode with gradient logos, no "intelligence" abstraction, no interface that makes the AI more prominent than the human it's representing.

The atmosphere is a private journal made public: tactile warmth, unhurried pace, typographic clarity, restraint as a form of respect. Motion is purposeful and quiet. White space is generous and intentional. The oxblood accent appears rarely — when it does, it means something.

**Key Characteristics:**
- Warm paper ground (#f4efe6) with deep ink text (#1a1714): editorial, not clinical
- Oxblood (#7a1f1f) as a rare, authoritative accent — not a primary brand color
- Serif for hierarchy and feeling; sans for function and legibility
- Flat elevation: no shadows at rest; tonal layering separates surfaces
- 2px border-radius maximum: sharp without being harsh

## 2. Colors: The Archive Palette

Drawn from the physical world of print and archival paper — warm but never soft, authoritative without being cold.

### Primary
- **Warm Near-Black / Deep Ink** (#1a1714): The primary text and action color. Used for body copy, headings, filled buttons, and interactive elements at rest. Carries the weight of the ink voice.

### Secondary
- **Oxblood** (#7a1f1f): The rare accent. Used for hover states on filled buttons, selection highlights, text selection background, and any moment requiring emphasis. Appears on ≤10% of any given screen. The scarcity is deliberate.

### Tertiary
- **Archive Olive** (#4a5a2f): Verification and status states only. Not a decorative color — it means "verified" or "active". Used exclusively in badges and status indicators.

### Neutral
- **Warm Paper** (#f4efe6): Body background. Not a default warm-tinted neutral — this IS the brand surface.
- **Paper Light** (#faf7f1): Card and container surfaces, elevated above the base.
- **Paper Mid** (#ebe3d4): Secondary surface, hover backgrounds for list items.
- **Paper Deep** (#dccfb8): Pressed states, deep tonal backgrounds.
- **Hairline** (#d8cfbf): Dividers and borders. Never thicker than 1px in decorative use.
- **Ink Soft** (#4d463f): Secondary text — metadata, captions, supporting copy.
- **Ink Muted** (#8d8478): Tertiary text — timestamps, placeholders, decorative kickers.
- **Ink Faint** (#bfb6aa): Disabled states and very low-emphasis content only.

### Named Rules
**The One Oxblood Rule.** Oxblood (#7a1f1f) is an emphasis color, not a brand color. If you're about to use it as a background, a border, or as more than one element per screen, pull back. Its rarity is what gives it authority.

**The Warm-Paper Rule.** The body background (#f4efe6) is not a "neutral off-white." It is a committed brand surface. Do not lighten it toward white for "cleanliness" — that erases the editorial warmth that carries the whole palette. If a surface needs to feel lighter, use #faf7f1.

### Restrained Severity Scale (克制分级)

When UI must express **multiple levels of urgency** — feedback alerts, diagnostic items, operational warnings — do not import a second semantic hue (no red/orange/yellow traffic-light palettes). That breaks the archive palette and fights **The One Oxblood Rule**.

Instead, use a **restrained severity scale**: one hue family (oxblood) stepped by lightness for heat, ending in neutral ink for “FYI only.” Deeper red = more urgent; fading to gray = reference-only. Olive remains reserved for verification/active status — never for severity.

| Tier | Label | Dot | Title text | Badge | Meaning |
|------|-------|-----|------------|-------|---------|
| `urgent` | 紧急 | `oxblood-600` | `oxblood-700` | solid `oxblood-600` / paper text | Act now |
| `high` | 重要 | `oxblood-400` | `oxblood-600` | `oxblood-100` / `oxblood-700` | Needs attention |
| `medium` | 建议 | `oxblood-200` | `ink-700` | `paper-300` / `ink-600` | Recommended fix |
| `low` | 参考 | `ink-300` | `ink-500` | `paper-200` / `ink-400` | Informational |

**Implementation:** Map backend `priority` (`urgent` / `high` / `medium` / `low`) through `severityFromPriority()` and apply the shared class maps in `src/lib/severity-style.ts` (`SEVERITY_DOT`, `SEVERITY_TEXT`, `SEVERITY_BADGE`, `SEVERITY_LINK`, `SEVERITY_LABEL`). Do not re-derive colors per page.

**Anti-patterns (do not ship):**
- Collapsing all severities to the same `text-oxblood-600` / `bg-oxblood-100` while keeping dead `color === "red" | "orange" | "yellow"` branches — looks graded, reads flat.
- Decorative oxblood on unrelated tiles (quick-action icons, category chips) next to real severity signals — dilutes urgency.
- Using olive or a new accent hue for “medium” severity — olive means verified/active only.

**First consumer:** Agent manage dashboard — “需要你关注” alert list (`src/app/dashboard/life-agents/[id]/page.tsx`). Future feedback, blind-spot, or ops surfaces should import the same helper rather than inventing local scales.

## 3. Typography

**Display Font:** Source Han Serif SC, Noto Serif SC, Songti SC, STSong — with Georgia and serif as fallbacks. Chinese-first serif stack.
**Body Font:** System sans-serif (PingFang SC on Apple, Microsoft YaHei on Windows, ui-sans-serif everywhere) — no web font dependency.
**Mono Font:** ui-monospace, Cascadia Code, Consolas — for code, API keys, technical metadata only.

**Character:** The serif carries authority and humanity; the sans provides legibility and function. The pairing works because they never compete: serif belongs to headings and emphasis, sans to body and UI. Mixing them on the same line (e.g., a serif heading over a sans body) is intentional and good. Mixing them within the same element is not.

### Hierarchy
- **Display** (500 weight, clamp(2rem, 6vw, 3.5rem), 1.1 line-height): Page heroes and profile names at their most prominent. Serif only. Letter-spacing -0.02em. `text-wrap: balance`.
- **Headline** (500 weight, clamp(1.5rem, 4vw, 2rem), 1.2 line-height): Section headings, agent profile titles. Serif only. Letter-spacing -0.01em. `text-wrap: balance`.
- **Title** (500 weight, 1.125rem, 1.4 line-height): Card titles, dialog headings, list item primary text. Sans only.
- **Body** (400 weight, 1rem, 1.7 line-height): All running text. Sans only. Max line length 65–75ch on desktop. `text-wrap: pretty` for multi-paragraph prose.
- **Label** (500 weight, 0.6875rem, 0.2em letter-spacing, uppercase): Kickers, category tags, and status chips only. Max 4 words. Ink Muted (#8d8478). Appears rarely.

### Named Rules
**The Serif-for-Feeling Rule.** Serif is reserved for hierarchy and emotional weight: display headings, agent names at their most prominent, pull quotes. It does not appear in navigation, buttons, labels, or form fields. When you reach for serif in a UI element, reach for a weight change instead.

**The Label Economy Rule.** The label style (11px uppercase tracked) is a powerful accent — used on every section it becomes the AI scaffold. One or two kicker labels per page is editorial. Six is scaffolding. Count them before shipping.

## 4. Elevation

This system is flat by default. Surfaces are distinguished by tonal stepping (paper → paper-light → paper-mid), not by shadow. The result feels like layers of paper, not floating plastic.

Shadows exist but are rare: the `glow-sm` shadow (diffuse oxblood glow) appears under featured agent cards on hover — a moment of warmth that rewards attention, not ambient decoration.

### Shadow Vocabulary
- **Hover glow** (`0 0 15px -3px rgb(122 31 31 / 0.15), 0 0 30px -5px rgb(26 23 20 / 0.08)`): Featured card hover state. Oxblood-tinted ambient warmth. Not a structural shadow.
- **No resting shadow.** Cards, panels, and modals at rest use only border (#d8cfbf hairline) and background tonal shift, never box-shadow.

### Named Rules
**The Paper Layers Rule.** Depth is expressed through tonal value, not elevation. A card above the page background is #faf7f1 on #f4efe6 — a half-tone step. Never add a drop shadow to achieve the same effect. If the layers aren't visually distinct without shadow, lighten the card background one step further.

## 5. Components

### Buttons
Shape: sharp, almost flat — 2px radius. Anti-roundness is deliberate; this isn't a SaaS product.

- **Primary:** Filled ink background (#1a1714), paper-light text (#faf7f1). 12px vertical, 24px horizontal padding. 160ms ease transition. Hover shifts to oxblood (#7a1f1f). Active shifts to oxblood-deep (#4d1414). No border, no shadow.
- **Secondary:** Transparent background, full ink border (1px), ink text. Hover fills with ink and inverts text. Same shape and transition as primary.
- **Ghost / text:** No border, no background. Ink text at muted weight. For low-emphasis in-context actions.

### Cards / Containers
Tactile but restrained: hairline border, 4px radius, paper-light background. No drop shadow.

- **Corner Style:** 4px radius (sharp, not rounded)
- **Background:** #faf7f1 (paper-light) on a #f4efe6 (paper) page
- **Border:** 1px hairline (#d8cfbf) at rest; ink-muted (#8d8478) on hover
- **Shadow:** None at rest. Hover may add diffuse glow (`glow-sm`) for featured/interactive cards.
- **Internal padding:** 16–24px. Never cramped; never lavish.
- **Nested cards:** Never. A card inside a card is always a design failure; restructure with sections and dividers.

### Inputs / Fields
Underline-only style: no box, no background, no radius. Editorial — like filling in a form on quality paper.

- **Style:** Bottom border only (1px hairline), transparent background, full-width. 8px horizontal padding, 8px vertical padding.
- **Placeholder:** Ink Muted (#8d8478).
- **Focus:** Bottom border shifts to ink (#1a1714). No box-shadow, no glow ring.
- **Error:** Bottom border shifts to oxblood (#7a1f1f).

### Navigation
Bottom tab bar on mobile (the primary navigation context); top bar on desktop.

- Bottom tabs: icon + short label (≤4 characters in Chinese). Active state uses ink (#1a1714), resting uses ink-muted (#8d8478). No filled pill or background highlight on active — the color change alone is sufficient.
- Top nav: minimal chrome. Logo or wordmark left, auth actions right. No mega-menu, no flyouts.
- Notification badge: oxblood dot, no border, ≤2 digits before truncating to "+".

### Agent Profile Card (Signature Component)
The central UI unit of the marketplace. A cover image (full bleed, portrait crop), name in title weight, headline in body weight, a row of metadata chips, and a rating row.

- Cover: aspect-ratio 3/4 or 2/3. No border-radius on the image itself; the card border-radius clips it.
- Name: title weight sans, 1 line, ellipsis overflow.
- Metadata chips: label style, ink-muted color, no background — comma-separated or inline, never pill-shaped badges.
- Rating: RatingStars + count in ink-soft. If unrated, show a muted "暂无评分" in ink-muted.
- Price: if shown, ink text, not oxblood. Price is information, not a call to action.

### Kicker / Section Label
A line + small uppercase text pair marking a section or category.

- Structure: 24px horizontal line (ink-muted) + 11px uppercase tracked text (ink-muted, 0.2em tracking).
- Used sparingly: at most 1–2 per page. Not on every section.

## 6. Do's and Don'ts

### Do:
- **Do** foreground the creator's name, photo, and specific background on every agent card. The human is the product.
- **Do** use serif for headings and agent names at display scale — it carries the earned-authority voice.
- **Do** keep oxblood to ≤10% of any given screen. When it appears, it signals "this matters."
- **Do** use tonal paper steps (#f4efe6 → #faf7f1 → #ebe3d4) to establish depth. Paper layers, not shadow.
- **Do** check that body text (#4d463f on #f4efe6) meets 4.5:1 contrast — it passes; do not lighten it for "softness."
- **Do** keep touch targets at minimum 44px height on all interactive elements (the primary user is on mobile).
- **Do** give the chat interface editorial restraint: generous message bubbles, generous line-height, unhurried pacing.
- **Do** apply `text-wrap: balance` to h1–h3 and `text-wrap: pretty` to long body paragraphs.

### Don't:
- **Don't** make the platform's AI capability the visual subject. No gradient "brain" logos, no neural-net imagery, no "intelligence" abstraction in copy or visuals. The human is the product, not the model.
- **Don't** borrow the social feed visual language. No like counts, no follower counts, no engagement-metric badges as the primary credibility signal. Real experience is the credential.
- **Don't** use neutral productivity-tool aesthetics: no Notion-style gray-on-white, no Linear-style dense sidebar, no SaaS grid-of-cards-with-icon-title-body.
- **Don't** add a side-stripe border (border-left > 1px) to any card, callout, or list item. Use full borders, background tints, or nothing.
- **Don't** use gradient text (`background-clip: text` with a gradient). The existing `.gradient-text` class already redirects this to serif italic — use that instead.
- **Don't** add a kicker/eyebrow to every section. One or two per page is editorial; more is AI scaffolding.
- **Don't** use shadows on resting cards. The paper-layers elevation system handles depth. Shadows appear on hover only, and only for featured or interactive elements.
- **Don't** round buttons or inputs beyond 4px. Capsule-radius buttons signal consumer app, not editorial authority.
- **Don't** use color saturation to assert credibility. Specific experience details (years, school, job, location, session count) are the credibility signal — not bold colors or badge designs.
