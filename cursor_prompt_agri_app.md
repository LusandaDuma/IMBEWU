# Agri Learning Platform — Cursor Prompt Document
## Expo App · Supabase Backend · Milestone 3 Ready

> **Due: 17 April 2026 | 12% of Module Mark**
> Use this document as your master prompt reference for Cursor. Feed each section as a separate prompt in order. Always start a new Cursor chat per feature area.

---

## PROJECT OVERVIEW PROMPT
> Paste this first in every new Cursor session to set context.

```
You are building an agricultural e-learning mobile app called "AgroLearn" using:
- Expo (React Native) with Expo Router for file-based routing
- Supabase for auth, database, and storage
- NativeWind (Tailwind CSS for React Native) for styling
- Zustand for global state management
- React Query (@tanstack/react-query) for server state and caching
- Zod for validation schemas shared between frontend and backend logic

The app has four roles:
1. admin — loads content (courses, lessons, quizzes). Manages platform.
2. coordinator — creates classes, shares join_code, tracks student progress. Has a paid subscription.
3. student — joins a class via 6-char join_code, works through lessons and quizzes, earns badges.
4. independent — self-paced learner. Enrols directly on a course, no class, no coordinator.

Branding rules:
- `assets/images/icon.png` is the default icon and favicon.
- If `name.png` is used in a view, pair it with `icon.png` and do not also render `logo.png` in that same view.
- `logo.png` can be used as a standalone lockup where `name.png` is not rendered separately.

Database is Supabase (Postgres). Key tables:
- auth.users (Supabase managed)
- profiles (id FK→auth.users, first_name, last_name, role, language, is_active, last_login, updated_at)
- subscriptions (coordinator plans: coordinator R199/mo 20 slots | enterprise unlimited)
- classes (id, course_id FK, created_by FK, name, join_code UNIQUE, is_active, created_at)
- class_members (id, class_id FK, user_id FK, role: coordinator|student, joined_at) — composite UQ (class_id, user_id)
- courses (id, created_by FK, title, description, offline_url, is_published, created_at, updated_at)
- lessons (id, course_id FK, order_index, title, description, content, duration_mins, created_at, updated_at)
- lesson_progress (id, user_id FK, lesson_id FK, pct_complete, is_completed, completed_at) — composite UQ (user_id, lesson_id) — UPSERT pattern
- course_enrolments (id, user_id FK, course_id FK, enrolment_type: independent|class_based, enrolled_at) — composite UQ (user_id, course_id)
- quizzes (id, lesson_id FK, title, pass_score int default 70, max_attempts int default 3, due_date, created_at)
- questions (id, quiz_id FK, text, type: mcq|true_false|short_answer, order_index)
- question_options (id, question_id FK, text, is_correct bool, order_index)
- quiz_attempts (id, quiz_id FK, user_id FK, score, passed, attempt_number, attempted_at)
- attempt_answers (id, attempt_id FK, question_id FK, option_id FK nullable, text_answer nullable, is_correct)
- badges (id, course_id FK, name, icon_url, criteria)
- student_badges (id, user_id FK, badge_id FK, awarded_at) — composite UQ (user_id, badge_id)

Engineering rules (Milestone 3):
- ALL Supabase calls go through /services/ — never call supabase directly in a component
- ALL design tokens in theme.ts — never hardcode colors or spacing
- ALL shared components in /components/shared/ — atoms, molecules, organisms
- ALL utility functions in /utils/ with JSDoc
- Auth middleware (requireAuth, requireRole) in /middleware/
- Zod schemas in /validators/
- Feature branches only — never commit to main directly
- Conventional commits: feat(scope): description
- Use Supabase RLS — all queries respect row-level security
```

---

## FILE STRUCTURE PROMPT

