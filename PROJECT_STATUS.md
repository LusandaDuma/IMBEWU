# Imbewu / AgroLearn — Project status & change log

This document describes **where the codebase stands today** and **what was changed** during recent development (routing, styling stack, shared UI, luxury visual pass, and the **Nolwazi** LMS AI assistant). For the original milestone specification and SQL prompts, see `cursor_prompt_agri_app.md`.

---

## 1. What this project is

**Imbewu** (branded in-app; aligned with **AgroLearn** in `cursor_prompt_agri_app.md`) is an **agricultural e-learning / LMS** mobile app:

- **Expo SDK ~54** with **Expo Router** (file-based routes under `app/`)
- **Supabase** for auth and data (`app/services/supabase.ts` — client + inline service helpers)
- **Zustand** for auth UI state (`app/store/auth.ts`)
- **TanStack React Query** for server state in screens
- **Zod** validators in `app/validators/index.ts`
- **NativeWind v4** + **Tailwind CSS v3** for utility styling (`className` on React Native views)
- **Lucide** icons (`lucide-react-native`)
- **Google Gemini** (Generative Language API, REST) for the in-app assistant **Nolwazi** — product Q&A, learning tone, strict reply shape (see §4.6).

### Roles & routing

| Profile role (`profiles.role`) | Expo route group   | Notes |
|-------------------------------|--------------------|--------|
| `admin`                       | `app/admin/`       | Tab layout |
| `coordinator`                 | `app/coordinator/` | Tab layout |
| `student`                     | `app/student/`     | Tab layout |
| `independent`                 | `app/independent/` | Tab layout |

Root redirect logic lives in `app/index.tsx` using `app/constants/routing.ts` (`getHomeHrefForRole`).

---

## 2. Repository layout (high level)

| Area | Path | Purpose |
|------|------|---------|
| Screens & layouts | `app/` | Expo Router: `auth`, `student`, `coordinator`, `admin`, `independent`, root `_layout` |
| Shared UI | `components/shared/` | Atoms, molecules, organisms + barrel `components/shared/index.ts` |
| Global styles entry | `global.css` | Tailwind layers for NativeWind |
| Tailwind | `tailwind.config.js` | Tokens: `primary`, `accent`, `earth`, `slate` (extended) |
| Theme constants (JS) | `app/constants/colors.ts` | `lightTheme` / `darkTheme` + palette exports (legacy / non–NativeWind use) |
| Routing helper | `app/constants/routing.ts` | Role → home `Href` |
| Types | `app/types/index.ts` | Domain TS types |
| Auth state | `app/store/auth.ts` | Zustand |
| Backend access | `app/services/supabase.ts` | Supabase client + CRUD-style helpers |
| LMS AI (Gemini) | `app/services/gemini.ts` | `generateContent` REST client; model fallbacks on 429/404 |
| Nolwazi prompt + product grounding | `app/constants/nolwaziKnowledge.ts` | `AGROLEARN_PRODUCT_CONTEXT`, `NOLWAZI_SYSTEM_INSTRUCTION` |
| Nolwazi chat screen | `app/nolwazi.tsx` | Chat UI; greeting + history rules for API |
| Legacy redirect | `app/fieldwise.tsx` | Redirects `/fieldwise` → `/nolwazi` |
| Typescript paths | `tsconfig.json` | `@/*` → `app/*`, `@/components/*` → `components/*` |
| NativeWind types | `nativewind-env.d.ts` | `/// <reference types="nativewind/types" />` |

---

## 3. Implemented vs. spec (`cursor_prompt_agri_app.md`)

**Largely aligned in spirit** (LMS flows, four roles, Supabase, shared components idea):

- Auth, role-based areas, courses/lessons, coordinator classes, student discover/join, independent explore, React Query usage.
- Shared component folder exists under `components/shared/` (atoms / molecules / organisms).

**Still different or partial relative to the long-form spec:**

- Services are **centralized in** `app/services/supabase.ts` rather than split files (`courseService.ts`, `authService.ts`, …).
- No `middleware/`, `hooks/` package, or `theme/theme.ts` as in the doc; design tokens live in **Tailwind** + `app/constants/colors.ts`.
- Admin/coordinator “create class” / full CRUD flows may be **stubbed or simplified** in places (e.g. coordinator modal).
- Database RPCs, RLS, and quiz scoring rules in the doc should be verified against your live Supabase project.

---

## 4. Change log (what was done)

### 4.1 Auth & routing (interface connection)

