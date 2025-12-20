import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '../types';

type Translations = Record<string, Record<string, string>>;

const dictionary: Translations = {
  de: {
    "welcome_back": "Willkommen zurück",
    "create_account": "Konto erstellen",
    "login_subtitle": "Melde dich an, um deine Watchlist zu verwalten.",
    "register_subtitle": "Starte deine filmische Reise noch heute.",
    "username": "Benutzername",
    "email": "E-Mail Adresse",
    "password": "Passwort",
    "forgot_password": "Passwort vergessen?",
    "login_button": "Anmelden",
    "register_button": "Registrieren",
    "switch_to_register": "Noch kein Konto? Hier registrieren",
    "switch_to_login": "Bereits ein Konto? Hier anmelden",
    "reset_password": "Passwort zurücksetzen",
    "reset_subtitle": "Gib deine E-Mail an.",
    "send_reset_link": "Link anfordern",
    "back_to_login": "Zurück zum Login",
    "to_watch": "Geplant",
    "watching": "Dabei",
    "watched": "Gesehen",
    "overview": "Übersicht",
    "watchlist": "Watchlist",
    "favorites": "Favoriten",
    "add_button": "Hinzufügen",
    "settings": "Einstellungen",
    "logout": "Abmelden",
    "collection": "Deine Sammlung",
    "collection_sub": "Verwalte deine Filme und Serien an einem Ort.",
    "empty_state": "Noch nichts hier.",
    "create_list": "Liste erstellen",
    "my_lists": "Meine Listen",
    "profile": "Profil",
    "handbuch": "Handbuch",
    "user_management": "Benutzerverwaltung",
    "besetzung": "Besetzung",
    "überblick": "Überblick",
    "stream": "Stream",
    "registration_success": "Erfolgreich! Bitte melde dich an.",
    "profile_updated": "Profil gespeichert",
    "password_updated": "Passwort geändert",
    "member_since": "Mitglied seit",
    "role_admin": "Admin",
    "role_manager": "Manager",
    "role_user": "Benutzer",
    "chat_welcome": "Hallo! Ich bin dein CineLog Assistent.",
    "chat_title": "CineChat AI",
    "chat_placeholder": "Frag mich etwas...",
    "analyzing": "Analysiere...",
    "ai_tip": "AI Tipp",
    "new_rec": "Neu",
    "firstname": "Vorname",
    "lastname": "Nachname",
    "confirm_password": "Passwort bestätigen"
  },
  en: {
    "welcome_back": "Welcome Back",
    "create_account": "Create Account",
    "login_subtitle": "Sign in to manage your watchlist.",
    "register_subtitle": "Start your journey today.",
    "username": "Username",
    "email": "Email",
    "password": "Password",
    "forgot_password": "Forgot password?",
    "login_button": "Sign In",
    "register_button": "Register",
    "switch_to_register": "New here? Register",
    "switch_to_login": "Have an account? Login",
    "reset_password": "Reset Password",
    "reset_subtitle": "Enter your email.",
    "send_reset_link": "Send Link",
    "back_to_login": "Back to Login",
    "to_watch": "Planned",
    "watching": "Watching",
    "watched": "Watched",
    "overview": "Overview",
    "watchlist": "Watchlist",
    "favorites": "Favorites",
    "add_button": "Add New",
    "settings": "Settings",
    "logout": "Logout",
    "collection": "Collection",
    "collection_sub": "Manage your library.",
    "empty_state": "Nothing here yet.",
    "create_list": "Create List",
    "my_lists": "My Lists",
    "profile": "Profile",
    "handbuch": "Manual",
    "user_management": "User Management",
    "besetzung": "Cast",
    "überblick": "Overview",
    "stream": "Stream",
    "registration_success": "Success! Please log in.",
    "chat_welcome": "Hello! I am your CineLog assistant.",
    "chat_title": "CineChat AI",
    "chat_placeholder": "Ask me anything...",
    "analyzing": "Analyzing...",
    "ai_tip": "AI Tip",
    "new_rec": "New",
    "firstname": "First Name",
    "lastname": "Last Name",
    "confirm_password": "Confirm Password"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('de');
  const t = (key: string) => dictionary[language][key] || key;
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation error");
  return context;
};