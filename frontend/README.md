# Chaukidar — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind. Minimal, ledger/audit-styled
UI for configuring, running, and reporting on multilingual AI safety audits.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

By default the app runs entirely on **mock data** (`NEXT_PUBLIC_USE_MOCK_API=true`
in `.env.example`), so you can build and demo the UI before the FastAPI
backend exists.

## Connecting the real backend

Every backend call lives in **`lib/api.ts`** — nowhere else. To switch from
mock data to the live FastAPI service:

1. Set `NEXT_PUBLIC_USE_MOCK_API=false` in `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL (e.g. `http://localhost:8000`).
3. That's it — every page already calls `lib/api.ts`, so no component changes
   are needed. If CORS is a problem, route through `app/api/proxy/[...path]/route.ts`
   instead (set `NEXT_PUBLIC_API_BASE_URL=/api/proxy` and `API_BASE_URL` to the
   real backend).

`lib/types.ts` mirrors the backend's Pydantic schemas field-for-field — keep
the two in sync as the API evolves.

## Structure

```
frontend/
├── app/                     # Routes (App Router)
│   ├── page.tsx             # Landing
│   ├── audits/new/          # Audit configuration
│   ├── audits/[auditId]/run       # Live run (polls every 2s)
│   ├── audits/[auditId]/results   # Dashboard: score, charts, table
│   ├── audits/[auditId]/report    # Report preview + PDF download
│   └── api/proxy/[...path]/route.ts  # Optional CORS proxy
├── components/
│   ├── layout/               # Navbar, Sidebar
│   ├── audit/                 # Config-page building blocks
│   ├── results/                # Dashboard charts + table
│   └── shared/                # Badge, LoadingSpinner, CoverageGrid
├── lib/
│   ├── api.ts                # ← single integration point with the backend
│   ├── types.ts               # Mirrors backend Pydantic schemas
│   ├── constants.ts           # Fixed languages / harm categories
│   └── mock-data.ts           # Demo data used until the backend is live
└── styles/globals.css         # Design tokens (CSS variables) + Tailwind
```

## Design notes

- Colors, type, and spacing are defined as CSS variables in
  `styles/globals.css` and mapped into `tailwind.config.ts` — change the
  palette in one place.
- Risk/status color coding (`safe` / `review` / `high`) is shared across the
  heatmap, badges, and charts via `lib/constants.ts`.
- Fonts: Space Grotesk (display), Inter (body), IBM Plex Mono (data/labels),
  loaded through `next/font/google` in `app/layout.tsx`.
- **Hero gradient** (`components/shared/GradientBackground.tsx`) uses
  [`@shadergradient/react`](https://github.com/ruucm/shadergradient) —
  a slow, light-toned `waterPlane` gradient behind the landing hero only,
  faded into the paper background at the edges. It's loaded via
  `next/dynamic` with `ssr: false` since it needs a WebGL canvas. Tune it
  by editing `GradientBackground.tsx`; the CSS layers control
  how lively it feels, `color1/2/3` control the palette.
- **Mascot** (`components/shared/Mascot.tsx`) hangs from the navbar logo:
  idle sway + arm wave via CSS keyframes in `globals.css`, pupils track the
  cursor (mousemove → `requestAnimationFrame` → clamped offset), and a click
  triggers a squash-and-stretch "giggle" with squinty eyes and a couple of
  sparkles. No new dependencies — plain SVG + CSS.

## PDF download

The report page's "Download PDF" button calls the real backend endpoint
(`GET /api/audits/{id}/report/pdf`, served by WeasyPrint) once
`NEXT_PUBLIC_USE_MOCK_API=false`. Until then, in mock mode, it triggers the
browser's own print dialog (`window.print()`) on the same report content —
choose "Save as PDF" as the destination. `styles/globals.css` has a
`@media print` block (`.no-print`, `.print-area`) that hides the nav/sidebar
and cleans up the printed layout, so this doubles as a real, working export
with zero extra dependencies either way.
