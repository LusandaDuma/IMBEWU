# Imbewu / AgroLearn — Project status & change log

This document describes **where the codebase stands today** and **what was changed** during recent development (routing, styling stack, shared UI, luxury visual pass, and the **Nolwazi** LMS AI assistant with **mediation API + tool calling**). For the original milestone specification and SQL prompts, see `cursor_prompt_agri_app.md`.

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
- **Google Gemini** (Generative Language API, REST) for the in-app assistant **Nolwazi** — **function calling** + orchestration loop; **server tools** go only through a **Supabase Edge Function** (`copilot`) with JWT + RBAC (see §4.6 and §4.10).

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
| LMS AI (Gemini) | `app/services/gemini.ts` | `generateContent` REST client; model fallbacks on 429/404; exports `getGeminiApiKey()` |
| Nolwazi Copilot (orchestrator) | `app/services/geminiCopilot.ts` | Tool declarations, `runCopilotTurn` (model ↔ tools loop, max rounds) |
| Copilot → API client | `app/services/copilotApi.ts` | `invokeCopilotTool` → `POST …/functions/v1/copilot` with user JWT |
| Copilot client-only tools | `app/services/copilotClientTools.ts` | `navigateTo` (path allowlist), `signOut` (auth + store) |
| Nolwazi prompt + product grounding | `app/constants/nolwaziKnowledge.ts` | `AGROLEARN_PRODUCT_CONTEXT`, `NOLWAZI_SYSTEM_INSTRUCTION` |
| Nolwazi chat screen | `app/nolwazi.tsx` | Copilot UI, `apiContentsRef` for Gemini thread, **Actions** tool log, query invalidation on enrol |
| Mediation API (Edge) | `supabase/functions/copilot/index.ts` | Deno; verify JWT; tool registry + handlers; no ad-hoc SQL from the model |
| Legacy redirect | `app/fieldwise.tsx` | Redirects `/fieldwise` → `/nolwazi` |
| Typescript paths | `tsconfig.json` | `@/*` → `app/*`, `@/components/*` → `components/*`; **`exclude`**: `supabase/functions/**/*` (Deno Edge — not part of Expo `tsc`) |
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
- **Base Gemini client:** `app/services/gemini.ts` calls `v1beta` `generateContent` with `fetch`. Default model **`gemini-flash-latest`**; on **429 / 503 / 404** tries fallbacks (`gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`). Key: **`EXPO_PUBLIC_GEMINI_API_KEY`**. `generateGeminiReply` remains available for simple text-only flows; the **Nolwazi screen** now uses the **Copilot pipeline** in **§4.10** (tools + mediation).
- **Navigation:** **`/nolwazi`** registered in root `app/_layout.tsx`. **Guest catalogue** (`PublicCatalogHome`) — message icon; **`app/auth/login.tsx`** — “Chat with Nolwazi”. **`/fieldwise`** remains as a **redirect** to `/nolwazi` for old links.
- **Security note:** `EXPO_PUBLIC_*` keys ship in the client bundle; treat the Gemini key as public-exposed (quotas, abuse). **Service data** for Nolwazi is loaded via **Edge + user JWT** (§4.10), not by the model querying the DB.

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

### 4.10 Nolwazi AI Copilot — mediation API, tools, RLS (April 2026)

Enterprise-style **governed copilot**: the model may only call **registered tools**; **LMS mutations and reads** for account data go through a **Supabase Edge Function** so the LLM never holds database credentials and **RBAC is enforced server-side** before queries.

**Mediation API (Edge Function `copilot`)**

- **Path:** `POST {SUPABASE_URL}/functions/v1/copilot`
- **Headers:** `Authorization: Bearer <access_token>`, `apikey: <anon key>`, `Content-Type: application/json`
- **Body:** `{ "tool": "<name>", "args": { ... } }`
- **Behaviour:** Validates session with `auth.getUser()`; loads `profiles` for **role**; rejects tools not allowed for that role **before** DB work. Uses the **user-scoped Supabase client** (JWT) so **RLS** still applies as a second line of defence.
- **Source:** `supabase/functions/copilot/index.ts` (Deno). CORS enabled for web.

