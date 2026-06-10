---
name: Life Agent Marketplace
description: A curated marketplace of real human experience — warm, tactile, authoritative.
colors:
  paper: "#f2f1ed"           # page background: warm paper gray (half-step deeper than cards)
  paper-light: "#ffffff"      # card surfaces: pure white
  paper-mid: "#ebe9e2"        # inset surfaces: sample questions, input wells
  paper-deep: "#dcd9cf"       # pressed/loading states
  ink: "#1c1a16"              # primary text: warm carbon ink
  ink-soft: "#474337"         # secondary text
  ink-muted: "#847d6f"        # tertiary text, timestamps, placeholders
  ink-faint: "#b9b3a5"        # disabled, very low emphasis
  hairline: "#ddd8cc"         # dividers and borders (warm)
  signal: "#c08f27"           # lamplight gold: ratings, favorites, active states, hover delight
  signal-soft: "#e4c46a"      # signal hover, soft highlights
  signal-deep: "#7a5712"      # deep gold for text links on white
  oxblood: "#c2271d"          # error/high-risk only (no longer primary accent)
  oxblood-deep: "#781711"
  oxblood-light: "#f6d8d4"
  olive: "#4a5a2f"            # verification/active status only
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

This design system is built around a single conviction: the person behind the agent is the product. Not the AI powering it, not the platform hosting it — the human whose experience, judgment, and story live inside. Every surface decision follows from that conviction. The palette is newsprint white and neutral ink — the visual register of a Chinese weekly (三联/读库), not a tech product. The typography reaches for editorial weight and serif authority because real experience deserves a serious frame. The components are stripped of decoration because the content is the decoration.

> **2026-06 direction change:** the original warm-cream + oxblood palette read as Claude/Anthropic's brand language (cream paper + serif + warm red). The palette pivoted to newsprint white + vermilion to break that association.
>
> **2026-06-10 direction change:** the newsprint white + vermilion palette read as "cold and monotonous" in practice, with red feeling uncomfortable as the primary accent. The palette pivoted to **lamplight paper** (warm paper-gray base + honey-gold signal accent). Vermilion (`oxblood`) is now reserved for errors only; all positive emphasis (ratings, favorites, hover delight, active states) uses gold (`signal`).

The system rejects its most obvious temptations. It is not a productivity tool: no neutral grids, no utility-first chrome. It is not a social network: no follower counts, no engagement metrics, no visual language borrowed from Xiaohongshu or Instagram. It is not an AI brand: no dark mode with gradient logos, no "intelligence" abstraction, no interface that makes the AI more prominent than the human it's representing.

The atmosphere is a private journal made public: tactile warmth, unhurried pace, typographic clarity, restraint as a form of respect. Motion is purposeful and quiet. White space is generous and intentional. The oxblood accent appears rarely — when it does, it means something.

