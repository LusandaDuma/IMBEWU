# Imbewu GitHub Project Kanban Stories

Use this file to quickly copy-paste story titles and descriptions into GitHub Issues/Project items.

## Board Columns (Target)

- **Backlog** (capacity 5)
- **In progress** (capacity 3)
- **In review** (capacity 5)
- **Done** (no cap)

---

## Backlog (Priority Queue)

### 1) Title: Harden copilot tool audit logging
**Description (copy-paste):**  
Add structured audit logging for every Copilot tool call in `supabase/functions/copilot/index.ts` with fields for `user_id`, `role`, `tool`, `allowed/denied`, `timestamp`, and sanitized `args`. Ensure no secrets or raw tokens are logged.  
**Acceptance Criteria:**  
- All tool invocations produce one structured log entry.  
- Denied calls include denial reason (`role_not_allowed`, `invalid_args`, etc).  
- Logs are queryable by user and tool for security review.

### 2) Title: Add security tests for RLS policy regressions
**Description (copy-paste):**  
Create migration-level and API-level verification scripts that test key RLS behaviors for `profiles`, `course_enrolments`, `lesson_progress`, and `student_badges`.  
**Acceptance Criteria:**  
- Tests validate own-row access vs cross-user access denial.  
- Tests cover student/independent/admin role differences.  
- CI fails if any RLS expectation breaks.

### 3) Title: Finalize per-domain service split from legacy supabase.ts
**Description (copy-paste):**  
Refactor remaining query helpers in `app/_services/supabase.ts` into domain files (`authService`, `courseService`, `badgeService`, etc.) to reduce coupling and improve testability.  
**Acceptance Criteria:**  
- No new feature logic added to legacy `supabase.ts`.  
- Screens/hooks import only domain services.  
- Legacy file shrinks to client creation and compatibility wrappers.

### 4) Title: Add coordinator join-code copy UX with clipboard
**Description (copy-paste):**  
Implement one-tap join-code copy in coordinator flows using `expo-clipboard`, including success toast and fallback handling.  
**Acceptance Criteria:**  
- Join code copy works on web + native.  
- Visual confirmation appears after copy.  
- Covered on class list and class detail screens.

### 5) Title: Enforce CI quality gate with coverage threshold
**Description (copy-paste):**  
Add GitHub Actions workflow for lint + type-check + tests with minimum coverage gate (>= 60%), aligned with project checklist.  
**Acceptance Criteria:**  
- Workflow runs on push and PR to main.  
- Coverage threshold is enforced and blocks merge on failure.  
- README includes CI badge and branch protection guidance.

### 6) Title: Security review for public Gemini key exposure
**Description (copy-paste):**  
Document and implement practical abuse protections around `EXPO_PUBLIC_GEMINI_API_KEY` usage (rate limits, monitoring, usage alerts, optional proxy fallback).  
**Acceptance Criteria:**  
- Clear production risk note and mitigation plan documented.  
- Monitoring checklist exists for abnormal usage spikes.  
- Optional server mediation approach documented for future hardening.

### 7) Title: Badge issuance consistency checker job
**Description (copy-paste):**  
Add background verification script to reconcile completed courses vs `student_badges` rows and report/repair missing badge awards.  
**Acceptance Criteria:**  
- Script identifies completed-course users missing badges.  
- Safe idempotent repair path is available.  
- Report output includes course/user totals.

### 8) Title: Course completion event telemetry
**Description (copy-paste):**  
Emit analytics event when course completion hits 100% and when badge is awarded/shown. Use this to measure completion-to-recognition latency.  
**Acceptance Criteria:**  
- Event names standardized (`course_completed`, `badge_awarded`, `badge_viewed`).  
- Includes role, course_id, and timestamp.  
- No PII leakage in telemetry payloads.

### 9) Title: Add threat-model markdown in repo
**Description (copy-paste):**  
Create `SECURITY_THREAT_MODEL.md` summarizing the layered defenses (JWT, RBAC, RLS, mediation API, client allowlists) and known residual risks.  
**Acceptance Criteria:**  
- Includes attack scenarios and mitigations.  
- Maps controls to concrete files/functions.  
- Includes incident response playbook section.

### 10) Title: Implement secure error-mapping catalog
**Description (copy-paste):**  
Centralize Supabase/API error mapping so user-facing errors remain human-readable and never expose raw backend internals.  
**Acceptance Criteria:**  
- Shared mapper used by auth, enrolment, badge flows.  
- No raw DB error strings shown in UI.  
- Unit tests cover common error codes.

