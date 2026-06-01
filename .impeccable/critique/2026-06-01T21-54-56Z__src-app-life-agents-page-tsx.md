---
target: life-agents
total_score: 23
p0_count: 0
p1_count: 3
timestamp: 2026-06-01T21-54-56Z
slug: src-app-life-agents-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading states and pull-to-refresh are solid; no active-tab indicator on desktop |
| 2 | Match System / Real World | 3 | Good Chinese language; backend debug copy leaks to users |
| 3 | User Control and Freedom | 2 | No visible tab affordance on desktop |
| 4 | Consistency and Standards | 2 | Discover cards (flat, 0 radius) vs. Purchased cards (rounded-22px, backdrop-blur): two visual languages |
| 5 | Error Prevention | 2 | Timeout guards good; error states don't distinguish API down from empty list |
| 6 | Recognition Rather Than Recall | 2 | Tab discovery requires knowing to swipe (mobile) or knowing the URL (desktop) |
| 7 | Flexibility and Efficiency | 3 | Swipe navigation, auto-load-more, pull-to-refresh — thoughtful mobile efficiency |
| 8 | Aesthetic and Minimalist Design | 3 | Discover cards excellent; Purchased section and loading skeleton contradict editorial system |
| 9 | Error Recovery | 2 | Error banner exists but copy is developer-facing |
| 10 | Help and Documentation | 1 | No explanation of what a life agent is for a first-time visitor |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

The discover feed cards are genuinely editorial and good. The flat layout, hairline divider, serif/italic hierarchy, and zero border-radius are committed and coherent. Detector found zero anti-pattern hits.

One thing the detector cannot catch: group-hover:shadow on line 888 uses rgba(168,139,235,0.14) — a purple/lavender glow that is a direct carry-over from an old design system. The hover accent is supposed to be oxblood.

## Overall Impression

The discover feed is genuinely well-crafted. The card design has real editorial conviction. The main opportunity is consistency across states: the purchased tab, loading skeletons, and error copy feel like they came from an older design era. A first-time seeker also has no idea what they are looking at — there is no onboarding moment for the concept.

## What's Working

1. DiscoverCard is excellent: no border-radius, hairline divider, serif name over italic serif headline, no shadow. Exactly the Living Archive editorial aesthetic. Sample questions row is smart UX.
2. Mobile interaction engineering is thoughtful: swipe-between-tabs, pull-to-refresh with proper opacity/transform gesture indicator, intersection observer for load-more.
3. Empty and loading states use the design system correctly.

## Priority Issues

[P1] Purple hover glow on Purchased cards — rgba(168,139,235,0.14) in page.tsx:888 is lavender/purple. Brand accent is oxblood. Fix: replace with oxblood glow shadow. Command: /impeccable polish src/app/life-agents/page.tsx

[P1] Backend debug copy in user-facing error messages — "请确认 Go 后端已启动（默认端口 8080）" appears to real users. Fix: user-facing copy, gate debug detail on NODE_ENV. Command: /impeccable clarify src/app/life-agents/page.tsx

[P1] Cover images have empty alt text — alt="" throughout DiscoverCard and PurchasedGrid. Fix: alt={profile.displayName}. Command: /impeccable audit src/components/LifeAgentDiscoverCardGrid.tsx

[P2] Purchased cards use completely different visual language — rounded-[22px], backdrop-blur-sm, float shadows vs flat editorial discover cards. Fix: migrate PurchasedAgentsWindowedGrid to use LifeAgentDiscoverCard component. Command: /impeccable polish src/app/life-agents/page.tsx

[P2] No visible tab affordance on desktop or mobile — Favorites and Purchased tabs are URL-driven with no visual indicator. Fix: add minimal tab strip in the label style. Command: /impeccable layout src/app/life-agents/page.tsx

## Persona Red Flags

Jordan (First-Timer): No concept explanation, creator-facing empty state copy, no visibility of Favorites tab, weak "点击进入对话" copy.

Casey (Mobile): Swipe-to-tab gesture undiscovered, purchased agents hard to find on return visit, skeleton-to-card shape morph is jarring.

Wei (Experience-Seeker): Session count and knowledge count defined in UI constants but not shown on cards. Unrated agents show nothing. MindScore badge has no label.

## Minor Observations

- favoritesIntro/purchasedIntro banners use bg-gradient-to-r — prohibited by design system. Use flat bg-paper-light.
- Count badges use rounded-full (pill shape) — contradicts editorial system.
- text-ink-600/75 opacity-reduced text likely fails 4.5:1 contrast on paper background.
