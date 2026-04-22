# Integrations and Git Push Behavior

This file explains what happens to Supabase and Gemini connections when this project is pushed to Git.

## What is already connected in this repo

- **Supabase**
  - Uses `EXPO_PUBLIC_SUPABASE_URL`
  - Uses `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key)
  - Read in `app/services/supabase.ts`
- **Gemini (Nolwazi assistant)**
  - Uses `EXPO_PUBLIC_GEMINI_API_KEY`
  - Read in `app/services/gemini.ts`

## What happens when you push to Git

- Your real secrets in `.env` are **not pushed** (because `.env` is in `.gitignore`).
- Code changes are pushed, including service integration logic and chatbot UI.
- Other developers will clone the repo but **must add their own `.env`** before integrations work.

## Required local environment variables

Create a local `.env` at project root with:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
```

Use `.env.example` as the template.

## Team setup steps (after clone)

1. Copy `.env.example` to `.env`
2. Fill in valid project keys
3. Install dependencies:
   - `npm install`
4. Start app with fresh cache:
   - `npx expo start -c`

## Security notes

- Do **not** commit `.env`.
- Regenerate keys if they were shared in public channels.
- `EXPO_PUBLIC_*` values are bundled client-side, so treat them as public-facing app keys (apply rate limits and project restrictions).
- For production-hard security, proxy sensitive AI requests through a backend instead of direct client calls.

## Troubleshooting

- **Supabase auth/data not working**
  - Check `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - Restart Expo after changing env vars
- **Nolwazi not replying**
  - Check `EXPO_PUBLIC_GEMINI_API_KEY`
  - Confirm model availability/quota in Google AI console
  - Restart Expo with `-c`

## Current status summary

- Supabase URL/key pair has been validated via API settings endpoint.
- Gemini chat route and service are integrated in-app.
- Nolwazi persona/system instruction is configured and documented.
