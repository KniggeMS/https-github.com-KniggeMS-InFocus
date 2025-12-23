# Tech Stack Preferences

## 💻 Frontend
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Custom config with CSS variables for theming)
- **Icons:** Lucide React
- **PWA:** Vite PWA Plugin (Offline support, Installability)

## ☁️ Backend / Services
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Realtime)
- **External APIs:**
    - **TMDB:** Primary metadata source (Movies/Series).
    - **OMDB:** Secondary source (Rotten Tomatoes ratings).
- **AI Services (Hybrid):**
    - **Groq (Llama 3 70B):** Text Chat, Recommendations, Deep Analysis (High Speed).
    - **Gemini (1.5 Flash):** Vision/Image Analysis (Multimodal Fallback).

## 🧪 Testing & Quality
- **E2E Testing:** Playwright
    - **Config:** Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12), Desktop.
    - **Strategy:** "Test Mode" backdoor in `AuthContext` to bypass Supabase email confirmation for UI tests.
- **Linting:** ESLint

## 📦 Key Libraries
- `react-router-dom`: Routing
- `framer-motion`: Complex animations
- `zustand` (or Context API): State Management
- `@supabase/supabase-js`: Backend Client
- `canvas-confetti`: Gamification effects

## ⚠️ Constraints
- **No Python/Node Backend:** The app is a serverless SPA connecting directly to Supabase/APIs.
- **API Limits:** Respect Groq Free Tier (30 RPM). Fallback logic is mandatory.