---

## In Progress (Active Work)

### 11) Title: Course completion badge reliability hardening
**Description (copy-paste):**  
Finalize and verify the fallback + retry badge-award flow for completed courses (student + independent), including achievements refresh and persistence.  
**Acceptance Criteria:**  
- Completing all lessons always results in badge visibility.  
- Existing already-completed users are backfilled.  
- No duplicate badge inserts.

### 12) Title: Completed-course first-click badge reveal flow
**Description (copy-paste):**  
Keep first-click behavior for completed courses routing to achievements/badge first, then normal course navigation on subsequent clicks.  
**Acceptance Criteria:**  
- First open uses per-user/per-course key.  
- Works for student and independent roles.  
- UX copy confirms why user was redirected.

### 13) Title: Branding compliance sweep across remaining screens
**Description (copy-paste):**  
Apply asset rules consistently: `icon` as app/favicon, `icon + name` pair where name lockup is used, avoid mixing `logo` when name is present.  
**Acceptance Criteria:**  
- All auth/profile/entry screens follow rule.  
- No mixed `logo + name` instances in same view.  
- Brand constants are used for reusable references.

---

## In Review (Ready for QA / PR review)

### 14) Title: Governed Nolwazi copilot via Supabase Edge mediation
**Description (copy-paste):**  
Review implementation of `copilot` Edge function with JWT verification, role-based tool allowlist, and RLS-preserving user-scoped client usage.  
**Acceptance Criteria:**  
- Tool access is denied for unauthorized role/tool combinations.  
- Unknown tool names are rejected.  
- Guest/private data boundaries are respected.

### 15) Title: Public-first catalog with auth-required enrolment gate
**Description (copy-paste):**  
Review guest catalog browse flow and sign-in gating for mutations (enrolment), including route behavior and copy.  
**Acceptance Criteria:**  
- Guests can browse published courses.  
- Enrol action prompts sign-in.  
- No unauthorized writes from guest sessions.

### 16) Title: Shared component library adoption pass
**Description (copy-paste):**  
Review migration of screens to shared atoms/molecules/organisms (`Button`, `FormField`, `CourseCard`, `ScreenHeader`) for consistency and maintainability.  
**Acceptance Criteria:**  
- No duplicated core input/button patterns on reviewed screens.  
- Visual consistency passes across role dashboards.  
- Shared exports are clean and stable.

### 17) Title: NativeWind + Tailwind v3 stabilization for web
**Description (copy-paste):**  
Review current styling stack setup (babel/metro/global.css/nativewind preset) and verify className behavior on web/native after cache clear.  
**Acceptance Criteria:**  
- No missing-style regressions.  
- Web startup path documented (`npx expo start -c` for cache issues).  
- Known limitations are documented.

### 18) Title: Seed and migration baseline verification
**Description (copy-paste):**  
Review seed migrations and data counts for courses, lessons, quizzes, and badges to guarantee non-empty demo environment.  
**Acceptance Criteria:**  
- Seed scripts are idempotent.  
- Public catalog data appears in guest mode.  
- Badge records exist per seeded course.

---

## Done (Already Created / Implemented)

### 19) Title: Role-based routing alignment with profile roles
**Description (copy-paste):**  
Implemented routing alignment for `admin`, `coordinator`, `student`, `independent` and corrected home redirects.

### 20) Title: NativeWind migration and Tailwind v3 compatibility
**Description (copy-paste):**  
Installed/configured NativeWind and reworked build config for stable className rendering on web/native.

### 21) Title: Shared LMS component system scaffolded and adopted
**Description (copy-paste):**  
Implemented and integrated shared UI component layers (atoms, molecules, organisms) across major screens.

### 22) Title: Public catalog home and guest flow implemented
**Description (copy-paste):**  
Guests can browse published courses from home with sign-in prompts for enrolment actions.

### 23) Title: Nolwazi assistant integrated with Gemini + tool orchestration
**Description (copy-paste):**  
Implemented in-app assistant with system instruction grounding, tool-call orchestration, and model fallback behavior.

### 24) Title: Copilot Edge mediation API with RBAC and allowlist
**Description (copy-paste):**  
Implemented secure server tool mediation through Supabase Edge Function with JWT checks and role gating.

