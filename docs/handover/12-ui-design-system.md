# 12 — UI & design system

- Dark "agro nature" theme: deep green + lime via HSL variables in `src/index.css`, mapped in `tailwind.config.ts`.
- Use semantic tokens (`bg-background`, `text-primary`, `bg-accent`) — never hardcoded colors.
- Mobile: min 44px touch targets; tables scroll horizontally or become cards.
- Control cards: identical heights, one global bottom save bar.
- Hardware feedback: icons glow for real relay state, independent of toggles.
- Tooltips/help triggers use Radix `asChild` (don't break grid/flex).
- Images: Supabase transforms + lazy loading skeletons; logo `src/assets/logo-agro-hogwards.png`.
