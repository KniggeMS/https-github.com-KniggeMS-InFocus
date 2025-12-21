import { GoogleGenerativeAI } from "@google/generative-ai";
import { MediaItem, ChatMessage, MediaType, SearchResult } from "../types";

// Helper to get the best available API key
const getApiKey = () => {
  const key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("Gemini API Key is not set in localStorage ('gemini_api_key') or .env (VITE_GEMINI_API_KEY)");
  }
  return key || "";
};

const getGenAI = (apiKey?: string) => new GoogleGenerativeAI(apiKey || getApiKey());

export async function identifyMovieFromImage(base64Image: string): Promise<string | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const model = getGenAI(key).getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageData = base64Image.split(',')[1] || base64Image;
    const result = await model.generateContent([
      "Identifiziere den Film/Serie auf dem Bild. Antworte NUR mit dem Titel.",
      { inlineData: { data: imageData, mimeType: "image/jpeg" } },
    ]);
    return (await result.response).text().trim();
  } catch (error) { 
    console.error("Vision Error:", error);
    return null; 
  }
}

export async function getChatResponse(userMessage: string, history: ChatMessage[], watchlist: MediaItem[]): Promise<string> {
  const key = getApiKey();
  if (!key) return "API Key fehlt. Bitte in den Einstellungen hinterlegen.";
  try {
    const model = getGenAI(key).getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Kontext über die Sammlung bauen
    const context = watchlist.slice(0, 50).map(i => `${i.title} (${i.year}) - Rating: ${i.userRating || '-'}`).join(', ');
    const systemPrompt = `Du bist CineLog, ein Film-Experte. Der User hat diese Filme in seiner Liste: ${context}. Antworte kurz, freundlich und hilfreich.`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Verstanden! Ich bin bereit, über deine Filmsammlung zu sprechen." }] },
        ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model' as const, parts: [{ text: msg.text }] }))
      ],
    });
    
    
    const result = await chat.sendMessage(userMessage);
    return (await result.response).text();
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    if (error.message && error.message.includes("quota")) {
        return "Die AI-Funktionen sind wegen Quotaregelung zurzeit nicht verfügbar. Bitte versuchen Sie es später noch einmal.";
    }
    return "Entschuldigung, ich habe gerade Verbindungsprobleme.";
  }
}

export const getRecommendations = async (items: MediaItem[]): Promise<SearchResult[]> => {
    const key = getApiKey();
    if (!key) return [];

    try {
        const model = getGenAI(key).getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const favorites = items.filter(i => i.isFavorite || (i.userRating && i.userRating >= 8));
        const recent = items.slice(0, 10);
        
        const prompt = `
            Basierend auf diesen Filmen die der User mag:
            ${favorites.map(f => `- ${f.title} (${f.genre.join(', ')})`).join('\n')}
            
            Und diesen die er zuletzt gesehen hat:
            ${recent.map(r => `- ${r.title}`).join('\n')}
            
            Empfiehl mir exakt EINEN Film oder eine Serie, die NICHT in der Liste steht.
            Antworte NUR mit einem validen JSON Objekt (ohne Markdown Code Blocks). Format:
            {
                "title": "Titel",
                "originalTitle": "Original Titel",
                "year": 2024,
                "type": "MOVIE" | "SERIES",
                "plot": "Kurze Zusammenfassung auf Deutsch",
                "reason": "Warum dieser Film passt (auf Deutsch)"
            }
        `;

        const result = await model.generateContent(prompt);
        let text = (await result.response).text();
        // Bereinigung von Markdown Code Blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const data = JSON.parse(text);
            return [{
                title: data.title,
                originalTitle: data.originalTitle,
                year: data.year,
                type: data.type === 'SERIES' ? MediaType.SERIES : MediaType.MOVIE,
                plot: data.plot,
                genre: [], // Wird via TMDB aufgefüllt
                rating: 0,
                customNotes: data.reason // Wir nutzen customNotes für die Begründung
            }];
        } catch (e) {
            console.error("JSON Parse Error:", text);
            return [];
        }
    } catch (error: any) {
        console.error("Gemini Rec Error:", error);
        if (error.message && error.message.includes("quota")) {
            console.error("AI-Empfehlungen sind wegen Quotaregelung nicht verfügbar.");
        }
        return [];
    }
};

export const generateAvatar = async (username: string): Promise<string> => {
    // DiceBear ist zuverlässig und braucht keinen API Key
    // Wir nutzen den Username als Seed für konsistente Ergebnisse
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

export const analyzeMovieContext = async (movieTitle: string, plot: string, userNotes: string = ""): Promise<string> => {
    const key = getApiKey();
    if (!key) return "API Key fehlt. Bitte in den Einstellungen hinterlegen.";

    try {
        const model = getGenAI(key).getGenerativeModel({ model: "gemini-1.5-flash" });
        
        let prompt = `Analysiere den Film/die Serie "${movieTitle}".\nHandlung: ${plot}\n`;
        if (userNotes) {
            prompt += `Zusätzliche Gedanken des Users: "${userNotes}"\n`;
        }
        prompt += `\nGib mir einen tiefen Einblick (max 3 Sätze). Was macht diesen Film besonders? (Stil, Themen, kulturelle Bedeutung). Antworte auf Deutsch.`;

        const result = await model.generateContent(prompt);
        return (await result.response).text();
    } catch (error: any) {
        console.error("Gemini Analyze Error:", error);
        if (error.message && error.message.includes("quota")) {
            return "Die AI-Funktionen sind wegen Quotaregelung zurzeit nicht verfügbar. Bitte versuchen Sie es später noch einmal.";
        }
        return "Entschuldigung, die AI-Analyse ist gerade nicht verfügbar.";
    }
};

// Alias für ChatBot
export const chatWithAI = getChatResponse;