import { MediaItem, ChatMessage, SearchResult, MediaType } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const getApiKey = () => {
  return localStorage.getItem('groq_api_key') || import.meta.env.VITE_GROQ_API_KEY || "";
};

async function callGroq(messages: any[], temperature = 0.7) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GROQ_API_KEY_MISSING");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 429) {
      throw new Error("GROQ_RATE_LIMIT");
    }
    throw new Error(errorData.error?.message || "Groq API Error");
  }

  return await response.json();
}

export async function getGroqChatResponse(userMessage: string, history: ChatMessage[], watchlist: MediaItem[]): Promise<string> {
  try {
    const context = watchlist.slice(0, 50).map(i => `${i.title} (${i.year})`).join(', ');
    const systemPrompt = `Du bist CineLog, ein Film-Experte. Der User hat diese Filme in seiner Liste: ${context}. Antworte kurz, freundlich und hilfreich auf Deutsch.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: "user", content: userMessage }
    ];

    const data = await callGroq(messages);
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("Groq Chat Error:", error);
    throw error;
  }
}

export async function getGroqRecommendations(items: MediaItem[]): Promise<SearchResult[]> {
  try {
    const favorites = items.filter(i => i.isFavorite || (i.userRating && i.userRating >= 8));
    const recent = items.slice(0, 10);
    
    const prompt = `
        Basierend auf diesen Filmen die der User mag:
        ${favorites.map(f => `- ${f.title} (${f.genre.join(', ')})`).join('\n')}
        
        Und diesen die er zuletzt gesehen hat:
        ${recent.map(r => `- ${r.title}`).join('\n')}
        
        Empfiehl mir exakt EINEN Film oder eine Serie, die NICHT in der Liste steht.
        Antworte NUR mit einem validen JSON Objekt. Format:
        {
            "title": "Titel",
            "originalTitle": "Original Titel",
            "year": 2024,
            "type": "MOVIE" | "SERIES",
            "plot": "Kurze Zusammenfassung auf Deutsch",
            "reason": "Warum dieser Film passt (auf Deutsch)"
        }
    `;

    const data = await callGroq([{ role: "user", content: prompt }], 0.5);
    let text = data.choices[0].message.content;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return [{
      title: parsed.title,
      originalTitle: parsed.originalTitle,
      year: parsed.year,
      type: parsed.type === 'SERIES' ? MediaType.SERIES : MediaType.MOVIE,
      plot: parsed.plot,
      genre: [],
      rating: 0,
      customNotes: parsed.reason
    }];
  } catch (error) {
    console.error("Groq Rec Error:", error);
    return [];
  }
}

export async function analyzeMovieWithGroq(movieTitle: string, plot: string, userNotes: string = ""): Promise<string> {
  try {
    let prompt = `Analysiere den Film/die Serie "${movieTitle}".\nHandlung: ${plot}\n`;
    if (userNotes) {
      prompt += `Zusätzliche Gedanken des Users: "${userNotes}"\n`;
    }
    prompt += `\nGib mir einen tiefen Einblick (max 3 Sätze). Was macht diesen Film besonders? (Stil, Themen, kulturelle Bedeutung). Antworte auf Deutsch.`;

    const data = await callGroq([{ role: "user", content: prompt }]);
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("Groq Analyze Error:", error);
    throw error;
  }
}
