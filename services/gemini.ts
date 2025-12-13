
import { GoogleGenAI, Type } from "@google/genai";
import { MediaType, SearchResult, MediaItem, ChatMessage } from "../types";

// CONSTANTS
const GEMINI_KEY_STORAGE_KEY = 'cinelog_gemini_key';
const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

// --- CLIENT FACTORY ---
// Helper to create client dynamically so we pick up key changes instantly
const getAiClient = () => {
    // Priority: 1. LocalStorage (User Input), 2. Env Var (Deployment)
    const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE_KEY) || process.env.API_KEY || '';
    
    // If no key is found, this might throw or fail later, but we allow empty string for now
    // to let the UI handle the error state gracefully.
    return new GoogleGenAI({ apiKey });
};

// --- CACHING UTILS ---

const CACHE_PREFIX = 'cinelog_ai_cache_';
const REC_CACHE_KEY = 'cinelog_ai_recs';
const REC_CACHE_TTL = 60 * 60 * 1000; // 1 Hour

interface AnalysisCacheEntry {
    timestamp: number;
    userNotesHash: string; // Simple string comparison
    text: string;
}

interface RecsCacheEntry {
    timestamp: number;
    data: SearchResult[];
}

// --- FALLBACK LOGIC ---

/**
 * Generates a deterministic "analysis" based on metadata when the AI is offline or quota is reached.
 */
const generateOfflineAnalysis = (item: MediaItem, userNotes?: string): string => {
    const genres = item.genre.slice(0, 3).join(', ');
    
    // Rating Context
    let ratingContext = "Ein Werk mit gemischten Bewertungen";
    if (item.rating >= 8) ratingContext = "Ein von Kritikern gefeierter Titel";
    else if (item.rating >= 6) ratingContext = "Ein solider Genre-Vertreter";
    else if (item.rating > 0) ratingContext = "Ein Titel mit polarisierenden Bewertungen";

    // Vibe Construction
    let vibe = `Das ist ${ratingContext.toLowerCase()} aus dem Bereich ${genres}.`;
    
    // Plot Analysis (Heuristic)
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

    // Notes Integration
    if (userNotes && userNotes.length > 0) {
        vibe += ` Deine Rezension ("${userNotes}") fließt in zukünftige Empfehlungen ein.`;
    }

    return `(Offline Modus) ${vibe}`;
};

// --- API FUNCTIONS ---

/**
 * Advanced Recommendation Engine (Hybrid Filtering) with Caching
 */
