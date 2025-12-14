import { GoogleGenAI, Type } from "@google/genai";
import { MediaType, SearchResult, MediaItem, ChatMessage } from "../types";

// CONSTANTS
const GEMINI_KEY_STORAGE_KEY = 'cinelog_gemini_key';
const MODEL_NAME = "gemini-2.5-flash";
// Note: We keep the image model ref for Vision Search, but remove it for Avatars to save quota.
// const IMAGE_MODEL_NAME = "gemini-2.5-flash-image"; 

// --- HELPERS ---

const cleanJsonString = (text: string): string => {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return cleaned;
};

const sanitizeKey = (key: string | null | undefined): string => {
    if (!key) return '';
    let cleaned = key.trim();
    
    // Remove potential "API_KEY=" prefix from .env copy-pastes
    if (cleaned.startsWith('API_KEY=')) {
        cleaned = cleaned.replace('API_KEY=', '');
    }
    
    // Remove quotes if user copied JSON string
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    
    return cleaned.trim();
};

// --- CLIENT FACTORY ---
const getAiClient = () => {
    // Priority: 1. LocalStorage (User Input), 2. Env Var (Deployment)
    const rawKey = localStorage.getItem(GEMINI_KEY_STORAGE_KEY) || process.env.API_KEY || '';
    const apiKey = sanitizeKey(rawKey);
    
    if (!apiKey) {
        console.warn("Gemini Client initialized without API Key.");
    }
    return new GoogleGenAI({ apiKey });
};

// --- CACHING UTILS ---

const CACHE_PREFIX = 'cinelog_ai_cache_';
const REC_CACHE_KEY = 'cinelog_ai_recs';
const REC_CACHE_TTL = 60 * 60 * 1000; // 1 Hour

interface AnalysisCacheEntry {
    timestamp: number;
    userNotesHash: string; 
    text: string;
}

interface RecsCacheEntry {
    timestamp: number;
    data: SearchResult[];
}

// --- FALLBACK LOGIC ---

const generateOfflineAnalysis = (item: MediaItem, userNotes?: string): string => {
    const genres = item.genre.slice(0, 3).join(', ');
    
    let ratingContext = "Ein Werk mit gemischten Bewertungen";
    if (item.rating >= 8) ratingContext = "Ein von Kritikern gefeierter Titel";
    else if (item.rating >= 6) ratingContext = "Ein solider Genre-Vertreter";
    else if (item.rating > 0) ratingContext = "Ein Titel mit polarisierenden Bewertungen";

    let vibe = `Das ist ${ratingContext.toLowerCase()} aus dem Bereich ${genres}.`;
    
    if (item.plot) {
        const p = item.plot.toLowerCase();
        if (p.includes('mord') || p.includes('kill') || p.includes('tot')) {
            vibe += " Die Handlung verspricht Spannung und dunkle Themen.";
        } else if (p.includes('liebe') || p.includes('romantik') || p.includes('herz')) {
            vibe += " Es scheinen emotionale zwischenmenschliche Themen im Vordergrund zu stehen.";
        } else if (p.includes('weltraum') || p.includes('zukunft')) {
            vibe += " Ein futuristisches Setting erwartet dich.";
        } else {
            vibe += " Die Geschichte wirkt komplex und vielschichtig.";
        }
    }

    if (userNotes && userNotes.length > 0) {
        vibe += ` Deine Rezension ("${userNotes}") fließt in zukünftige Empfehlungen ein.`;
    }

    return `(Offline Modus) ${vibe}`;
};

// --- API FUNCTIONS ---

/**
 * Validates the API key by making a minimal request.
 */
export const testGeminiConnection = async (apiKey: string): Promise<{success: boolean, message: string}> => {
    const cleanKey = sanitizeKey(apiKey);
    if (!cleanKey) return { success: false, message: "Key ist leer." };
    
    try {
        const ai = new GoogleGenAI({ apiKey: cleanKey });
        // Minimal request to test auth
        await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Hi",
        });
        return { success: true, message: "Verbindung erfolgreich!" };
    } catch (error: any) {
        console.error("Test Connection Failed:", error);
        let msg = "Unbekannter Fehler";
        if (error.message) {
            if (error.message.includes("API key") || error.message.includes("400")) msg = "Ungültiger Key (Prüfe Copy-Paste).";
            else if (error.message.includes("403")) msg = "Zugriff verweigert (Code 403). Prüfe Billing.";
            else if (error.message.includes("429")) msg = "Quota Limit erreicht (Code 429).";
            else msg = error.message;
        }
        return { success: false, message: msg };
    }
};

