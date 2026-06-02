---
target: src/app/life-agents/[id]/page.tsx
total_score: 22
p0_count: 1
p1_count: 3
timestamp: 2026-06-01T22-17-59Z
slug: src-app-life-agents-id-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No price shown before CTA; no indication of remaining questions |
| 2 | Match System / Real World | 3 | Language natural; emoji metadata labels incongruous with editorial register |
| 3 | User Control and Freedom | 2 | CTA silently redirects logged-out users; no price transparency before commitment |
| 4 | Consistency and Standards | 2 | rounded-[22px] hero contradicts flat system; backdrop-blur-sm on every section |
| 5 | Error Prevention | 1 | Price completely absent — seekers cannot see what they'll pay before clicking |
| 6 | Recognition Rather Than Recall | 3 | Information-rich but most important piece (price) requires another screen |
| 7 | Flexibility and Efficiency | 3 | Edge swipe back, favorite toggle, direct chat link |
| 8 | Aesthetic and Minimalist Design | 2 | All 8 sections identical treatment; backdrop-blur decorative; flat hierarchy |
| 9 | Error Recovery | 2 | 404 handled; logged-out CTA doesn't signal login requirement before click |
| 10 | Help and Documentation | 2 | Sample questions help self-qualify; no explanation of how consultation works |
| Total | | 22/40 | Acceptable — significant structural improvements needed |

## Anti-Patterns Verdict

Detector clean. LLM found three class violations: glassmorphism-as-default (backdrop-blur-sm on all 8 section cards against solid background), identical-section-treatment (all 8 sections use exact same -mx-4 bg-paper/[0.98] px-4 py-4 backdrop-blur-sm), and gradient in welcome message container.

## Priority Issues

[P0] Price invisible on profile page. pricePerQuestion in data model, never rendered. Seeker discovers price only inside chat flow — highest anxiety moment. Fix: add price to CTA bar and sections.

[P1] CTA "进入聊天" context-blind across 3 user states (logged-out / no purchase / has remaining). Fix: state-specific labels.

[P1] alt="" on hero cover image. Fix: alt={profile.displayName}.

[P1] backdrop-blur-sm decoratively on all 8 section cards. Absolute ban (glassmorphism as default). Performance cost on mobile. Fix: remove from all sections.

[P2] Flat typography hierarchy — all 8 section headings text-sm font-semibold. h1 name text-lg barely larger. Fix: serif display-scale h1, label-style hierarchy.

[P2] Hero cover rounded-[22px] contradicts editorial system (max 4px). Fix: rounded-sm or 0.

[P2] Emoji metadata labels (school/job/income) contradict editorial register. Fix: plain text field names or none.
