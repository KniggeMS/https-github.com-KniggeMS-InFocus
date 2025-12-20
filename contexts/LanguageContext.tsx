import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'de' | 'en';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  de: {
    overview: "Übersicht",
    watchlist: "Watchlist",
    favorites: "Favoriten",
    my_lists: "Meine Listen",
    add_button: "Hinzufügen",
    empty_state: "Deine Sammlung ist noch leer.",
    share: "Teilen",
    create_list: "Liste erstellen",
    list_name: "Name der Liste",
    create: "Erstellen",
    cancel: "Abbrechen",
    share_with_friends: "Mit Freunden teilen",
    collection: "Deine Sammlung",
    besetzung: "Besetzung",
    überblick: "Überblick",
    ai_tip: "AI Tipp",
    NEW_REC: "NEUE EMPFEHLUNG"
  },
  en: {
    overview: "Overview",
    watchlist: "Watchlist",
    favorites: "Favorites",
    my_lists: "My Lists",
    add_button: "Add Movie",
    empty_state: "Your collection is empty.",
    share: "Share",
    create_list: "Create List",
    list_name: "List Name",
    create: "Create",
    cancel: "Cancel",
    share_with_friends: "Share with friends",
    collection: "Your Collection",
    besetzung: "Cast",
    überblick: "Overview",
    ai_tip: "AI Tip",
    NEW_REC: "NEW REC"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'de';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within a LanguageProvider');
  return context;
};