export const getRecommendations = async (items: MediaItem[], forceRefresh = false): Promise<SearchResult[]> => {
  if (items.length === 0) return [];

  // 1. Cache Check
  try {
      const cachedRaw = localStorage.getItem(REC_CACHE_KEY);
      if (cachedRaw) {
          const cached: RecsCacheEntry = JSON.parse(cachedRaw);
          const age = Date.now() - cached.timestamp;
          if (!forceRefresh && age < REC_CACHE_TTL) {
              console.log("Serving Recommendations from Cache");
              return cached.data;
          }
      }
  } catch (e) {
      console.warn("Cache read error", e);
  }

  const ai = getAiClient();

  // Filter relevant items for context
  const relevantItems = items.filter(i => i.isFavorite || (i.userRating && i.userRating >= 4) || (i.userNotes && i.userNotes.length > 5));
  const sourceItems = relevantItems.length < 3 ? items.slice(0, 10) : relevantItems.slice(0, 20);

  const profileSummary = sourceItems.map(item => {
      let info = `- "${item.title}" (${item.year}, ${item.genre.join('/')})`;
      if (item.userRating) info += ` [Rating: ${item.userRating}/5]`;
      if (item.isFavorite) info += ` [Favorite]`;
      return info;
  }).join("\n");

  try {
    const prompt = `
      Act as a sophisticated movie recommendation engine.
      Analyze this user profile (Favorites & Reviews):
      ${profileSummary}

      Task: Recommend 3 NEW movies/series fitting this profile.
      IMPORTANT: Return ONLY valid JSON array. No markdown.
    `;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              year: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["MOVIE", "SERIES"] },
              genre: { type: Type.ARRAY, items: { type: Type.STRING } },
              plot: { type: Type.STRING, description: "Warum passt das? (DE)" },
              rating: { type: Type.NUMBER },
            },
            required: ["title", "year", "type", "genre", "plot", "rating"],
          },
        },
      },
    });

    if (response.text) {
        const cleanedJson = cleanJsonString(response.text);
        const data = JSON.parse(cleanedJson);
        
        const mappedData = data.map((item: any) => ({
          ...item,
          type: item.type === "SERIES" ? MediaType.SERIES : MediaType.MOVIE,
          posterPath: null,
          backdropPath: null
        }));

        // Cache Success
        const cacheEntry: RecsCacheEntry = {
            timestamp: Date.now(),
            data: mappedData
        };
        localStorage.setItem(REC_CACHE_KEY, JSON.stringify(cacheEntry));

        return mappedData;
    }
    return [];
  } catch (error: any) {
    console.error("Gemini Recommendation Error:", error);
    // Return stale cache if available on error
    try {
        const cachedRaw = localStorage.getItem(REC_CACHE_KEY);
        if (cachedRaw) return JSON.parse(cachedRaw).data;
    } catch (e) {}
    
    return [];
  }
};

/**
 * Uses DiceBear API (Adventurer Style).
 * Deterministic generation based on username.
 * No API Key required.
 */
export const generateAvatar = async (username: string): Promise<string | null> => {
    // Style: 'adventurer' (Colorful, Illustrated Characters)
    const style = 'adventurer';
    
    // We add a random background color via the API to make it pop
    const url = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
    
    // Simulate async to match previous interface
    return new Promise((resolve) => {
        setTimeout(() => resolve(url), 300);
    });
};

export const identifyMovieFromImage = async (base64Image: string): Promise<string | null> => {
    try {
        const ai = getAiClient();
        const prompt = "Identify the movie or TV series. Return ONLY the title.";
        const base64Data = base64Image.split(',')[1];

        const response = await ai.models.generateContent({
            model: MODEL_NAME, // Flash is cheaper/faster for this than Pro
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        return response.text?.trim() || null;
    } catch (error) {
        console.error("Vision Search Error:", error);
        return null;
    }
};

export const chatWithAI = async (message: string, collection: MediaItem[], history: ChatMessage[]): Promise<string> => {
    try {
        const ai = getAiClient();
        const collectionContext = collection.slice(0, 50).map(i => 
            `${i.title} (${i.year}) - Status: ${i.status}, Rating: ${i.userRating || 'N/A'}`
        ).join('\n');

        const systemInstruction = `
            You are 'CineLog AI', a helpful movie assistant.
            User's collection summary (first 50 items):
            ${collectionContext}
            
            Answer concisely in German (or match user language).
            If asked for recommendations, suggest real movies not in their collection.
        `;

        // Map internal history format to Gemini Chat history format
        const chatHistory = history
            .filter(msg => msg.id !== 'welcome') // Skip local welcome message
            .map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));

        const chat = ai.chats.create({
            model: MODEL_NAME,
            history: chatHistory,
            config: { systemInstruction }
        });

        const response = await chat.sendMessage({ message: message });
        return response.text || "Ich bin sprachlos.";

    } catch (error: any) {
        console.error("Chat Error Details:", error);
        
        const errMsg = error.message || error.toString();
        
        if (errMsg.includes("API key")) return "Fehler: API Key ungültig oder fehlt. Bitte in Einstellungen prüfen.";
        if (errMsg.includes("429")) return "Fehler: Zu viele Anfragen (Quota Limit). Bitte warten.";
        if (errMsg.includes("403")) return "Fehler: Zugriff verweigert (Region/Billing).";
        if (errMsg.includes("503")) return "Fehler: AI Dienst kurzzeitig nicht verfügbar.";
        
        return `Verbindungsproblem: ${errMsg.substring(0, 50)}...`;
    }
};

export const analyzeMovieContext = async (item: MediaItem, userNotes: string | undefined): Promise<string> => {
    const cacheKey = `${CACHE_PREFIX}${item.id}`;
    const currentNotesHash = userNotes || '';

    // Cache
    try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
            const cached: AnalysisCacheEntry = JSON.parse(cachedRaw);
            if (cached.userNotesHash === currentNotesHash) {
                return cached.text;
            }
        }
    } catch (e) {}

    // API
    try {
        const ai = getAiClient();
        const prompt = `
            Analyze the movie/series "${item.title}".
            Plot: "${item.plot}"
            User's Public Review: "${userNotes || 'None'}"
            
            Task: Provide a short, 2-sentence "Deep Insight" in German.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });

        if (!response.text) throw new Error("Empty response");
        
        const newEntry: AnalysisCacheEntry = {
            timestamp: Date.now(),
            userNotesHash: currentNotesHash,
            text: response.text
        };
        localStorage.setItem(cacheKey, JSON.stringify(newEntry));

        return response.text;

    } catch (error: any) {
        console.warn("Analysis Failed:", error.message);
        
        // Fallback: Stale Cache or Offline
        try {
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) return JSON.parse(cachedRaw).text + " (Offline Cache)";
        } catch(e) {}

        return generateOfflineAnalysis(item, userNotes);
    }
};