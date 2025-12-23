import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Minimize2 } from 'lucide-react';
// Hybride KI-Logik: Groq als Primärquelle, Gemini als Fallback
import { chatWithAI as geminiChat } from '../services/gemini';
import { getGroqChatResponse } from '../services/groq';
import { MediaItem, ChatMessage } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface ChatBotProps {
  items: MediaItem[];
}

export const ChatBot: React.FC<ChatBotProps> = ({ items }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: t('chat_welcome'),
      timestamp: Date.now()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      let response = '';
      
      try {
        // Versuch 1: Groq (Ultraschnell)
        response = await getGroqChatResponse(currentInput, messages, items);
      } catch (groqError: any) {
        console.warn("Groq failed, switching to Gemini:", groqError.message);
        // Versuch 2: Gemini (Zuverlässiger Fallback)
        response = await geminiChat(currentInput, messages, items);
      }
      
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: response,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: t('chat_error'),
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-24 md:bottom-8 right-4 z-50 flex flex-col items-end pointer-events-none ${isOpen ? 'z-[60]' : ''}`}>
      {isOpen && (
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700 w-[90vw] md:w-96 h-[60vh] md:h-[500px] rounded-2xl shadow-2xl mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Sparkles size={18} />
              <span>{t('chat_title')}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <Minimize2 size={18} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">{t('chat_typing')}</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat_placeholder')}
                className="w-full bg-slate-900/80 text-white pl-4 pr-12 py-3 rounded-xl border border-slate-600 focus:border-cyan-500 focus:outline-none text-sm placeholder:text-slate-500"
              />
              <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="pointer-events-auto w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 border-slate-800">
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};