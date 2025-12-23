# Technical Context: Hybrid AI Integration (Groq + Gemini)

## 🧠 Architecture

### Dual-Model Strategy
To optimize for speed and cost, the application uses a hybrid approach:
1.  **Groq (Llama 3 70B):**
    - **Role:** Primary engine for Text Chat, Movie Recommendations, and Deep Analysis.
    - **Why:** Extremely low latency (Time-to-First-Token), high-quality reasoning.
    - **Service:** `services/groq.ts`
2.  **Gemini (1.5 Flash):**
    - **Role:** Fallback for Text (if Groq fails/limits) AND Exclusive engine for **Vision** (Image Analysis).
    - **Why:** Multimodal capabilities (understanding posters/screenshots).
    - **Service:** `services/gemini.ts`

---

## 🔑 Configuration & Security

### API Keys
- **Storage:** Keys are stored in `localStorage` (browser) for the user session.
- **Management:** `SettingsModal.tsx` allows admins to input/update keys.
- **Environment Fallback:** `.env` variables (`VITE_GROQ_API_KEY`) act as default/fallback if no local key is set.

### Access Control
- **Settings:** Only users with `role: 'ADMIN'` can access the Settings Modal to change global API keys.
- **Validation:** Both services perform a simple connection check (list models or dummy prompt) when saving keys.

---

## 🔄 Fallback Logic (Implemented)

The `ChatBot` and `DetailView` implement a `try-catch` mechanism:
```typescript
try {
  // 1. Attempt Groq
  response = await getGroqChatCompletion(...);
} catch (e) {
  // 2. On Error (429, 500, etc.), switch to Gemini
  console.warn("Groq failed, switching to Gemini");
  response = await getGeminiChatCompletion(...);
}
```

## ⚠️ Known Limits
- **Groq Free Tier:** 30 Requests Per Minute (RPM). The fallback logic is critical for production usage if high traffic is expected.