```
Scaffold the following folder structure for the AgroLearn Expo app. 
Create empty index files with JSDoc headers for each. Do not fill in logic yet.

agro-learn/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (admin)/
│   │   ├── dashboard.tsx
│   │   ├── courses/
│   │   │   ├── index.tsx
│   │   │   ├── [courseId].tsx
│   │   │   └── create.tsx
│   │   └── _layout.tsx
│   ├── (coordinator)/
│   │   ├── dashboard.tsx
│   │   ├── classes/
│   │   │   ├── index.tsx
│   │   │   ├── [classId].tsx
│   │   │   └── create.tsx
│   │   └── _layout.tsx
│   ├── (student)/
│   │   ├── dashboard.tsx
│   │   ├── my-classes.tsx
│   │   ├── join-class.tsx
│   │   └── _layout.tsx
│   ├── (independent)/
│   │   ├── dashboard.tsx
│   │   ├── browse.tsx
│   │   └── _layout.tsx
│   ├── (shared)/
│   │   ├── course/[courseId]/
│   │   │   ├── index.tsx
│   │   │   ├── lesson/[lessonId].tsx
│   │   │   └── quiz/[quizId].tsx
│   │   ├── profile.tsx
│   │   └── badges.tsx
│   └── _layout.tsx               # Root layout with auth gate
│
├── components/
│   ├── shared/
│   │   ├── atoms/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── index.ts          # barrel export
│   │   ├── molecules/
│   │   │   ├── FormField.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   ├── LessonRow.tsx
│   │   │   ├── QuizOption.tsx
│   │   │   ├── StudentRow.tsx
│   │   │   ├── AlertBanner.tsx
│   │   │   └── index.ts
│   │   ├── organisms/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── CourseList.tsx
│   │   │   ├── LessonList.tsx
│   │   │   ├── ProgressReport.tsx
│   │   │   └── index.ts
│   │   └── index.ts              # master barrel
│   └── screens/                  # screen-specific, non-shared components
│
├── services/                     # ALL Supabase calls live here
│   ├── supabase.ts               # single Supabase client instance
│   ├── authService.ts
│   ├── profileService.ts
│   ├── courseService.ts
│   ├── lessonService.ts
│   ├── progressService.ts
│   ├── classService.ts
│   ├── quizService.ts
│   ├── badgeService.ts
│   └── index.ts
│
├── store/                        # Zustand global state
│   ├── authStore.ts              # user session, role, profile
│   ├── uiStore.ts                # loading, toasts, modals
│   └── index.ts
│
├── validators/                   # Zod schemas
│   ├── authSchemas.ts
│   ├── courseSchemas.ts
│   ├── classSchemas.ts
│   ├── quizSchemas.ts
│   └── index.ts
│
├── utils/
│   ├── dateUtils.ts              # formatDate, timeAgo, isExpired
│   ├── formatters.ts             # formatZAR, truncate, formatFileSize
│   ├── validators.ts             # isValidEmail, isStrongPassword, isValidPhoneZA
│   ├── apiResponse.ts            # success(), error(), paginated()
│   ├── constants.ts              # USER_ROLES, DATE_FORMATS, HTTP_STATUS
│   └── index.ts
│
├── hooks/                        # custom React hooks
│   ├── useAuth.ts
│   ├── useRole.ts
│   ├── useCourse.ts
│   └── useProgress.ts
│
├── middleware/
│   ├── requireAuth.ts
│   └── requireRole.ts
│
├── theme/
│   ├── theme.ts                  # all design tokens
│   └── index.ts
│
├── types/
│   ├── database.types.ts         # generated Supabase types
│   ├── app.types.ts
│   └── index.ts
│
├── .env.example
├── .env.local                    # in .gitignore
├── tailwind.config.js
└── app.json
```

---

## FEATURE 1 — SUPABASE CLIENT & AUTH SERVICE

### User Story
> As any user, I want to sign up, log in, and be routed to the correct dashboard based on my role, so that each role sees only their relevant interface.

### Acceptance Criteria
- [ ] Single Supabase client instance exported from `services/supabase.ts`
- [ ] `authService.ts` exports: `signUp`, `signIn`, `signOut`, `getSession`, `refreshSession`
- [ ] On signup, a row is auto-created in `profiles` via Supabase trigger (handle in SQL trigger prompt separately)
- [ ] After login, `authStore` holds `{ user, profile, role, session }`
- [ ] Root `_layout.tsx` reads `authStore` and redirects: unauthenticated → `/login`, authenticated → `/(role)/dashboard`
- [ ] `requireAuth` middleware throws and redirects to login if no valid session
- [ ] `requireRole(role)` middleware throws 403 if user's profile role doesn't match

### Cursor Prompt
```
Using the project context above, implement Feature 1: Supabase Client & Auth Service.

1. Create services/supabase.ts:
   - Single supabase client using createClient from @supabase/supabase-js
   - Read EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from env
   - Export as default singleton — never instantiate elsewhere

2. Create services/authService.ts:
   - signUp(email, password, firstName, lastName, role) → creates auth user
   - signIn(email, password) → returns session
   - signOut() → clears session
   - getSession() → returns current session or null
   - All functions use try/catch, return { data, error } shape
   - JSDoc on every exported function

3. Create store/authStore.ts (Zustand):
   - State: { user, profile, role, session, isLoading }
   - Actions: setUser, setProfile, clearAuth, setLoading
   - Persist session using zustand/middleware persist with AsyncStorage

4. Create app/_layout.tsx (Expo Router root layout):
   - On mount, call getSession()
   - If no session → redirect to /(auth)/login
   - If session → fetch profile from profileService.getProfile(userId)
   - Route based on profile.role:
     admin → /(admin)/dashboard
     coordinator → /(coordinator)/dashboard
     student → /(student)/dashboard
     independent → /(independent)/dashboard

5. Create middleware/requireAuth.ts and middleware/requireRole.ts:
   - requireAuth: hook that checks authStore.session, redirects to login if null
   - requireRole(allowedRoles: string[]): hook that checks authStore.role against allowedRoles, throws if unauthorized

Engineering rules:
- No direct supabase calls in any component — services only
- No hardcoded strings — use constants.ts for role names
- Conventional commit message for this feature: feat(auth): add Supabase client, auth service, and role-based routing
```

---

## FEATURE 2 — DESIGN TOKENS & COMPONENT LIBRARY

### User Story
> As a developer, I want all UI built from shared atomic components using design tokens, so there is zero visual duplication and the app is maintainable.

