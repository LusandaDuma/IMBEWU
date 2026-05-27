- [ ] Reproduce the exact UI error shown after clicking “✨ Generate with AI” (copy/paste)
- [ ] Check Supabase Edge Function logs for `console.error('Gemini API error')` and `Failed to parse Gemini response` output
- [ ] If error is “AI returned invalid data…”, make JSON extraction more robust (scan all `parts` for JSON and parse safely)
- [ ] If error is “AI generation failed…”, verify Edge Function env var `GEMINI_API_KEY` is set and redeploy
- [ ] After code change, redeploy Edge Function `generate-course`
- [ ] Test generation end-to-end; confirm generated `data.data.lessons` is present in client

