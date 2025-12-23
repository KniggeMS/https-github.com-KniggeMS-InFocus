# Workflow Guidelines

## 🛡️ "Conductor" First
All major changes must be tracked via the Conductor protocol to prevent context loss (hallucinations).
1.  **Check:** Read `conductor/tracks.md` and active `plan.md` before starting.
2.  **Update:** Keep `plan.md` status current.
3.  **Document:** Write technical decisions to `context.md` or this file.

## 🧪 Testing Strategy
**"Test It Or It Didn't Happen"**
- **UI Changes:** Must be verified with Playwright (`npm run test:e2e`).
- **New Features:** Create a spec file in `e2e/` (e.g., `e2e/new-feature.spec.ts`).
- **Auth Mocking:** Use the `TEST_MODE_USER` backdoor in `AuthContext` for local tests. Do NOT try to mock Supabase network requests manually unless absolutely necessary.

## 🚀 Deployment
- **Platform:** Vercel
- **Environment:**
    - Sync `.env` variables to Vercel Project Settings.
    - Ensure `VITE_GROQ_API_KEY` and Supabase keys are present in production.

## 📱 Mobile Polish
- **Rule:** Always verify layouts on Mobile Viewport (375px width).
- **Navigation:** Ensure BottomSheet and MobileNav interaction works.
- **Touch Targets:** Minimum 44x44px for clickable elements.