### Acceptance Criteria
- [ ] `theme/theme.ts` defines all colors, spacing, font sizes, border radius as named tokens
- [ ] NativeWind `tailwind.config.js` extends theme with those tokens
- [ ] `Button` component accepts `variant` prop (primary, secondary, danger, ghost) and `size` prop (sm, md, lg)
- [ ] `Input` accepts `label`, `error`, `placeholder`, controlled value/onChange
- [ ] `Badge` accepts `label`, `color` variant
- [ ] `ProgressBar` accepts `value` (0–100), animated
- [ ] `FormField` wraps `Input` with label, error display, and helper text
- [ ] `CourseCard` accepts `title`, `description`, `progress`, `onPress`
- [ ] All components have JSDoc, accept `testID` prop, use theme tokens only

### Cursor Prompt
```
Using the project context above, implement Feature 2: Design Tokens and Component Library.

1. Create theme/theme.ts with these exact tokens:
   Colors:
   - primary: '#2D7A4F' (agricultural green)
   - primaryDark: '#1A5C36'
   - secondary: '#F5A623' (harvest amber)
   - background: '#F8F9F4'
   - surface: '#FFFFFF'
   - textPrimary: '#1A1A1A'
   - textSecondary: '#6B7280'
   - textMuted: '#9CA3AF'
   - border: '#E5E7EB'
   - success: '#059669'
   - warning: '#D97706'
   - danger: '#DC2626'
   - info: '#2563EB'
   
   Spacing (4-point scale):
   - xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
   
   Font sizes:
   - xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, display: 30
   
   Border radius:
   - sm: 6, md: 10, lg: 16, full: 9999

2. Extend tailwind.config.js to use these theme values as custom classes.

3. Create components/shared/atoms/Button.tsx:
   - Props: variant ('primary'|'secondary'|'danger'|'ghost'), size ('sm'|'md'|'lg'), label, onPress, isLoading, disabled, testID
   - Shows ActivityIndicator when isLoading
   - All styles from theme tokens — zero hardcoded values
   - JSDoc with prop descriptions

4. Create components/shared/atoms/Input.tsx:
   - Props: label?, placeholder, value, onChangeText, error?, secureTextEntry?, keyboardType?, testID
   - Error state changes border color to danger token
   - Uses theme tokens for all styles

5. Create components/shared/atoms/ProgressBar.tsx:
   - Props: value (0-100), color?, height?, animated?
   - Animate width change with Animated.Value from react-native
   - Accessible: accessibilityRole='progressbar', accessibilityValue

6. Create components/shared/atoms/Badge.tsx:
   - Props: label, variant ('success'|'warning'|'danger'|'info'|'neutral')
   - Pill shape, correct contrast from theme

7. Create components/shared/molecules/FormField.tsx:
   - Wraps Input with label (Text above), error (Text below in danger color), helper text
   - Uses FormField for all forms in the app — no raw Input in screens

8. Create components/shared/molecules/CourseCard.tsx:
   - Props: title, description, lessonCount, progress (0-100), onPress, isEnrolled?
   - Shows ProgressBar if progress > 0
   - Touchable with activeOpacity

9. Create barrel index.ts files for atoms/, molecules/, organisms/, and components/shared/
   - Clean imports: import { Button, Input, CourseCard } from '@/components/shared'

Engineering rules:
- No StyleSheet.create with hardcoded values — all from theme
- Every component testable: accepts testID prop
- Conventional commit: feat(ui): add design token system and shared component library
```

---

## FEATURE 3 — AUTH SCREENS (LOGIN & REGISTER)

### User Story
> As a new user, I want to register with my name, email, password, and role choice, so I can access the app. As a returning user, I want to log in and be taken to my correct dashboard.

### Acceptance Criteria
- [ ] Register screen: first name, last name, email, password, role picker (independent | student — coordinators sign up via different flow)
- [ ] Login screen: email, password fields with validation
- [ ] Zod validation schema for both forms — real-time field-level errors
- [ ] Loading state on submit button
- [ ] Network errors show as AlertBanner at top of screen — no raw error messages
- [ ] On success: auth state set, routed to correct dashboard
- [ ] All UI uses shared components only — no raw TextInput or TouchableOpacity

### Cursor Prompt
```
Using the project context above, implement Feature 3: Auth Screens.

1. Create validators/authSchemas.ts:
   - registerSchema (Zod): firstName (min 2), lastName (min 2), email (valid email), password (min 8, at least 1 uppercase, 1 number), role (enum: independent|student)
   - loginSchema (Zod): email, password (min 1)
   - Export inferred TypeScript types: RegisterFormData, LoginFormData

2. Create app/(auth)/register.tsx:
   - Form using react-hook-form + zodResolver
   - Fields: firstName, lastName, email, password, role (Picker or segmented control: "Self-learner" = independent, "Join a class" = student)
   - Use FormField molecule for every field — no raw inputs
   - Submit calls authService.signUp() then profileService.createProfile()
   - Show AlertBanner for API errors
   - Button shows spinner during loading
   - Link to login screen at bottom

3. Create app/(auth)/login.tsx:
   - Form: email, password with FormField
   - Submit calls authService.signIn()
   - On success: set authStore, redirect based on role
   - Show AlertBanner for invalid credentials
   - Link to register screen

4. Create components/shared/molecules/AlertBanner.tsx:
   - Props: message, variant ('error'|'success'|'warning'|'info'), onDismiss?
   - Dismissable with X button
   - Uses theme tokens for colors

Engineering rules:
- All validation in Zod schemas — no manual if/else validation in components
- Never show raw Supabase error messages to the user — map to human-readable messages in authService
- Conventional commit: feat(auth): add login and registration screens with Zod validation
```

