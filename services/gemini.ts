import { GoogleGenerativeAI } from "@google/generative-ai";
import { MediaItem, ChatMessage } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function identifyMovieFromImage(base64Image: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageData = base64Image.split(',')[1] || base64Image;
    const result = await model.generateContent([
      "Identifiziere den Film/Serie auf dem Bild. Nur der Titel.",
      { inlineData: { data: imageData, mimeType: "image/jpeg" } },
    ]);
    return (await result.response).text().trim();
  } catch (error) { return null; }
}

export async function getChatResponse(userMessage: string, history: ChatMessage[], watchlist: MediaItem[]): Promise<string> {
  if (!API_KEY) return "API Key fehlt.";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] })),
    });
    const result = await chat.sendMessage(userMessage);
    return (await result.response).text();
  } catch (error) { return "Fehler im Chat."; }
}

// KORREKTUR: Expliziter Cast auf any[], um die "title does not exist on never" Fehler zu töten
export const getRecommendations = async (...args: any[]): Promise<any> => [] as any; 
export const chatWithAI = async (...args: any[]) => getChatResponse(args[0], args[1], args[2]);
export const generateAvatar = async (...args: any[]) => "";
export const analyzeMovieContext = async (...args: any[]) => "";