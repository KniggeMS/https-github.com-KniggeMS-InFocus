
import { GoogleGenAI, Type } from "@google/genai";
import { MediaType, SearchResult, MediaItem, ChatMessage } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

/**
 * Advanced Recommendation Engine (Hybrid Filtering)
 * Uses Gemini as an ML engine to analyze user behavior, ratings, and private notes.
 */
export const getRecommendations = async (items: MediaItem[]): Promise<SearchResult[]> => {
  if (items.length === 0) return [];

  // 1. Data Preparation (Feature Extraction)
  // We prioritize: Favorites, High User Ratings (>=4), and Items with Notes.
  const relevantItems = items.filter(i => i.isFavorite || (i.userRating && i.userRating >= 4) || (i.userNotes && i.userNotes.length > 5));
  
  // If not enough data, take the last 10 added items
  const sourceItems = relevantItems.length < 3 ? items.slice(0, 10) : relevantItems.slice(0, 20);

  // 2. Construct User Profile Context for the LLM
  const profileSummary = sourceItems.map(item => {
      let info = `- "${item.title}" (${item.year}, ${item.genre.join('/')})`;
      if (item.userRating) info += ` [Rating: ${item.userRating}/5]`;
      if (item.isFavorite) info += ` [Favorite]`;
      if (item.userNotes) info += ` [User Note: "${item.userNotes}"]`;
      return info;
  }).join("\n");

  try {
    const prompt = `
      Act as a sophisticated movie recommendation engine using Hybrid Filtering (Content-Based + Collaborative logic).
      
      Analyze the following user profile based on their watch history, ratings, and specific notes:
      ${profileSummary}

      Task:
      1. Analyze the 'User Notes' to understand specific elements the user likes (e.g., "plot twists", "cinematography", "dark atmosphere").
      2. Analyze the high-rated items to identify preferred genres and themes.
      3. Recommend 3 NEW movies or series that fit this specific taste profile. Do not recommend items already in the list.
      
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
              plot: { type: Type.STRING, description: "Warum passt das zu meinem Profil? (Auf Deutsch)" },
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
          posterPath: null, // Gemini recommendations won't have TMDB paths by default
          backdropPath: null
        }));
    }
    return [];
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return [];
  }
};

/**
 * Generates a profile picture for the user based on their username.
 * Uses gemini-2.5-flash-image ("NanoBanana").
 */
export const generateAvatar = async (username: string): Promise<string | null> => {
    try {
        const prompt = `A cool, artistic, high-quality circular avatar profile picture for a movie lover named "${username}". Pop art style or cinematic lighting. Minimalist background.`;
        
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL_NAME,
            contents: {
                parts: [{ text: prompt }]
            }
        });

        // Loop through parts to find the image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini Avatar Generation Error:", error);
        return null;
    }
};

/**
 * Vision Search: Identifies a movie/series from an image (DVD cover, poster, scene).
 */
export const identifyMovieFromImage = async (base64Image: string): Promise<string | null> => {
    try {
        const prompt = "Identify the movie or TV series shown in this image. Return ONLY the exact title. If not sure, return nothing.";
        
        // Remove header if present (data:image/jpeg;base64,)
        const base64Data = base64Image.split(',')[1];

        const response = await ai.models.generateContent({
            model: MODEL_NAME, // Gemini 2.5 Flash is multimodal
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

/**
 * ChatBot: Answer questions based on the user's collection context.
 */
export const chatWithAI = async (message: string, collection: MediaItem[], history: ChatMessage[]): Promise<string> => {
    try {
        // Create a summary of the user's collection for context
        // Limit to last 50 items to save tokens
        const collectionContext = collection.slice(0, 50).map(i => 
            `${i.title} (${i.year}) - Status: ${i.status}, Rating: ${i.userRating || 'N/A'}`
        ).join('\n');

        const systemInstruction = `
            You are 'CineLog AI', a helpful movie assistant.
            You have access to the user's movie collection/watchlist provided below.
            
            User's Collection Context:
            ${collectionContext}

            Rules:
            1. If the user asks "Where can I watch X?", try to answer generally or ask them to check the app's streaming info.
            2. If they ask for recommendations, consider what they have already watched/rated.
            3. Keep answers concise, friendly, and in the language of the user (German/English).
            4. You can filter their collection (e.g., "Show me 80s horror movies I haven't watched").
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: message,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Sorry, I'm having trouble connecting to the AI right now.";
    }
};

/**
 * Deep Content Analysis: Analyzes plot vs user preferences/notes.
 */
export const analyzeMovieContext = async (item: MediaItem, userNotes: string | undefined): Promise<string> => {
    try {
        const prompt = `
            Analyze the movie/series "${item.title}".
            Plot: "${item.plot}"
            User's Private Notes on this item: "${userNotes || 'None'}"
            
            Task:
            Provide a short, 2-sentence "Deep Insight".
            1. Mention if the "Vibe" matches the plot (e.g. "Dark & Complex").
            2. Warn about structural things like Cliffhangers if it's a series, or if the user notes indicate they liked/disliked something specific about it.
            
            Output Language: German.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });

        return response.text || "Keine Analyse verfügbar.";
    } catch (error) {
        return "Analyse fehlgeschlagen.";
    }
};
