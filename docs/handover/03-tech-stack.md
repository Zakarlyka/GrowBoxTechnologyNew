# 03 — Tech stack

- React 18, TypeScript 5, Vite 5, Tailwind CSS 3, shadcn/ui (Radix), lucide-react icons
- TanStack React Query 5, React Router, react-hook-form + zod
- i18next (uk / en / ru)
- Recharts (charts), dnd-kit (draggable sensor cards)
- Supabase JS 2 (auth, DB, realtime, storage bucket `grow-images` — public)
- Edge functions: Deno (Supabase)
- Hardware: ESP8266 (Arduino core), HTTPS + JSON

## Pinned / constraints
- `date-fns` must stay **3.6.0** (react-day-picker v8 compatibility).
- No external image placeholder services (prod crashes).
- Hosting: Lovable publish (also Netlify/Vercel/Docker configs exist but are legacy).
