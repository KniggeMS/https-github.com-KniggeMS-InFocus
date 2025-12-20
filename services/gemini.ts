import { GoogleGenerativeAI } from "@google/generative-ai";
import { MediaItem, ChatMessage } from "../types";

// Nutzt den Key aus der Vercel-Umgebung oder einen Fallback
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Identifiziert einen Film oder eine Serie basierend auf einem Bild (Vision-Suche).
 * Nutzt das stabile gemini-1.5-flash Modell.
 */
export async function identifyMovieFromImage(base64Image: string): Promise<string | null> {
  if (!API_KEY) {
    console.warn("Gemini API Key fehlt.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Basis-Bereinigung des Base64-Strings
    const imageData = base64Image.split(',')[1] || base64Image;

    const prompt = "Identifiziere den Film oder die Serie auf diesem Bild (Poster oder Szene). Antworte NUR mit dem exakten Titel, nichts anderem.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Fehler bei der Bilderkennung:", error);
    return null;
  }
}

/**
 * Generiert eine Antwort für den CineChat (ChatBot).
 */
export async function getChatResponse(
  userMessage: string, 
  history: ChatMessage[], 
  watchlist: MediaItem[]
): Promise<string> {
  if (!API_KEY) return "Der AI-Assistent ist momentan nicht konfiguriert (API Key fehlt).";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Kontext für die KI: Informationen über die Watchlist des Nutzers
    const watchlistContext = watchlist.map(i => `${i.title} (${i.year})`).join(", ");
    
    const systemPrompt = `Du bist der CineLog Assistent, ein Experte für Filme und Serien. 
    Der Nutzer hat folgende Titel in seiner Sammlung: ${watchlistContext}. 
    Antworte freundlich, präzise und beziehe dich wenn möglich auf seine Sammlung.`;

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
    });

    const result = await chat.sendMessage(`${systemPrompt}\n\nNutzer fragt: ${userMessage}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Chat-Fehler:", error);
    return "Entschuldigung, ich konnte die Nachricht nicht verarbeiten.";
  }
}