**Server tools (whitelist in the function)**

| Tool | Purpose | Role gate (API) |
|------|---------|------------------|
| `getMyProfile` | Current user profile | All authenticated |
| `getMyEnrolments` | Enrolments + course snippets | All authenticated |
| `getPublishedCourses` | Published catalogue list | All authenticated |
| `getProgressForCourse` | Progress + completion % (`courseId` UUID) | All authenticated; unpublished course only if already enrolled |
| `enrolIfEligible` | Self-serve `independent` enrol on **published** course if not already enrolled | **`student` and `independent` only**, `is_active` |

**Client-only tools (handled in the app, not the Edge Function)**

- `navigateTo` — `expo-router` `push` after **path allowlist** (`/auth`, `/course`, `/student`, `/independent`, `/coordinator`, `/admin`, `/nolwazi`, `/`).
- `signOut` — `authService.signOut` + `useAuthStore.clearAuth()` (no passwords in chat).

**Gemini orchestration (`app/services/geminiCopilot.ts`)**

- Declares the same seven tools to Gemini (`functionDeclarations` + `toolConfig.functionCallingConfig.mode: AUTO`).
- **Loop:** user message → model may return `functionCall` → execute (Edge or client) → append `functionResponse` → repeat until model returns text (max **8** tool rounds).
- **Unauthenticated users:** server tools return a structured error in the function response; the model is instructed not to invent account data.

**Nolwazi UI (`app/nolwazi.tsx`)**

- Persists **`apiContentsRef`** for the full Gemini thread (including tool parts), separate from the on-screen welcome bubble.
- Shows an **Actions** section with a short line per tool result.
- After successful `enrolIfEligible`, invalidates relevant React Query keys (`student-enrolments`, `available-courses`, `courses` / `course`).

**Database: `course_enrolments` RLS**

- Migration **`20260427150000_course_enrolments_rls_copilot.sql`** adds policies so direct JWT access is well-defined: **select** (own + admin), **insert** self-serve **independent** on **published** courses for **student/independent** active users, **update** own rows. **Security definer RPCs** (e.g. `join_class_with_code`) are unchanged and still bypass RLS where designed.

**CLI / `config.toml`**

- **`supabase functions deploy`** failed on **older CLI** parsing: removed unsupported keys from `config.toml` (`db.health_timeout`, `[storage.s3_protocol]` / `[storage.analytics]` / `[storage.vector]`, `auth.external.apple.email_optional`) so the file matches the installed Supabase CLI schema. **Deploy `copilot`** succeeds after this.

**Deploy checklist**

1. Apply new migration(s) on the linked project (local: `supabase db push` / remote: migration pipeline as you use it).
2. `supabase functions deploy copilot` (requires CLI + linked project).
3. App env unchanged: **`EXPO_PUBLIC_SUPABASE_URL`**, **`EXPO_PUBLIC_SUPABASE_ANON_KEY`**, **`EXPO_PUBLIC_GEMINI_API_KEY`**.

---

## 5. How to run locally

1. Install dependencies: `npm install`
2. Env: set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; for Nolwazi / Copilot, set **`EXPO_PUBLIC_GEMINI_API_KEY`** (see `.env.example`).
3. **Copilot server tools:** deploy the Edge Function to your Supabase project: `supabase functions deploy copilot`, and ensure migration **`20260427150000_course_enrolments_rls_copilot.sql`** is applied so enrolment + tools align with RLS.
4. Start: `npm run start` or `npx expo start` (use **`npx expo start -c`** after NativeWind / Babel / Metro edits).
5. Optional web: per `package.json` scripts (`start-web`, etc.).

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

*Last updated to include **Nolwazi AI Copilot** (Gemini function calling, `copilot` Edge mediation API, client tools, `course_enrolments` RLS migration, `config.toml` CLI compatibility), plus prior Supabase seed/migration stabilization, Feature 4 services, web startup hardening, routing, NativeWind, shared UI, and original Nolwazi prompting.*