- **`UserRole`** aligned with Supabase check constraint: `admin` | `coordinator` | `student` | `independent` (`app/types/index.ts`).
- **`app/constants/routing.ts`** added: maps each role to a real Expo path (`/admin`, `/coordinator`, `/student`, `/independent`).
- **`app/index.tsx`** uses `getHomeHrefForRole()` — fixes broken redirects that pointed at non-existent routes (`/independent_grower`, `/program_coordinator`).
- **`app/independent/_layout.tsx`** gates `independent` role; **`app/validators/index.ts`** signup `role` enum matches signup UI.
- **`app/auth/login.tsx`**: static `getProfile` import (no dynamic import).
- **`nativewind-env.d.ts`** replaces `app.d.ts` for NativeWind types (avoids name clash with `app/` folder per NativeWind guidance).
- **Tab noise**: `course/[id]` and `lesson/[id]` hidden from tab bars via `href: null` in `student` and `independent` `_layout.tsx`.
- **`app/independent/lesson/[id].tsx`** added so independent learners open lessons inside their stack (not student routes).

### 4.2 Styling stack (Tailwind / NativeWind)

**Problem:** `className` Tailwind utilities did not apply because **NativeWind was not installed** while screens used `className` everywhere; **Tailwind v4** was present but NativeWind’s documented setup targets **Tailwind v3**.

**Changes:**

- Dependencies: **`nativewind`**, **`react-native-reanimated`**; **`tailwindcss` ^3.4.17** as devDependency (removed v4 from dependencies).
- **`global.css`**: `@tailwind base/components/utilities`.
- **`tailwind.config.js`**: `presets: [require("nativewind/preset")]`.
- **`babel.config.js`**: `jsxImportSource: "nativewind"`, `nativewind/babel`, `react-native-reanimated/plugin` (last).
- **`metro.config.js`**: `withNativeWind(config, { input: "./global.css" })` composed with existing Rork Metro wrapper.
- **`app/_layout.tsx`**: `import 'react-native-reanimated'` and `import '../global.css'`.
- **`app.json`**: `expo.web.bundler: "metro"` for web.
- After changes, use **`npx expo start -c`** when Metro/Babel mis-cache.

### 4.3 Shared LMS UI library

Under **`components/shared/`**:

| Layer | Components |
|-------|------------|
| Atoms | `Button`, `Input`, `Badge`, `ProgressBar`, `Avatar` |
| Molecules | `FormField`, `CourseCard`, `AlertBanner`, `SearchBar`, `EmptyState`, `LessonRow` |
| Organisms | `ScreenHeader` |

Barrel export: `@/components/shared`.

**Screens refactored to use these** (non-exhaustive): `app/auth/login.tsx`, `signup.tsx`, student `index`, `discover`, `course/[id]`, `lesson/[id]`, independent `index`, `explore`, `course/[id]`, `lesson/[id]`, coordinator `index`, `admin/index.tsx`.

### 4.4 Public-first home (guest browse)

- **`app/index.tsx`**: After auth finishes loading, **guests** (not signed in) stay on the **public course catalogue** instead of being sent to login. **Signed-in** users still `Redirect` to their role dashboard (`getHomeHrefForRole`).
- **`components/screens/PublicCatalogHome.tsx`**: Read-only list of published courses (`getCourses`), search, **Sign in** link, tap body → **`/course/[id]`** preview.
- **`app/course/[id].tsx`**: **Public read-only** outline (title, description, lesson list). **Enrol** shows an alert and routes to **`/auth/login`** — no enrolment mutation for guests (front-end only).
- **`app/_layout.tsx`**: Stack registers the **`course`** segment.
- **`CourseCard`**: If both **`onPress`** and **`footer`** are set, only the **body** is wrapped in the pressable so the **Enrol** button does not steal taps from nested actions.

### 4.5 Luxury visual pass (borderless / soft)

Design goal: **quiet luxury** — thin pill buttons, **no hard borders**, cards **blend** via translucency (`bg-white/72`, `bg-white/6`, etc.), **large radii** (`rounded-3xl` / pills), **light typography** on headings, separation by **spacing and soft shadow** rather than strokes.

Updated: shared components above + auth cards + student/independent/coordinator/admin surfaces that were still border-heavy.

**Color palette** (greens, slate, earth, accent, cyan) was **not replaced**; only **presentation** changed.

> **Note:** Anonymous catalogue reads depend on Supabase **RLS** (e.g. `is_published` policies). If the list is empty while logged out, adjust policies or use a public read RPC — the UI is ready.

### 4.6 LMS AI assistant — **Nolwazi** (Gemini)