---

## FEATURE 4 — COURSE & LESSON SERVICES

### User Story
> As an admin, I want to create and publish courses with ordered lessons and quizzes. As any learner, I want to browse published courses and work through lessons in order.

### Acceptance Criteria
- [ ] `courseService.ts` exports: `getPublishedCourses`, `getCourseById`, `createCourse`, `updateCourse`, `publishCourse`
- [ ] `lessonService.ts` exports: `getLessonsByCourse`, `getLessonById`, `createLesson`, `updateLesson`, `reorderLessons`
- [ ] All queries select only needed fields — no `select('*')`
- [ ] `getCourseById` fetches lessons in a single query using Supabase nested select — no N+1
- [ ] `progressService.ts` exports: `upsertProgress`, `getProgressByCourse`, `markLessonComplete`
- [ ] `enrolmentService.ts` exports: `enrolIndependent`, `getMyEnrolments`, `isEnrolled`

### Cursor Prompt
```
Using the project context above, implement Feature 4: Course and Lesson Services.

1. Create services/courseService.ts:
   - getPublishedCourses(): fetch courses where is_published=true, select id, title, description, created_at. Use React Query compatible return.
   - getCourseById(courseId): fetch course + lessons in one Supabase nested select:
     supabase.from('courses').select('id, title, description, offline_url, lessons(id, title, order_index, duration_mins)').eq('id', courseId).order('order_index', { foreignTable: 'lessons' })
     — never fetch lessons in a separate subsequent call (N+1)
   - createCourse(data: CreateCourseInput): insert, return new course
   - updateCourse(courseId, data): update only changed fields
   - publishCourse(courseId): update is_published = true
   - All functions: JSDoc, try/catch, return { data, error } shape

2. Create services/lessonService.ts:
   - getLessonById(lessonId): fetch lesson + quiz in single nested select
   - createLesson(data): insert, return new lesson
   - updateLesson(lessonId, data): patch lesson
   - reorderLessons(lessons: Array<{id, order_index}>): batch update order_index values

3. Create services/progressService.ts:
   - upsertProgress(userId, lessonId, pctComplete): 
     supabase.from('lesson_progress').upsert({ user_id, lesson_id, pct_complete }, { onConflict: 'user_id,lesson_id' })
     — always upsert, never insert then update
   - markLessonComplete(userId, lessonId): upsert with is_completed=true, completed_at=now()
   - getProgressByCourse(userId, courseId): fetch all lesson_progress rows for a user for all lessons in a course — single join query
   - getCourseCompletionPct(userId, courseId): computed from getProgressByCourse result

4. Create services/enrolmentService.ts:
   - enrolIndependent(userId, courseId): insert into course_enrolments with enrolment_type='independent', onConflict do nothing
   - enrolClassBased(userId, courseId): insert with enrolment_type='class_based'
   - getMyEnrolments(userId): fetch course_enrolments with nested course data
   - isEnrolled(userId, courseId): returns boolean

5. Create hooks/useCourse.ts:
   - useCourses(): React Query useQuery wrapping courseService.getPublishedCourses
   - useCourse(courseId): React Query useQuery wrapping courseService.getCourseById
   - useProgress(courseId): React Query useQuery wrapping progressService.getProgressByCourse
   - Stale time: 5 minutes for courses, 30 seconds for progress

Engineering rules:
- Never call supabase directly in a component or hook — always through a service function
- Never use select('*') — always name required columns explicitly
- N+1 rule: if data is related, fetch with nested select or join — never in a loop
- Conventional commit: feat(courses): add course, lesson, progress, and enrolment services
```

---

## FEATURE 5 — COORDINATOR FLOW

### User Story
> As a coordinator, I want to create classes linked to a course, share a join code with up to 20 students, and view each student's lesson progress and quiz scores.

### Acceptance Criteria
- [ ] Coordinator dashboard shows all their classes with student count and course name
- [ ] Create class screen: select published course, enter class name → generates unique 6-char `join_code`
- [ ] Class detail screen: lists enrolled students with overall course progress %
- [ ] Student detail screen: shows per-lesson completion and quiz scores
- [ ] Subscription slot check: block new student join if `count(class_members) >= subscription.student_slots`
- [ ] `classService.ts` exports: `createClass`, `getMyClasses`, `getClassById`, `getClassMembers`, `generateJoinCode`