### 25) Title: Course enrolments RLS updates for copilot flows
**Description (copy-paste):**  
Added migration for `course_enrolments` policy hardening aligned with controlled enrolment tool behavior.

### 26) Title: Branding asset rule implementation
**Description (copy-paste):**  
Added brand asset constants and applied icon/name/logo usage rule in key entry surfaces.

### 27) Title: Downloadable/shareable completion badge template
**Description (copy-paste):**  
Created completion badge template component plus share/download actions for learner achievements.

### 28) Title: Lesson-completion driven course badge award trigger
**Description (copy-paste):**  
Wired badge-award checks into lesson completion flow for student and independent roles.

### 29) Title: Completed-course first-click badge-first UX
**Description (copy-paste):**  
Implemented first-click redirect to achievements for completed courses with per-user/per-course persistence.

### 30) Title: Badge reliability fallback for already-completed courses
**Description (copy-paste):**  
Added achievements-side reconciliation path to trigger awards and show fallback completion badge data.

---

## Extra Security Story Snippets (Copy-Paste Pool)

### Title: Add signed request timestamp + replay protection to copilot API
**Description (copy-paste):**  
Add nonce/timestamp validation to reduce replay risk on tool invocation endpoint.

### Title: Add security headers and CSP for Expo web deploy
**Description (copy-paste):**  
Define baseline CSP and security headers for web deployment target to reduce XSS/mixed-content risk.

### Title: Add permission matrix doc for all DB tables
**Description (copy-paste):**  
Document role-by-role CRUD matrix and policy references per table to simplify audits.

### Title: Build abuse-monitor dashboard for AI tool usage
**Description (copy-paste):**  
Track tool-call volume, deny rate, and anomalous spikes to detect misuse early.

### Title: Add secure admin create-user flow test harness
**Description (copy-paste):**  
Verify admin account-creation flow does not clobber active admin session across web/native.

### Title: Add automated scan for accidental EXPO_PUBLIC secret usage
**Description (copy-paste):**  
CI check to detect risky exposure patterns and enforce approved environment variable usage.

---

## Suggested Fast Fill (for your current board limits)

- **Backlog (pick first 5):** #1, #2, #3, #5, #9  
- **In progress (pick 3):** #11, #12, #13  
- **In review (pick 5):** #14, #15, #16, #17, #18  
- **Done:** #19–#30

---

## Additional 30 Stories (Copy-Paste Ready)

### 31) Title: Add learner notifications center
**Description (copy-paste):**  
Create a notifications screen for students/independents with unread state, mark-as-read action, and event categories (course updates, badge earned, class notices).

### 32) Title: Add coordinator broadcast announcement tool
**Description (copy-paste):**  
Allow coordinators to post class announcements visible to enrolled students with timestamp and author.

### 33) Title: Add lesson bookmark and resume
**Description (copy-paste):**  
Enable learners to bookmark lesson positions and resume where they left off inside long lesson content.

### 34) Title: Add offline lesson cache indicators
**Description (copy-paste):**  
Surface whether a lesson is available offline and provide clear UI for downloaded vs cloud-only content.

### 35) Title: Add badge gallery by course
**Description (copy-paste):**  
Create a gallery grouped by course showing earned and locked badges with criteria and award date.

### 36) Title: Add profile edit for display name and language
**Description (copy-paste):**  
Implement profile edit form for first/last name and language preference with validation and optimistic UI.

### 37) Title: Add class roster export (CSV)
**Description (copy-paste):**  
Provide coordinator export action for class roster and progress metrics in CSV format.

### 38) Title: Add admin user disable/reactivate controls
**Description (copy-paste):**  
Allow admin to deactivate and reactivate user accounts safely with audit-friendly confirmation steps.

### 39) Title: Add audit trail screen for admin actions
**Description (copy-paste):**  
Track key admin actions (publish, user changes, class operations) with actor, timestamp, and target entity.

### 40) Title: Add lesson quality checklist in admin editor
**Description (copy-paste):**  
Add quality checklist prompts (title clarity, objectives, summary, duration) before publishing lessons.

### 41) Title: Add quiz question randomization option
**Description (copy-paste):**  
Support optional randomized question order per attempt while preserving grading integrity.

### 42) Title: Add quiz attempt cooldown settings
**Description (copy-paste):**  
Introduce configurable retry cooldown per quiz to reduce rapid brute-force retries.

### 43) Title: Add pass-score override per class
**Description (copy-paste):**  
Allow coordinators to configure class-specific pass thresholds for assigned courses where policy permits.

