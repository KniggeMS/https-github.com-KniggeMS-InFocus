
import { GoogleGenAI, Type } from "@google/genai";
import { MediaType, SearchResult, MediaItem, ChatMessage } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

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
        if (item.plot.toLowerCase().includes('murder') || item.plot.toLowerCase().includes('kill')) {
            vibe += " Die Handlung verspricht Spannung und dunkle Themen.";
        } else if (item.plot.toLowerCase().includes('love') || item.plot.toLowerCase().includes('romance')) {
            vibe += " Es scheinen emotionale zwischenmenschliche Themen im Vordergrund zu stehen.";
        } else {
            vibe += " Die Geschichte wirkt komplex und vielschichtig.";
        }
    }

    // Notes Integration
    if (userNotes && userNotes.length > 0) {
        vibe += ` Basierend auf deinen Notizen ("${userNotes}") scheint dies genau deinen aktuellen Interessen zu entsprechen.`;
    }

    return `(Offline Modus) ${vibe}`;
};

// --- API FUNCTIONS ---

/**
 * Advanced Recommendation Engine (Hybrid Filtering)
 */
export const getRecommendations = async (items: MediaItem[]): Promise<SearchResult[]> => {
  if (items.length === 0) return [];
  if (!process.env.API_KEY) return [];

  const relevantItems = items.filter(i => i.isFavorite || (i.userRating && i.userRating >= 4) || (i.userNotes && i.userNotes.length > 5));
  const sourceItems = relevantItems.length < 3 ? items.slice(0, 10) : relevantItems.slice(0, 20);

  const profileSummary = sourceItems.map(item => {
      let info = `- "${item.title}" (${item.year}, ${item.genre.join('/')})`;
      if (item.userRating) info += ` [Rating: ${item.userRating}/5]`;
      if (item.isFavorite) info += ` [Favorite]`;
      if (item.userNotes) info += ` [User Note: "${item.userNotes}"]`;
      return info;
  }).join("\n");

  try {
    const prompt = `
      Act as a sophisticated movie recommendation engine.
      Analyze this user profile:
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
        return data.map((item: any) => ({
          ...item,
          type: item.type === "SERIES" ? MediaType.SERIES : MediaType.MOVIE,
          posterPath: null,
          backdropPath: null
        }));
    }
    return [];
  } catch (error: any) {
    console.error("Gemini Recommendation Error:", error);
    return [];
  }
};

export const generateAvatar = async (username: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    try {
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
    if (!process.env.API_KEY) return null;
    try {
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
    if (!process.env.API_KEY) return "Der Chatbot ist momentan nicht verfügbar (API Key fehlt).";
    try {
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
 * FALLBACK: If API fails (Quota/Network), generates a local static analysis.
 */
export const analyzeMovieContext = async (item: MediaItem, userNotes: string | undefined): Promise<string> => {
    // 1. Check if API Key exists
    if (!process.env.API_KEY) {
        return generateOfflineAnalysis(item, userNotes);
    }

    try {
        const prompt = `
            Analyze the movie/series "${item.title}".
            Plot: "${item.plot}"
            User's Private Notes: "${userNotes || 'None'}"
            
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
        return response.text;

    } catch (error: any) {
        console.warn("Deep Content Analysis Failed (falling back to offline mode):", error.message);
        // 2. Fallback to Local Analysis
        return generateOfflineAnalysis(item, userNotes);
    }
};