export const getRecommendations = async (items: MediaItem[], forceRefresh = false): Promise<SearchResult[]> => {
  if (items.length === 0) return [];

  // 1. Try Load from Cache
  try {
      const cachedRaw = localStorage.getItem(REC_CACHE_KEY);
      if (cachedRaw) {
          const cached: RecsCacheEntry = JSON.parse(cachedRaw);
          const age = Date.now() - cached.timestamp;
          
          // Return cached if fresh enough OR if we want to save quota (unless forced)
          if (!forceRefresh && age < REC_CACHE_TTL) {
              console.log("Serving Recommendations from Cache");
              return cached.data;
          }
      }
  } catch (e) {
      console.warn("Cache read error", e);
  }

  // 2. Check API Key validity (Simple check)
  const ai = getAiClient();

  const relevantItems = items.filter(i => i.isFavorite || (i.userRating && i.userRating >= 4) || (i.userNotes && i.userNotes.length > 5));
  const sourceItems = relevantItems.length < 3 ? items.slice(0, 10) : relevantItems.slice(0, 20);

  const profileSummary = sourceItems.map(item => {
      let info = `- "${item.title}" (${item.year}, ${item.genre.join('/')})`;
      if (item.userRating) info += ` [Rating: ${item.userRating}/5]`;
      if (item.isFavorite) info += ` [Favorite]`;
      if (item.userNotes) info += ` [User Review: "${item.userNotes}"]`;
      return info;
  }).join("\n");

  try {
    const prompt = `
      Act as a sophisticated movie recommendation engine.
      Analyze this user profile (Favorites & Reviews):
      ${profileSummary}

      Task: Recommend 3 NEW movies/series fitting this profile.
      Return JSON format.
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
        const data = JSON.parse(response.text);
        const mappedData = data.map((item: any) => ({
          ...item,
          type: item.type === "SERIES" ? MediaType.SERIES : MediaType.MOVIE,
          posterPath: null,
          backdropPath: null
        }));

        // SAVE TO CACHE
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
    
    // Fallback: Return old cache if API fails (even if expired)
    try {
        const cachedRaw = localStorage.getItem(REC_CACHE_KEY);
        if (cachedRaw) {
            console.log("API failed, serving stale cache.");
            return JSON.parse(cachedRaw).data;
        }
    } catch (e) {}
    
    return [];
  }
};

export const generateAvatar = async (username: string): Promise<string | null> => {
    try {
        const ai = getAiClient();
        const prompt = `A cool, artistic, high-quality circular avatar profile picture for a movie lover named "${username}". Pop art style or cinematic lighting. Minimalist background.`;
        
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL_NAME,
            contents: { parts: [{ text: prompt }] }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return null;
    } catch (error) {
        console.error("Gemini Avatar Error:", error);
        return null;
    }
};

export const identifyMovieFromImage = async (base64Image: string): Promise<string | null> => {
    try {
        const ai = getAiClient();
        const prompt = "Identify the movie or TV series. Return ONLY the title.";
        const base64Data = base64Image.split(',')[1];

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
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
            You are 'CineLog AI'. Access to user's collection:
            ${collectionContext}
            Keep answers concise, friendly, and in German/English.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: message,
            config: { systemInstruction }
        });

        return response.text || "Sorry, keine Antwort möglich.";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Verbindungsprobleme mit der AI.";
    }
};

/**
 * Deep Content Analysis: Analyzes plot vs user preferences/notes.
 * SMART CACHING + OFFLINE FALLBACK
 */
export const analyzeMovieContext = async (item: MediaItem, userNotes: string | undefined): Promise<string> => {
    const cacheKey = `${CACHE_PREFIX}${item.id}`;
    const currentNotesHash = userNotes || '';

    // 1. Try Load from Cache
    try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
            const cached: AnalysisCacheEntry = JSON.parse(cachedRaw);
            // If notes haven't changed, the analysis is still 100% valid.
            if (cached.userNotesHash === currentNotesHash) {
                console.log(`Serving Analysis for ${item.title} from Cache`);
                return cached.text;
            }
        }
    } catch (e) {
        console.warn("Cache read error", e);
    }

    // 2. Call API
    try {
        const ai = getAiClient();
        const prompt = `
            Analyze the movie/series "${item.title}".
            Plot: "${item.plot}"
            User's Public Review: "${userNotes || 'None'}"
            
            Task:
            Provide a short, 2-sentence "Deep Insight".
            1. Mention if the "Vibe" matches the plot (e.g. "Dark & Complex").
            2. Warn about structural things like Cliffhangers if it's a series.
            
            Output Language: German.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });

        if (!response.text) throw new Error("Empty response");
        
        // 3. Save to Cache
        const newEntry: AnalysisCacheEntry = {
            timestamp: Date.now(),
            userNotesHash: currentNotesHash,
            text: response.text
        };
        localStorage.setItem(cacheKey, JSON.stringify(newEntry));

        return response.text;

    } catch (error: any) {
        console.warn("Deep Content Analysis Failed (falling back):", error.message);
        
        // 4. Fallback Strategy:
        // If we have a stale cache (notes changed but item is same), return that instead of offline text
        try {
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                const cached = JSON.parse(cachedRaw);
                return `${cached.text} (Aus Cache - Notizen evtl. veraltet)`;
            }
        } catch(e) {}

        // 5. Last Resort: Offline Algo
        return generateOfflineAnalysis(item, userNotes);
    }
};