### Cursor Prompt
```
Using the project context above, implement Feature 5: Coordinator Flow.

1. Create services/classService.ts:
   - generateJoinCode(): returns random 6-char alphanumeric string (e.g. 'AX7K2P')
   - createClass(coordinatorId, courseId, name): 
     insert into classes with join_code = generateJoinCode()
     then insert into class_members (class_id, user_id=coordinatorId, role='coordinator')
     then insert into course_enrolments (user_id=coordinatorId, course_id, enrolment_type='class_based')
     — all in a Supabase RPC (database function) to ensure atomicity
   - getMyClasses(coordinatorId): 
     fetch class_members where user_id=coordinatorId and role='coordinator'
     nested select: classes(id, name, join_code, is_active, courses(title), class_members(count))
   - getClassById(classId): fetch class + member count + course info
   - getClassMembers(classId): fetch all class_members where role='student', join profiles for name
   - getStudentProgress(classId, studentId): fetch lesson_progress for all lessons in class.course_id for that student
   - checkSlotAvailability(coordinatorId): fetch subscription.student_slots, count enrolled students across all coordinator's classes

2. Create app/(coordinator)/classes/index.tsx:
   - List of coordinator's classes using ClassCard molecule
   - FAB button to create new class
   - Each card shows: class name, course title, student count / slot limit, join_code

3. Create app/(coordinator)/classes/create.tsx:
   - Form: course picker (published courses), class name input
   - On submit: call classService.createClass
   - Show generated join_code in a modal after creation with copy-to-clipboard

4. Create app/(coordinator)/classes/[classId].tsx:
   - Header: class name, join_code (tap to copy), course title
   - Student list: StudentRow molecule showing name, progress bar (% complete), last active
   - Tap student → navigate to student detail

5. Create components/shared/molecules/StudentRow.tsx:
   - Props: firstName, lastName, progressPct, lastActive, onPress
   - Shows avatar initials, name, ProgressBar, timeAgo(lastActive)
   - Uses dateUtils.timeAgo for last active formatting

6. Create utils/dateUtils.ts:
   /**
    * Format a date to DD MMM YYYY string.
    * @param date - ISO string or Date object
    */
   export function formatDate(date: string | Date): string
   
   /**
    * Return relative time string e.g. "2 hours ago", "3 days ago"
    * @param date - ISO string or Date object
    */
   export function timeAgo(date: string | Date): string
   
   /**
    * Check if a date is in the past.
    */
   export function isExpired(date: string | Date): boolean

Engineering rules:
- Class creation must be atomic — use Supabase RPC, not sequential inserts from client
- Slot check must happen before join — enforce in classService, not in UI only
- Conventional commit: feat(coordinator): add class management, student tracking, and progress views
```

---

## FEATURE 6 — STUDENT FLOW

### User Story
> As a student, I want to enter a join code to enrol in a class, then work through lessons in order, complete a quiz after each lesson, and earn a badge when I finish the course.