- **Name & role:** **Nolwazi** (“mother of knowledge”) — AgroLearn / Imbewu guide: concise, calm, lightly witty; answers about the product, stack, roles, and learning flows.
- **System instruction:** `NOLWAZI_SYSTEM_INSTRUCTION` in `app/constants/nolwaziKnowledge.ts` encodes tone, humor boundaries, and a **strict reply shape**: short witty opener → direct answer (default 1–3 sentences unless user asks for depth) → **one** follow-up question. Product facts live in `AGROLEARN_PRODUCT_CONTEXT` in the same file.
- **API:** `app/services/gemini.ts` calls `v1beta` `generateContent` with `fetch`. Default model **`gemini-flash-latest`**; on **429 / 503 / 404** tries fallbacks (`gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`). `maxOutputTokens` **512** to bias brevity. Key: **`EXPO_PUBLIC_GEMINI_API_KEY`** (optional `expo.extra.geminiApiKey`); documented in `.env.example`.
- **Chat history:** `app/nolwazi.tsx` strips the local welcome bubble from API `contents` so the first turn is always `user` (avoids invalid `model`-first conversations).
- **Navigation:** **`/nolwazi`** registered in root `app/_layout.tsx`. **Guest catalogue** (`PublicCatalogHome`) — message icon; **`app/auth/login.tsx`** — “Chat with Nolwazi”. **`/fieldwise`** remains as a **redirect** to `/nolwazi` for old links.
- **Security note:** `EXPO_PUBLIC_*` keys ship in the client bundle; treat the Gemini key as public-exposed (quotas, abuse). Prefer a backend proxy for production if you need to hide keys.

### 4.7 Supabase migration + seed stabilization (April 2026)

This phase focused on getting the linked Supabase project into a reliable non-empty state and ensuring first-load catalogue reads work for guests.

- Added and applied seed migrations under `supabase/migrations/`:
  - `20260423110000_seed_courses_content.sql`
  - `20260423113000_seed_courses_on_first_user.sql`
  - `20260423121500_bootstrap_auth_and_seed_content.sql`
  - `20260423123000_seed_verification_rpc.sql`
  - `20260423130000_allow_public_published_courses.sql`
- Seeded baseline LMS data (idempotent upsert approach):
  - `courses` (4), `lessons` (12), `quizzes` (12), `questions` (12), `question_options` (24), `badges` (4)
- Added helper RPC `public.get_seed_data_counts()` for quick verification of row counts.
- Updated RLS so `is_published = true` courses are selectable by guests; this unblocks the public catalogue on `/`.

### 4.8 Feature 4 implementation — course/lesson/progress/enrolment services

Implemented the milestone Feature 4 architecture with service-first Supabase access and React Query hooks:

- New services:
  - `app/services/courseService.ts`
  - `app/services/lessonService.ts`
  - `app/services/progressService.ts`
  - `app/services/enrolmentService.ts`
- New hooks:
  - `app/hooks/useCourse.ts` (`useCourses`, `useCourse`, `useProgress`)
- `components/screens/PublicCatalogHome.tsx` now uses `useCourses()` instead of direct legacy querying.
- Query constraints followed:
  - no `select('*')` in new Feature 4 service queries
  - nested selects for related entities where required
  - upsert pattern for lesson progress with `onConflict: 'user_id,lesson_id'`

### 4.9 Web bundling/runtime hardening

Two runtime blockers were addressed:

- JSX parser crash in `requireRole.ts` (caused by JSX in a `.ts` middleware file in prior state) was resolved by keeping middleware return values plain objects (`redirectTo` strings).
- Local startup mismatch due to Bun-dependent scripts on a machine without Bun:
  - `package.json` scripts were switched from `bunx rork ...` to standard Expo commands:
    - `start`: `expo start --tunnel`
    - `start-web`: `expo start --web`
    - `start-web-dev`: `expo start --web -c`
  - This stabilized web startup with `npm` and reduced cache-related bundling confusion.

---

## 5. How to run locally

1. Install dependencies: `npm install`
2. Env: set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; for Nolwazi, set **`EXPO_PUBLIC_GEMINI_API_KEY`** (see `.env.example`).
3. Start: `npm run start` or `npx expo start` (use **`npx expo start -c`** after NativeWind / Babel / Metro edits).
4. Optional web: per `package.json` scripts (`start-web`, etc.).

---

## 6. Suggested next steps

- Extend the **luxury** system to **remaining screens** (profiles, achievements, admin courses/users/settings, coordinator sub-screens) for consistency.
- Split **`supabase.ts`** into per-domain services to match `cursor_prompt_agri_app.md` and simplify testing.
- Add **`expo-clipboard`** for join-code copy on coordinator flows.
- Align **quiz / badge / progress** flows end-to-end with Supabase RLS + RPCs from the spec.

---

## 7. Related files

| Document | Role |
|----------|------|
| `cursor_prompt_agri_app.md` | Master product / architecture prompt |
| `PROJECT_STATUS.md` (this file) | Snapshot of implementation + change history |
| `README.md` | Project readme (update if you add setup badges or links) |

*Last updated to include Supabase seed/migration stabilization, Feature 4 service-layer implementation, and web startup hardening in addition to earlier routing, NativeWind, shared UI, and Nolwazi work.*
