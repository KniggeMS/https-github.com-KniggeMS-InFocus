# Plan: Groq Integration (Hybride AI)

**Ziel:** Nutzung von Groq Cloud (Llama 3 70B) für blitzschnelle Textantworten, während Gemini 1.5 Flash für Bildanalysen (Vision) als Fallback und Spezialist bleibt.

## 📝 Status
- **Startdatum:** 22.12.2025
- **Priorität:** Hoch

## ✅ Completed
- [x] **Recherche:** Limits und Quotas von Groq Free Tier analysiert (30 RPM Limit).
- [x] **Service Setup:** `services/groq.ts` mit Chat, Empfehlung und Analyse-Funktionen erstellt.
- [x] **Security:** API-Key in lokaler `.env` gespeichert und via `.gitignore` geschützt.
- [x] **Settings UI:** `SettingsModal.tsx` um Groq-Key Feld erweitert.
- [x] **Access Control:** "Einstellungen" im Profilmenü nur noch für ADMINs sichtbar gemacht.

## 🚧 In Progress / Next Steps
- [x] **Integration ChatBot:** `ChatBot.tsx` auf `services/groq.ts` umstellen (mit Fallback auf Gemini).
- [x] **Integration Analyse:** `DetailView.tsx` (Deep Analysis) auf Groq umstellen.
- [x] **Integration Empfehlungen:** `AiRecommendationButton.tsx` auf Groq umstellen.
- [x] **Fallback Logic Test:** Sicherstellen, dass bei Rate-Limit (429) automatisch Gemini übernimmt. (Verifiziert in ChatBot.tsx, DetailView.tsx, AiRecommendationButton.tsx)

## 🧪 Testing
- [x] Manuelles Testen des Chats (Geschwindigkeit).
- [x] Testen der Bilderkennung (Muss weiterhin Gemini nutzen).
- [x] Testen des Admin-Zugriffs auf Settings.