### 44) Title: Add learner streak decay logic
**Description (copy-paste):**  
Refine day-streak calculation with timezone-safe logic and clear reset behavior messaging.

### 45) Title: Add achievement timeline view
**Description (copy-paste):**  
Show chronological timeline of milestones (first lesson, course complete, badge awarded, streak milestones).

### 46) Title: Add metrics card for badge conversion rate
**Description (copy-paste):**  
Track percentage of enrolled learners who reach course completion and receive badges.

### 47) Title: Add course drop-off analytics funnel
**Description (copy-paste):**  
Create funnel chart data for lesson-by-lesson learner drop-off to guide content improvements.

### 48) Title: Add search indexing for large course catalog
**Description (copy-paste):**  
Optimize catalog search with indexed fields and relevance ordering for larger datasets.

### 49) Title: Add pagination for admin user list
**Description (copy-paste):**  
Implement server-backed pagination and filtering for admin user management screens.

### 50) Title: Add skeleton loaders for all dashboards
**Description (copy-paste):**  
Replace abrupt spinners with skeleton placeholders for perceived performance improvements.

### 51) Title: Add i18n scaffold for multilingual UI
**Description (copy-paste):**  
Set up translation infrastructure with English default and extensible language packs.

### 52) Title: Add accessibility pass for forms and badges
**Description (copy-paste):**  
Improve labels, roles, focus order, and contrast compliance across auth, course, and badge flows.

### 53) Title: Add e2e smoke tests for all four roles
**Description (copy-paste):**  
Create automated smoke scenarios validating login, navigation, and core action per role.

### 54) Title: Add robust empty/error states standardization
**Description (copy-paste):**  
Standardize empty and error state components to keep language and UX consistent across screens.

### 55) Title: Add stale query invalidation map documentation
**Description (copy-paste):**  
Document React Query key strategy and invalidation matrix for enrolment/progress/badge mutations.

### 56) Title: Add feature flags for experimental flows
**Description (copy-paste):**  
Introduce lightweight feature flag system for controlled rollout of new learner experiences.

### 57) Title: Add release checklist markdown for mobile/web
**Description (copy-paste):**  
Create pre-release checklist covering envs, migrations, QA matrix, and rollback steps.

### 58) Title: Add incident playbook for auth outages
**Description (copy-paste):**  
Document user-facing fallback behavior and operator runbook when auth provider is degraded.

### 59) Title: Add security scan for dependency vulnerabilities
**Description (copy-paste):**  
Integrate dependency vulnerability scanning in CI and triage policy for moderate/high findings.

### 60) Title: Add JWT expiry and refresh resilience tests
**Description (copy-paste):**  
Test session expiry/refresh across app lifecycle to prevent silent auth drift in long sessions.

### 61) Title: Add strict schema validation for copilot tool args
**Description (copy-paste):**  
Enforce runtime arg validation for each server tool with explicit error responses on malformed payloads.

### 62) Title: Add anomaly alerting for enrolment spikes
**Description (copy-paste):**  
Detect abnormal enrolment bursts by role/course and alert maintainers for potential abuse.

### 63) Title: Add safe-mode toggle to disable AI tools quickly
**Description (copy-paste):**  
Implement emergency feature switch to disable copilot mutations while preserving read-only chat.

### 64) Title: Add backup and recovery runbook for Supabase data
**Description (copy-paste):**  
Document backup cadence, restore rehearsal steps, and RTO/RPO expectations for production readiness.

### 65) Title: Add penetration test prep checklist
**Description (copy-paste):**  
Prepare scope, test accounts, environment guardrails, and reporting template for external security testing.

### 66) Title: Add security changelog section per release
**Description (copy-paste):**  
Track security-relevant fixes and policy updates in each release note for transparency and auditability.

### 67) Title: Add data retention policy for activity logs
**Description (copy-paste):**  
Define retention windows and purge strategy for telemetry, audit logs, and user activity records.

### 68) Title: Add privacy request workflow (export/delete)
**Description (copy-paste):**  
Implement operational flow for user data export and deletion requests with admin review steps.

### 69) Title: Add secure config validation on app startup
**Description (copy-paste):**  
Validate required environment variables at startup with safe, non-secret error guidance.

### 70) Title: Add red-team prompt injection test suite
**Description (copy-paste):**  
Build adversarial prompt tests to verify copilot refuses unsafe data-exfiltration and policy bypass attempts.