### Acceptance Criteria
- [ ] Join class screen: text input for 6-char code, validates code exists, shows class/course name before confirming
- [ ] My classes screen: lists all enrolled classes with course progress
- [ ] Course screen: ordered lesson list, locked lessons (can't skip ahead), completed lessons marked
- [ ] Lesson screen: content display, mark as complete button, navigate to quiz
- [ ] Quiz screen: one question at a time, MCQ/true_false/short_answer rendered correctly
- [ ] Quiz result screen: score, pass/fail, retry if failed and attempts remain
- [ ] Badge awarded automatically when all lessons complete + all quizzes passed

### Cursor Prompt
```
Using the project context above, implement Feature 6: Student Flow.

1. Create app/(student)/join-class.tsx:
   - Input for 6-char join_code (auto-uppercase)
   - On submit: call classService.findClassByCode(code)
   - If found: show preview card (class name, course title, coordinator name)
   - Confirm button: call classService.joinClass(userId, classId)
     — inserts class_members row + course_enrolments row
   - If class not found: show AlertBanner 'Class not found. Check your code.'
   - If already enrolled: show 'You are already in this class.'

2. Create app/(student)/my-classes.tsx:
   - List of student's class_members joined to classes + courses
   - Each class shows: course title, class name, ProgressBar with % complete
   - Tap → navigate to /(shared)/course/[courseId]

3. Create app/(shared)/course/[courseId]/index.tsx (shared by student + independent):
   - Course header: title, description, enrol button (for independent not yet enrolled)
   - Lesson list in order_index order
   - Each lesson row: title, duration, completion status icon
   - Lesson locking: lesson N is locked if lesson N-1 is not completed (check lesson_progress)
   - Progress bar at top showing overall course %

4. Create app/(shared)/course/[courseId]/lesson/[lessonId].tsx:
   - Display lesson.content (support markdown via react-native-markdown-display)
   - Bottom sticky bar: "Mark as Complete" button
   - On complete: call progressService.markLessonComplete, then navigate to quiz if lesson has one
   - If no quiz: navigate back to course screen
   - Progress auto-saved every 30 seconds via upsertProgress

5. Create services/quizService.ts:
   - getQuizByLesson(lessonId): fetch quiz + questions + question_options (never expose is_correct to client)
   - submitQuiz(userId, quizId, answers: Answer[]): 
     compute score server-side via Supabase RPC (keeps is_correct logic on server)
     insert quiz_attempt + attempt_answers rows
     return { score, passed, attempt_number }
   - getMyAttempts(userId, quizId): fetch all attempts, return attempt_number count
   - checkAndAwardBadge(userId, courseId): RPC that checks if all lessons complete + all quizzes passed → inserts student_badges if criteria met

6. Create app/(shared)/course/[courseId]/quiz/[quizId].tsx:
   - Fetch quiz + questions (no is_correct field on client)
   - One question per screen with Next button
   - MCQ: radio-style QuizOption molecules
   - true_false: two large buttons (True / False)
   - short_answer: multiline TextInput
   - Progress indicator: "Question 2 of 5"
   - On final question: submit → call quizService.submitQuiz
   - Show ResultScreen: score %, pass/fail badge, "Retry" if failed + attempts remain, "Next Lesson" if passed

7. Create components/shared/molecules/QuizOption.tsx:
   - Props: text, isSelected, onPress, variant ('default'|'correct'|'incorrect') — variant shown only on results screen
   - Tap toggles selection, only one selectable at a time

Engineering rules:
- is_correct MUST NOT be fetched by any client query — quiz scoring happens via Supabase RPC only
- Lesson locking logic lives in a hook (useProgress), not duplicated in every screen
- Badge award is atomic RPC — not sequential client-side checks
- Conventional commit: feat(student): add join class, lesson, quiz, and badge award flows
```

---

## FEATURE 7 — INDEPENDENT LEARNER FLOW

### User Story
> As an independent learner, I want to browse all published courses, enrol in any course with one tap, and learn at my own pace with no coordinator or class.

### Acceptance Criteria
- [ ] Browse screen: grid of published CourseCards with search/filter
- [ ] Course detail: shows description, lesson count, duration, enrol button
- [ ] On enrol: `course_enrolments` row created with `enrolment_type='independent'`
- [ ] After enrolment: identical lesson/quiz flow as student (shared screens)
- [ ] My learning screen: all enrolled courses with progress
- [ ] No class, no join_code, no coordinator visibility

### Cursor Prompt
```
Using the project context above, implement Feature 7: Independent Learner Flow.

1. Create app/(independent)/browse.tsx:
   - useCourses() hook fetches published courses
   - SearchBar at top (filter by title client-side)
   - FlatList with 2-column grid of CourseCard molecules
   - Each card: title, description (truncated 80 chars), lesson count, "Enrol" or "Continue" button

2. Create app/(independent)/dashboard.tsx:
   - Section 1: "Continue Learning" — in-progress enrolments with ProgressBar
   - Section 2: "Browse Courses" — link to browse screen
   - Section 3: "My Badges" — earned badges grid
   - Uses getMyEnrolments(userId) from enrolmentService

3. On CourseCard tap → /(shared)/course/[courseId]:
   - If not enrolled: show enrol CTA at bottom
   - On enrol: call enrolmentService.enrolIndependent(userId, courseId)
   - Redirect to lesson 1 of the course
   - If enrolled: show course progress and lesson list (same shared screen as student)

4. Create app/(shared)/badges.tsx:
   - Grid of earned badges: icon, name, course name, awarded date
   - Empty state: "Complete a course to earn your first badge"
   - Uses badgeService.getMyBadges(userId)

5. Create services/badgeService.ts:
   - getMyBadges(userId): fetch student_badges joined to badges joined to courses
   - getAllBadges(courseId): fetch badges for a course (for course detail display)

Engineering rules:
- Independent flow reuses /(shared)/course and /(shared)/lesson screens — no duplication
- enrolmentService.enrolIndependent uses upsert with onConflict do nothing — safe to call twice
- Conventional commit: feat(independent): add course browse, enrol, and self-paced learning flow
```

---

## FEATURE 8 — ADMIN FLOW

### User Story
> As an admin, I want to create and publish courses, add ordered lessons to each course, and attach a quiz to each lesson.

### Acceptance Criteria
- [ ] Admin dashboard: stats (total courses, total students, active classes)
- [ ] Course list with publish/unpublish toggle
- [ ] Create/edit course form: title, description, offline_url
- [ ] Lesson list within a course: drag-to-reorder, add/edit/delete
- [ ] Create quiz for a lesson: title, pass_score, add questions (MCQ, true_false, short_answer)
- [ ] Question editor: add options, mark correct answer
- [ ] Only admin role can access these screens (requireRole guard)

### Cursor Prompt
```
Using the project context above, implement Feature 8: Admin Flow.

1. Create app/(admin)/dashboard.tsx:
   - Stats cards: Total Published Courses, Total Enrolled Learners, Active Classes
   - Recent courses list (last 5)
   - requireRole(['admin']) guard at top — redirect if not admin

2. Create app/(admin)/courses/index.tsx:
   - FlatList of all courses (published and draft)
   - Badge on each: 'Published' (green) or 'Draft' (gray)
   - Toggle publish/unpublish with Switch component
   - FAB to create new course

3. Create app/(admin)/courses/create.tsx and [courseId].tsx:
   - Form: title (required), description (required), offline_url (optional)
   - Zod schema: courseSchemas.createCourseSchema
   - On save: courseService.createCourse or courseService.updateCourse
   - Below form: lesson list with add button and drag handle for reordering

4. Create Lesson editor (modal or separate screen):
   - Fields: title, description, content (multiline), duration_mins
   - On save: lessonService.createLesson or updateLesson
   - After save: option to "Add Quiz to this Lesson"

5. Create Quiz editor:
   - Fields: title, pass_score (default 70), max_attempts (default 3), due_date (optional)
   - Question builder:
     - Type selector: MCQ | True/False | Short Answer
     - Question text input
     - For MCQ: up to 4 option inputs, radio to mark correct one
     - For True/False: auto-creates "True" and "False" options, radio for correct
     - For Short Answer: no options, note "Marked by keyword matching"
   - On save: quizService.createQuiz + createQuestions + createOptions in atomic RPC

6. Create validators/courseSchemas.ts (Zod):
   - createCourseSchema: title (min 5), description (min 20), offline_url (url or empty)
   - createLessonSchema: title (min 3), content (min 50), duration_mins (positive int)
   - createQuizSchema: title, pass_score (0-100), max_attempts (1-5)
   - createQuestionSchema: text (min 5), type (enum), options array validation

Engineering rules:
- Admin screens must check requireRole(['admin']) — never trust role from URL alone
- Quiz creation must be atomic RPC — questions + options inserted together or not at all
- All form validation via Zod schemas — no inline validation
- Conventional commit: feat(admin): add course, lesson, and quiz management screens
```

---

## FEATURE 9 — UTILITY LIBRARY & SHARED VALIDATORS

### User Story
> As a developer, I want all helper logic in one place so I never write the same formatter or validator twice.

### Cursor Prompt
```
Using the project context above, implement Feature 9: Utility Library.

Create the following files with full implementations and JSDoc on every exported function:

1. utils/dateUtils.ts:
   formatDate(date, format?: 'DD MMM YYYY' | 'YYYY-MM-DD'): string
   timeAgo(date): string  — "2 hours ago", "3 days ago", "just now"
   isExpired(date): boolean
   toISOString(date): string
   startOfDay(date): Date
   
2. utils/formatters.ts:
   formatZAR(amount: number): string  — "R 1 234.56"
   truncate(str: string, n: number): string  — add "..." if longer
   formatFileSize(bytes: number): string  — "1.2 MB"
   capitalize(str: string): string
   initials(firstName: string, lastName: string): string  — "JS"

3. utils/validators.ts:
   isValidEmail(str: string): boolean
   isStrongPassword(str: string): boolean  — min 8 chars, 1 uppercase, 1 number
   isValidPhoneZA(str: string): boolean  — South African format: 0XX XXX XXXX
   isValidJoinCode(str: string): boolean  — 6 alphanumeric chars
   isValidUrl(str: string): boolean

4. utils/apiResponse.ts:
   success<T>(data: T): { success: true; data: T }
   error(message: string, code?: string): { success: false; error: { message: string; code?: string } }
   paginated<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResponse<T>

5. utils/constants.ts:
   USER_ROLES: { ADMIN, COORDINATOR, STUDENT, INDEPENDENT }
   DATE_FORMATS: { DISPLAY, ISO, RELATIVE }
   HTTP_STATUS: { OK, CREATED, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR }
   QUIZ_TYPES: { MCQ, TRUE_FALSE, SHORT_ANSWER }
   ENROLMENT_TYPES: { INDEPENDENT, CLASS_BASED }
   SUBSCRIPTION_PLANS: { COORDINATOR, ENTERPRISE }
   DEFAULT_STUDENT_SLOTS: 20
   JOIN_CODE_LENGTH: 6

6. utils/index.ts — barrel export all utils

Engineering rules:
- Every function has JSDoc with @param and @returns
- No external dependencies in utils — pure functions only
- Write unit tests for each util in __tests__/utils/
- Conventional commit: feat(utils): add date, formatter, validator, and response utility library
```

---

## FEATURE 10 — GITHUB ACTIONS CI PIPELINE

### Cursor Prompt
```
Using the project context above, implement Feature 10: GitHub Actions CI Pipeline.

1. Create .github/workflows/ci.yml:
   name: CI
   Triggers: push to any branch, pull_request targeting main
   
   Jobs:
   a) lint:
      - runs-on: ubuntu-latest
      - steps: checkout, setup-node 20, npm ci, npm run lint (eslint)
   
   b) test:
      - runs-on: ubuntu-latest
      - steps: checkout, setup-node 20, npm ci, npm test -- --coverage --coverageThreshold='{"global":{"lines":60}}'
      - Upload coverage to Codecov
   
   c) type-check:
      - runs-on: ubuntu-latest
      - steps: checkout, setup-node 20, npm ci, npx tsc --noEmit

   All jobs must pass before PR can merge to main.

2. Create .env.example with all required keys and descriptions:
   # Supabase
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # App
   EXPO_PUBLIC_APP_ENV=development

3. Update README.md:
   - Project description
   - Setup instructions (npm install, env setup, npx expo start)
   - CI badge: [![CI](https://github.com/your-org/agro-learn/actions/workflows/ci.yml/badge.svg)](...)
   - Branch naming convention: feature/description, fix/description, chore/description
   - Commit convention: feat(scope): description, fix(scope): description
   - Folder structure overview

4. Create .gitignore additions:
   .env.local
   .env.*.local
   node_modules/
   .expo/
   dist/

5. Set up branch protection rules (document in README):
   - main branch: require PR, require CI to pass, no direct push

Engineering rules:
- Never commit .env.local — only .env.example
- CI must fail if coverage drops below 60%
- Conventional commit: chore(ci): add GitHub Actions CI pipeline and branch protection docs
```

---

## SUPABASE SQL PROMPT
> Run this separately in the Supabase SQL editor to create tables, RLS, and triggers.

```sql
-- Run this entire block in Supabase SQL Editor

-- Enable extensions
create extension if not exists "pgcrypto";

-- PROFILES (1-to-1 with auth.users, created by trigger on signup)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('admin', 'coordinator', 'student', 'independent')),
  language text default 'en',
  is_active bool default true,
  last_login timestamptz,
  updated_at timestamptz default now()
);

-- Auto-create profile on signup trigger
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'independent')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- SUBSCRIPTIONS
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('coordinator', 'enterprise')),
  student_slots int default 20,
  is_active bool default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- COURSES
create table courses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  title text not null,
  description text,
  offline_url text,
  is_published bool default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LESSONS
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  order_index int not null,
  title text not null,
  description text,
  content text,
  duration_mins int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CLASSES
create table classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  created_by uuid not null references auth.users(id),
  name text not null,
  join_code text unique not null,
  is_active bool default true,
  created_at timestamptz default now()
);

-- CLASS MEMBERS
create table class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('coordinator', 'student')),
  joined_at timestamptz default now(),
  unique(class_id, user_id)
);

-- COURSE ENROLMENTS
create table course_enrolments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  enrolment_type text not null check (enrolment_type in ('independent', 'class_based')),
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

-- LESSON PROGRESS
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  pct_complete int default 0 check (pct_complete between 0 and 100),
  is_completed bool default false,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

-- QUIZZES
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  title text not null,
  pass_score int default 70 check (pass_score between 0 and 100),
  max_attempts int default 3,
  due_date date,
  created_at timestamptz default now()
);

-- QUESTIONS
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  text text not null,
  type text not null check (type in ('mcq', 'true_false', 'short_answer')),
  order_index int not null
);

-- QUESTION OPTIONS
create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  text text not null,
  is_correct bool not null,
  order_index int
);

-- QUIZ ATTEMPTS
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id),
  user_id uuid not null references auth.users(id),
  score int,
  passed bool,
  attempt_number int not null,
  attempted_at timestamptz default now()
);

-- ATTEMPT ANSWERS
create table attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references questions(id),
  option_id uuid references question_options(id),
  text_answer text,
  is_correct bool
);

-- BADGES
create table badges (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  icon_url text,
  criteria text
);

-- STUDENT BADGES
create table student_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  unique(user_id, badge_id)
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table course_enrolments enable row level security;
alter table lesson_progress enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table quiz_attempts enable row level security;
alter table attempt_answers enable row level security;
alter table badges enable row level security;
alter table student_badges enable row level security;

-- Profiles: users can read own profile, admin reads all
create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "admin reads all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- Courses: published visible to all authenticated, admin sees all
create policy "published courses visible to all" on courses for select using (
  is_published = true and auth.uid() is not null
);
create policy "admin manages courses" on courses for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Lesson progress: users only see own progress
create policy "own progress only" on lesson_progress for all using (auth.uid() = user_id);

-- Coordinators see progress of students in their classes
create policy "coordinator sees class progress" on lesson_progress for select using (
  exists (
    select 1 from class_members cm
    join classes c on c.id = cm.class_id
    join course_enrolments ce on ce.user_id = lesson_progress.user_id and ce.course_id = c.course_id
    where cm.user_id = auth.uid() and cm.role = 'coordinator'
  )
);

-- Quiz attempts: users see own, coordinators see their class students
create policy "own attempts" on quiz_attempts for all using (auth.uid() = user_id);

-- question_options: never expose is_correct to select queries from client
-- Use an RPC (security definer function) for quiz scoring instead
```

---

## ENGINEERING CHECKLIST (Milestone 3)

Before demo, verify every item:

**Code Architecture**
- [ ] `/components/shared/` has atoms, molecules, organisms with barrel exports
- [ ] No hardcoded color, spacing, or font values anywhere — all from `theme.ts`
- [ ] All API calls in `/services/` — zero `supabase.from()` calls in any component or screen
- [ ] `/utils/` has dateUtils, formatters, validators, apiResponse, constants with JSDoc
- [ ] `requireAuth` and `requireRole` used on every protected screen

**Database**
- [ ] No `select('*')` — all queries name columns explicitly
- [ ] No N+1 — related data fetched via nested select or join
- [ ] `lesson_progress` always upserted with `onConflict: 'user_id,lesson_id'`
- [ ] `is_correct` never fetched client-side — quiz scoring via RPC only
- [ ] RLS enabled on all tables

**Security**
- [ ] `.env.local` in `.gitignore` — never committed
- [ ] `.env.example` committed with all keys documented
- [ ] No secrets in source code or commit history

**Version Control**
- [ ] All work on feature branches — no direct commits to main
- [ ] All commits follow `feat(scope): description` convention
- [ ] GitHub Actions CI runs lint + tests on every push
- [ ] Main branch protected: CI must pass before merge

**Demo Readiness**
- [ ] All 4 role flows work end-to-end
- [ ] Auth: register → login → protected routes → logout
- [ ] Student: join class → lesson → quiz → badge
- [ ] Independent: browse → enrol → lesson → quiz → badge
- [ ] Coordinator: create class → share code → view student progress
- [ ] Admin: create course → add lessons → add quiz
- [ ] Responsive: tested on small phone (375px equivalent)
- [ ] Form validation shows field-level errors
- [ ] API errors show user-friendly messages — no raw Supabase errors to screen
- [ ] Test coverage ≥ 60%