**Key Characteristics:**
- Lamplight paper ground (#f2f1ed) with warm carbon ink text (#1c1a16): deliberately a half-step darker than white cards for visible depth
- Honey-gold signal (#c08f27) as the primary accent for ratings, favorites, active states — warm and responsive, ~15% of surfaces
- Vermilion (#c2271d, `oxblood`) reserved strictly for errors — when you see red, something needs attention
- Serif for hierarchy and feeling; sans for function and legibility
- 4-level elevation: inset → base → raised (resting shadow) → floating (deep shadow + blur)
- 2px–8px border-radius: soft but not capsule

## 2. Colors: The Lamplight Palette

Drawn from the physical world of a warmly lit study — paper under a brass desk lamp, warm shadows, honeyed highlights. Authoritative but human; warm without being saccharine.

### Primary
- **Warm Carbon Ink** (#1c1a16): The primary text and action color. Used for body copy, headings, filled buttons, and interactive elements at rest. Carries weight without feeling cold.

### Accent (Positive Emphasis)
- **Lamplight Gold / Signal** (#c08f27, token `signal`): The primary accent for "this is good." Used for ratings, favorites, hover responses on interactive elements, active tab underlines, notification badges, and selection highlights. Appears on ~15% of any given screen — warm and noticeable, not scarce.

### Semantic (Errors Only)
- **Vermilion / Oxblood** (#c2271d, token `oxblood`): Reserved for errors, destructive actions, and high-risk states. No longer used for general emphasis — when you see red, something needs attention.

### Status
- **Archive Olive** (#4a5a2f): Verification and active-online states only. Not a decorative color — it means "verified" or "currently active".

### Neutral
- **Lamplight Paper** (#f2f1ed): Page background. Warm paper-gray, deliberately a half-step darker than white cards so the cards visibly lift. The warmth comes from yellow undertones, not red (avoids cream/terracotta AI associations).
- **Paper Light** (#ffffff): Card and container surfaces, pure white elevated above the warm base.
- **Paper Mid** (#ebe9e2): Inset surfaces — sample questions, input wells, pressed states.
- **Paper Deep** (#dcd9cf): Deep tonal backgrounds, loading skeletons.
- **Hairline** (#ddd8cc): Dividers and borders — warm, subtle.
- **Ink Soft** (#474337): Secondary text — metadata, captions, supporting copy.
- **Ink Muted** (#847d6f): Tertiary text — timestamps, placeholders.
- **Ink Faint** (#b9b3a5): Disabled states and very low-emphasis content.

### Named Rules
**The Signal-First Rule.** Gold/signal (#c08f27) is the primary accent for all positive emphasis: ratings, favorites, active states, hover delight, notification badges. Use it confidently — its job is to feel warm and responsive, not scarce. Reserve oxblood strictly for errors and destructive actions.

**The Paper Depth Rule.** The page background (#f2f1ed) is deliberately darker than white cards. This creates visible figure/ground separation without relying on shadows. White cards float above warm paper — like a note on a desk.

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
- **Label** (500 weight, 0.6875rem, 0.2em letter-spacing, uppercase): Kickers, category tags, and status chips only. Max 4 words. Ink Muted (#8e8c86). Appears rarely.

### Named Rules
**The Serif-for-Feeling Rule.** Serif is reserved for hierarchy and emotional weight: display headings, agent names at their most prominent, pull quotes. It does not appear in navigation, buttons, labels, or form fields. When you reach for serif in a UI element, reach for a weight change instead.

**The Label Economy Rule.** The label style (11px uppercase tracked) is a powerful accent — used on every section it becomes the AI scaffold. One or two kicker labels per page is editorial. Six is scaffolding. Count them before shipping.

## 4. Elevation: Four Altitude Levels

The system uses **four distinct elevation levels**, combining tonal stepping with soft shadows for depth that feels like paper under lamplight — not floating UI chrome.

| Level | Token | Surface | Shadow | Use Case |
|-------|-------|---------|--------|----------|
| **Inset** | `paper-200` (#ebe9e2) | Warm gray | None | Sample questions, input wells, pressed items |
| **Base** | `paper` (#f2f1ed) | Warm paper | None | Page background |
| **Raised** | `paper-50` (#ffffff) | White card | `shadow-glow-sm` (soft, warm) | Cards, panels, modals |
| **Floating** | `surface` (glass) | White + blur | `shadow-glow` / `shadow-glow-lg` | FAB, sticky nav, popovers |

### Shadow Vocabulary (Warm)
All shadows use warm ink tones (`rgb(28 26 22)`) rather than cool grays:
- **glow-sm** (`0 1px 2px rgb(28 26 22 / 0.05), 0 10px 24px -16px rgb(28 26 22 / 0.20)`): Resting shadow for raised cards — soft, warm, present but quiet.
- **glow** (`0 1px 2px rgb(28 26 22 / 0.06), 0 18px 44px -24px rgb(28 26 22 / 0.26)`): Hover state for cards and featured elements — deepens with a gold-tinted border.
- **glow-lg** (`0 24px 72px -32px rgb(28 26 22 / 0.34)`): Floating layers — FAB, drawers, modals.

### Interaction: Hover Delight
- **Cards**: On hover, add subtle lift (`-translate-y-0.5`) and border tint (`border-signal-300`). The shadow deepens from `glow-sm` to `glow`.
- **Buttons**: Primary buttons respond with gold on hover (`bg-signal-600`), not black or vermilion — the warmth rewards interaction.
- **Links**: Text links underline in signal color on hover.

### Named Rules
**The Resting Shadow Rule.** Raised cards (white on warm paper) carry a soft resting shadow. This separates them from the flatter "paper layers" approach while maintaining warmth. Do not use shadows for inset or base layers.

## 5. Components

### Buttons
Shape: sharp, almost flat — 2px radius. Anti-roundness is deliberate; this isn't a SaaS product.

- **Primary:** Filled ink background (#1c1a16), paper-light text (#ffffff). 12px vertical, 24px horizontal padding. 160ms ease transition. **Hover shifts to signal-deep (#7a5712)** — warm gold response. Active shifts darker (#614410). Soft resting shadow.
- **Secondary:** Transparent background, full ink border (1px), ink text. Hover fills with ink and inverts text. Same shape and transition as primary.
- **Ghost / text:** No border, no background. Ink text at muted weight. For low-emphasis in-context actions.

### Cards / Containers
Tactile with soft depth: hairline border, 4px–8px radius, paper-light background, resting shadow.

- **Corner Style:** 4px–8px radius (soft but not capsule)
- **Background:** #ffffff (paper-light) on a #f2f1ed (paper) page — white visibly floats above warm gray
- **Border:** 1px hairline (#ddd8cc) at rest; signal-tinted (#e4c46a) on hover
- **Shadow:** `shadow-glow-sm` at rest (soft, warm, present but quiet). Hover deepens to `shadow-glow` with subtle lift (`-translate-y-0.5`).
- **Internal padding:** 16–24px. Never cramped; never lavish.
- **Nested cards:** Never. A card inside a card is always a design failure; restructure with sections and dividers.

### Inputs / Fields
Underline-only style: no box, no background, no radius. Editorial — like filling in a form on quality paper.

- **Style:** Bottom border only (1px hairline), transparent background, full-width. 8px horizontal padding, 8px vertical padding.
- **Placeholder:** Ink Muted (#847d6f).
- **Focus:** Bottom border shifts to ink (#1c1a16). Optional: gold glow ring (`box-shadow: 0 0 0 3px rgba(192,143,39,0.2)`).
- **Error:** Bottom border shifts to oxblood (#c2271d).

### Navigation
Bottom tab bar on mobile (the primary navigation context); top bar on desktop.

- Bottom tabs: icon + short label (≤4 characters in Chinese). Active state uses ink (#1c1a16), resting uses ink-muted (#847d6f). Active underline in signal-gold (#c08f27). No filled pill — the gold underline signals state.
- Top nav: minimal chrome. Logo or wordmark left, auth actions right. No mega-menu, no flyouts.
- Notification badge: signal-gold (#c08f27) dot or pill, no border, ≤2 digits before truncating to "+". Gold means "something good is waiting" — distinct from error red.

### Agent Profile Card (Signature Component)
The central UI unit of the marketplace. A cover image (full bleed, portrait crop), name in title weight, headline in body weight, a row of metadata chips, and a rating row.

- Cover: aspect-ratio 3/4 or 2/3. No border-radius on the image itself; the card border-radius clips it.
- Name: title weight sans, 1 line, ellipsis overflow.
- Metadata chips: label style, ink-muted color, no background — comma-separated or inline, never pill-shaped badges.
- Rating: RatingStars (gold fill, #c08f27) + count in ink-soft. If unrated, show a muted "暂无评分" in ink-muted. The gold star is the primary chromatic moment in the feed.
- Price: if shown, ink text, not oxblood. Price is information, not a call to action.

### Kicker / Section Label
A line + small uppercase text pair marking a section or category.

- Structure: 24px horizontal line (ink-muted) + 11px uppercase tracked text (ink-muted, 0.2em tracking).
- Used sparingly: at most 1–2 per page. Not on every section.

## 6. Do's and Don'ts

### Do:
- **Do** foreground the creator's name, photo, and specific background on every agent card. The human is the product.
- **Do** use serif for headings and agent names at display scale — it carries the earned-authority voice.
- **Do** use signal-gold for positive emphasis — ratings, favorites, hover states, active tabs. Warmth should feel responsive, not scarce.
- **Do** use tonal paper steps (#f2f1ed → #ffffff → #ebe9e2) plus soft resting shadows for raised cards. Paper under lamplight — visible depth, not floating UI.
- **Do** check that body text (#474337 on #f2f1ed) meets 4.5:1 contrast — it passes; do not lighten it for "softness."
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
- **Don't** use harsh black shadows or cool gray shadows. All shadows should carry the warm ink tone (rgb(28 26 22)).
- **Don't** round buttons or inputs beyond 4px. Capsule-radius buttons signal consumer app, not editorial authority.
- **Don't** use color saturation to assert credibility. Specific experience details (years, school, job, location, session count) are the credibility signal — not bold colors or badge designs.
