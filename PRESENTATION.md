# Imbewu / AgroLearn
## *Where agriculture meets learning—on every device*

A slide-style **presentation** you can use for demos, funding conversations, or internal alignment. It mirrors `README.md`, `PROJECT_STATUS.md`, and the master spec in `cursor_prompt_agri_app.md`. **Sections 7–10** go deep on **security (layered)**, **AI (stratified)**, the **core Nolwazi Copilot pilot**, and **signature micro-inventions**. **Section 13** is a **live-repo codebase snapshot** (structure, patterns, and honest gaps).

---

## 1. The one-liner

**Imbewu** (in-app) aligns with the **AgroLearn** vision: a modern **agricultural e-learning and LMS** experience—**mobile-first**, also on **web**—so learners and educators are never far from the field, the class, or the data room.

*Built with the same kind of stack trusted by high-scale consumer apps: React Native, Expo, and a serious Postgres backend.*

---

## 2. The story we sell

- **For learners (students & independents):** discover courses, work through ordered lessons, track progress, earn recognition—not a PDF in an email, but a **structured journey**.
- **For coordinators:** classes, join codes, and visibility into who is actually moving—**without** rebuilding a custom LMS.
- **For admins:** one place to see platform health, manage users, and keep content and governance aligned.
- **For everyone:** an assistant—**Nolwazi**—that **answers in context** about the product, learning paths, and (when you’re signed in) **real account data**—without handing the model raw database access.

*Marketing truth: the product is “learning that respects how agriculture works”—structured, practical, and accessible offline-friendly where the stack allows.*

---

## 3. What makes the *system* feel “enterprise”

| Pillar | What the buyer hears |
|--------|----------------------|
| **One codebase** | iOS, Android, and **web** from a **single Expo** project—faster features, one brand, fewer silos. |
| **File-based app structure** | **Expo Router** turns folders into clear navigation: auth, each role, public catalogue—**predictable** for teams and audits. |
| **Typed & validated** | **TypeScript** + **Zod**—fewer surprises in forms, roles, and API shapes. |
| **Server state that behaves** | **TanStack React Query**—caching, refetch, and a calmer UI when the network wobbles. |
| **Backend you can name** | **Supabase** on **PostgreSQL**—real relational data, not a spreadsheet with an API. |

*Implementation detail (for technical stakeholders):* services, validators, and shared UI are organized in clear layers, with a **governed AI path** for Nolwazi (see below).

---

## 4. Experience & theme

**Positioning:** *Calm, capable, and quietly premium*—**“quiet luxury”** in the UI: soft surfaces, **large radii**, **translucent cards**, **light typography**, separation by **space and soft shadow** rather than hard borders.

**Design system:**

- **NativeWind (Tailwind for React Native)** + **Tailwind** tokens in `tailwind.config.js`—**primary**, **accent**, **earth**, **slate** (and extended palette).
- **Global styling** through `global.css` and a consistent **className** story across components.
- **JS theme helpers** (e.g. app background, tab bar styling, Nolwazi FAB offset) keep **spacing and color** consistent where utilities meet imperative layout.
- **Lucide** icons for a clean, product-grade icon set.

**What we tell design partners:** *The palette stays agricultural—greens, earth, warmth—but the **craft** is in restraint: fewer borders, more breathing room.*

**Brand asset rule (current):**

- Use **`icon.png`** as favicon/app icon.
- Use **`name.png`** only with **`icon.png`** (icon + name lockup).
- If **`name.png`** is shown, do **not** use **`logo.png`** in the same view (logo already includes the name).

---

## 5. Setup (how teams actually start)

1. **Dependencies:** `npm install` (or your package manager of choice; the repo is aligned with **standard Expo** scripts).
2. **Environment:**  
   - `EXPO_PUBLIC_SUPABASE_URL`  
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`  
   - For Nolwazi / Copilot: `EXPO_PUBLIC_GEMINI_API_KEY` (see `.env.example` in the project for the full story).
3. **Supabase:** apply migrations and **deploy the `copilot` Edge Function** so AI tools that touch **your** data do so through **your** project’s rules (see security section).
4. **Run:** `npm run start` or `npx expo start` — use **`-c`** after heavy nativewind / Metro / Babel changes to clear caches.

*Pitch line:* *From clone to first screen in minutes; from first screen to production via **EAS** when you are ready to ship to stores or web hosting.*

---

## 6. Data & the “one brain” (PostgreSQL + Supabase)

**The narrative:** *Your course catalogue, people, and progress are not siloed files—they live in a **single relational model** you can report on, secure with policies, and extend.*

**Conceptual schema (from the spec):** profiles tied to auth; **courses** and **lessons**; **classes** and **class members**; **enrolments** (independent vs class-based); **lesson progress**; **quizzes** and **attempts**; **badges** and **student achievements**.

**Operational story:**

- Migrations and seeds bring a **credible non-empty** demo: published courses, lessons, quizzes, and public catalogue access where **RLS** allows guests to read **published** content.
- **React Query** keeps the app feeling fast while data syncs; optional **realtime** patterns are natural with Supabase when you want them.

*Buyer line:* *“It’s not a mock—it’s a **real** Postgres app with a path to production reporting and integrations.”*

---

## 7. Security — classified (how we talk about layers)

We present security as **defence in depth**—not one flag, not one vendor promise.

| Layer | What it is | What the buyer / auditor hears |
|--------|------------|----------------------------------|
| **A — Identity** | Supabase **Auth** (JWT sessions, industry-standard flow). | *“We know who is asking.”* |
| **B — Profile & role** | `profiles` linked to `auth.users`; **role** drives **routing** and **which tools** the Copilot may even *attempt* server-side. | *“The app and the server both understand **admin / coordinator / student / independent**.”* |
| **C — Data plane (RLS)** | **Row Level Security** on PostgreSQL: policies define **who** can `select/insert/update` on each table. | *“The database is not an open file—**policies** are the contract.”* |
| **D — Mediation API (Edge)** | The **`copilot`** Edge Function: **JWT verified**, **tool allowlist**, **RBAC** checked **before** any DB work; requests use a **user-scoped** Supabase client so **RLS still runs**. | *“The LLM never got database credentials. It gets **curated, named tools** on **your** infrastructure.”* |
| **E — Client boundary** | In-app only: **path allowlist** for `navigateTo` (no arbitrary URLs); `signOut` uses the same flow as a human tapping **Sign out**—**no password in chat**. | *“The chat cannot become a second browser to anywhere.”* |
| **F — Admin isolation** | Creating another user *while an admin stays signed in* can use a **separate, non-persisting** client so signup doesn’t clobber the admin session. | *“We thought about the **side-effect** of who is logged in when staff create accounts.”* |
| **G — Public vs private keys** | **Gemini** key is **`EXPO_PUBLIC_***` → ships in the bundle (treat as **exposed**): rate limits, monitoring, and abuse control matter. **Supabase** secrets stay server/Edge-side for mediation. | *“We’re honest: **inference** is client-keyed; **mutations to your data** are still **gated**.”* |

**Threat model (one slide, plain language)**

- **“Prompt injection to dump the DB”** — blocked: the model has **no SQL** and no service role; server tools are **finite** and **checked**; RLS is still on.
- **“Pretend to be another user”** — blocked: the Edge uses **the caller’s JWT**; you cannot call someone else’s row through the tool API without passing auth.
- **“Enrol the wrong people”** — `enrolIfEligible` is **role-gated** (e.g. **student / independent** only on the server) and **RLS** policies align with `course_enrolments` for inserts.
- **“Drift and confusion on web (many tabs / dev hot reload)”** — session storage uses browser primitives; the app can apply **pragmatic client hardening** (e.g. auth lock strategy) so **session read** does not block the product in dev or edge browsers.

*Elevator line:* *“**Policy at the table**, **policy at the API**, **policy in the Edge**—the model is a **synthesizer**, not a **superuser**.”*

---

## 8. AI — classified (what is “intelligence” vs “governance”)

| Stratum | Role | Invention-style framing |
|---------|------|-------------------------|
| **1 — Persona** | `NOLWAZI_SYSTEM_INSTRUCTION` + `AGROLEARN_PRODUCT_CONTEXT` — tone, boundaries, and **grounded** product facts. | *“A character sheet the model cannot improvise over.”* |
| **2 — Reasoning (Gemini)** | **Generative** layer: paraphrase, next-step suggestions, *when* to call a tool. | *“**Brain** in the cloud; **hands** in your stack.”* |
| **3 — Tool schema (declarations)** | Only **declared** functions (names + args + docs) are visible to the model; unknown tool requests are **rejected** in the loop. | *“**Schema-bound** tools—the model cannot invent a new HTTP endpoint by typing.”* |
| **4 — Orchestration loop** | `runCopilotTurn`: user/assistant **thread**; each round can return **text** or a **functionCall**; up to **8** tool rounds; each tool result is sent back as **functionResponse** so the next turn is **grounded**. | *“**ReAct-style** loop without the user seeing raw JSON.”* |
| **5 — Resilience** | Primary model + **fallbacks** on rate/availability; controlled **temperature** and **token** budget. | *“The assistant stays **up** when one model is busy.”* |
| **6 — Server vs client tools** | **Server** (Edge): profile, catalogue, progress, **controlled** enrol. **Client**: **safe** navigation, **signOut**. | *“**Split-brain** on purpose: data touches **Deno+RLS**; UI touches **Expo**.”* |

*Pitch:* *Nolwazi is not “ChatGPT in a WebView.” It is a **governed copilot** with a **fixed toolbelt** and **two executors** (Edge + app).*

---

## 9. Core Copilot pilot (Nolwazi) — what we demo

**The story:** *A single **pilot** experience—Nolwazi—where the **same** assistant can help a **guest** understand the product, a **learner** check progress, and (when policy allows) **act** in one tap behind the scenes.*

| Building block | Detail | “Wow” line |
|----------------|--------|------------|
| **Thread discipline** | Full Gemini `contents` (incl. tool parts) travel with the request so **context** and **grounding** survive multi-step turns. | *“**Memory** the model can *actually* use for follow-up tools.”* |
| **Tool registry (server)** | Examples: `getMyProfile`, `getMyEnrolments`, `getPublishedCourses`, `getProgressForCourse`, **`enrolIfEligible`** (only where role allows, **published** courses). | *“**Named capabilities**, not a raw database.”* |
| **Tool registry (client)** | `navigateTo` (path **allowlist**), `signOut` (app auth + store, **no** password in chat). | *“**Drive the app** from chat—**safely**.”* |
| **After-enrol sync** | Successful enrolment **invalidates** the right **React Query** keys (lists, course cache) so the next screen is **not stale**. | *“The assistant’s action and the **UI** agree a second later.”* |
| **Actions panel** | UI shows a compact **log of tool use** (what ran—not just the final text). | *“**Show your work**—**audit-friendly** and user-trust **friendly**.”* |
| **Guests** | If not signed in, **server tools** return a structured *not-allowed* style outcome; the model is **instructed** not to invent private rows. | *“**No magic backdoor** for account data when you’re logged out.”* |

*Tagline for the pilot:* *“**One chat surface**, **two execution planes** (Edge + device), **three lines of policy** (JWT + role + RLS).”*

---

## 10. Signature invention features — the “small” things that matter

*Micro-innovations you can use in decks—they’re not patents; they’re **product craft** and **risk reduction** in one line each.*

| Invention (pitch name) | What it does | Why it’s worth saying |
|--------------------------|--------------|------------------------|
| **“Glass cockpit” card UI** | Soft translucency, **no harsh borders**, **large radii**, airy typography—*quiet luxury* for an **LMS** that often looks like a spreadsheet. | *Differentiation on **feel** in a crowded category.* |
| **Public-first home** | Guests land on a **read-only** published catalogue; **enrol** routes to sign-in—**browsing without commitment**. | *Reduces **drop-off**; supports **field demos** (share link, no account).* |
| **Nolwazi FAB (floating action)** | Chat entry **above the tab bar** (safe-area aware)—always **one tap** to help without hiding navigation. | *“Help is a **control**, not a **modal trap**.”* |
| **Route hygiene** | Non-screen code lives in **`_`‑prefixed** app folders + path aliases so **Expo Router** only routes **real screens**—**cleaner** logs and **faster** mental model for the team. | *Shipping velocity + **fewer** routing glitches in dev.* |
| **“Two-layer” Nolwazi memory** | Thread kept for the **model API** separately from the **bubbles** you polish for humans—**full fidelity** for tools without a messy screen. | *“**Power** for the model, **clarity** for the user.”* |
| **Fieldwise handoff** | Old **`/fieldwise`** path **301-style** in spirit → **`/nolwazi`** so marketing links don’t break when the name evolved. | *Small *trust* move for **URLs** and comms.* |
| **Auth errors as human language** | Map Supabase errors to **stable** product messages (e.g. invalid login)—**no** raw server strings to learners. | *Polish and **support** defensibility.* |
| **Relative time that never whitescreens** | Admin analytics show “**Xm ago**” with a **safe fallback** when browser `RelativeTimeFormat` is missing (some RN / web runtimes). | *“**Never** crash a dashboard for a **date API**.”* |
| **Session / lock pragmatism (web)** | Configurable **auth storage locking** so **Strict Mode** / HMR / concurrent session reads don’t throw **Web Lock** errors in **Expo web** dev. | *Dev and **demo** stability—**not** a security bypass of your policies.* |

*One-line umbrella:* *The product is full of **intentional small bets** that make the **pilot** feel **production-grade**—not a demo with a **chat box** glued on.*

---

## 11. Four roles, one product surface

| Role | Promise |
|------|---------|
| **Admin** | Platform pulse, users, content oversight—**control room** energy. |
| **Coordinator** | **Classes**, join codes, and learner progress—**teaching** energy. |
| **Student** | **Join a class**, follow the path, **badges** and **structure**. |
| **Independent** | **Self-serve** enrolment on **published** courses—**flexibility** without a coordinator. |

*Routing sends each role to a dedicated area—*no generic “one dashboard for all.”*

---

## 12. Roadmap (honest, forward-looking)

- Extend the **visual system** to every corner (profiles, admin detail, achievements—full **quiet luxury** consistency).
- Deeper end-to-end alignment on **quizzes, badges, and RPCs** with the spec’s security rules.
- **Quality-of-life** features (e.g. join-code copy, etc.) as the product matures.

*Closing line for slides:* **Imbewu / AgroLearn** is a **credible, shippable learning platform** with a **governed AI co-pilot**—built for **trust**, **clarity**, and **growth in agricultural education**.

---

## 13. Codebase analysis (verified against the repo)

*This section is not marketing fluff—it describes **how the code is actually organized** as of the last pass over the tree (`app/`, `components/`, `supabase/`). Use it for technical due-diligence or onboarding slides.*

### Stack (from `package.json` and usage)

- **Expo** (~54) · **Expo Router** (file-based routes) · **React Native** · **React 19** · **TypeScript** (`strict`)
- **TanStack React Query** — global `QueryClient` in root `app/_layout.tsx` with **mutations** using `networkMode: 'always'` (commented for React Native / NetInfo quirk: avoids mutations never running when “offline”)
- **Zustand** + **`persist` + `AsyncStorage`** in `app/_store/authStore.ts` for **auth + profile** snapshot on device
- **Zod** — auth (and more) in `app/_validators/`
- **NativeWind** + **Tailwind 3** + **global.css**; **Lucide** for icons
- **Supabase** JS client; **@supabase/ssr** present in dependencies (Expo is primarily direct client)
- **Google Generative Language API** (Gemini) via `fetch` in `app/_services/gemini.ts` and orchestration in `geminiCopilot.ts`
- **Edge runtime:** `supabase/functions/copilot/index.ts` (Deno) — not type-checked with Expo’s `tsc` (`tsconfig` **excludes** `supabase/functions`)

### `app/` layout: routes vs. private code

| Convention | What lives there | Why it matters |
|--------------|------------------|----------------|
| **Normal folders** | `auth/`, `student/`, `coordinator/`, `admin/`, `independent/`, `course/`, `nolwazi.tsx`, `index.tsx`, etc. | **Expo Router** treats these as **screens** or segments. |
| **Underscore-prefixed** | `_services/`, `_store/`, `_constants/`, `_hooks/`, `_lib/`, `_middleware/`, `_types/`, `_validators/`, `_utils/` | **Not URL routes** — avoids spurious “missing default export” warnings and keeps **library code** out of the route graph. |
| **Path aliases** | `@/services/*` → `app/_services/*`, same pattern for `store`, `constants`, `hooks`, `lib`, … | Imports read like `import … from '@/services/…'` while files physically sit under `_services/`. |

### Data & backend touchpoints

- **Single Supabase client** from `app/_services/supabase.ts` (singleton `createClient`, optional `auth` options such as a **no-op lock** for web dev stability).
- **“Fat” legacy surface:** `app/_services/supabase.ts` still contains **large inline query helpers** (courses, classes, progress, etc.) in addition to newer **modular** services: `courseService`, `lessonService`, `progressService`, `enrolmentService`, `adminService`, `learnerDashboardStats`, `authService`, `profileService`.
- **Migrations:** **14** SQL files under `supabase/migrations/` (init, RPCs e.g. quiz submit / join class / badges, seed & public read policies, RLS for coordinator content, `course_enrolments` for Copilot, lessons `video_url`, etc.).

### Auth & access control (as implemented in code)

- **Bootstrap:** `getSession()` + profile fetch in root layout; **subscription** to `supabase.auth.onAuthStateChange` to keep Zustand in sync.
- **Role gating** is **layout-first**: e.g. `student/_layout.tsx` does `if (!isAuthenticated) Redirect → /auth/login`; `if (role !== 'student') Redirect → /`. Same pattern for other role tabs. The **`requireAuth` / `requireRole` helpers** in `app/_middleware/` exist as **plain functions**; they are **not** wired as a global router middleware in the way some Next.js apps do—**discipline is per-layout `Redirect`**, not a single middleware file driving every screen.
- **Entry behaviour:** `app/index.tsx` — **loading** state with branded splash, then **guests** see **PublicCatalogHome**, **signed-in** users **Redirect** via `getHomeHrefForRole` (`app/_constants/routing.ts`).

### AI (code-level)

- **Copilot** loop in `app/_services/geminiCopilot.ts` — `MAX_TOOL_ROUNDS = 8`, **function declarations** list aligned with **Edge** + **client** tools, **model fallbacks** on 429/503/404, **unknown tool** requests blocked in code.
- **Edge invocation** via `app/_services/copilotApi.ts` — POST to `…/functions/v1/copilot` with **user JWT** + `apikey`.
- **Client-only tools** in `app/_services/copilotClientTools.ts` — e.g. path allowlist for navigation, sign-out.
- **Nolwazi screen** `app/nolwazi.tsx` — full **Gemini** thread handling + **Actions** UI (implementation detail for demos).

### UI kit

- **`components/shared/`** — **atoms** (Button, Input, Badge, …) · **molecules** (CourseCard, FormField, DashboardStatsGrid, …) · **organisms** (ScreenHeader, NolwaziFab) · **barrel** `components/shared/index.ts`
- **Screen-only** pieces under `components/screens/` (e.g. **PublicCatalogHome**)
- **Root chrome:** `NolwaziFab` + **`SupabaseRealtimeSync`** in root layout for optional realtime session/profile alignment

### Honest gaps (spec vs. repo)

- Long-form **`cursor_prompt_agri_app.md`** describes a **fully split** `services/` per domain only; the repo is **hybrid** — **one large `supabase.ts`** **plus** separate service modules. Refactors can converge over time.
- **Theme tokens** in the spec’s `theme/theme.ts` sense are partly expressed as **`tailwind.config.js` + `app/_constants/theme.ts` + `colors.ts`**—not a single `theme.ts` at repo root.
- **Middleware** files are **not** the primary enforcement mechanism; **layouts** are. Rename or document to avoid a false sense of “central gate.”

*One line for a tech slide:* *“**~100+** TypeScript/TSX source files, **one** Supabase project shape, **two** execution surfaces for Nolwazi (**app + Edge**), **14** migration files worth of real backend.”*

---

*Document generated to support stakeholder presentations; for change history, see `PROJECT_STATUS.md`; for build instructions and milestones, `cursor_prompt_agri_app.md` and `README.md`.*
