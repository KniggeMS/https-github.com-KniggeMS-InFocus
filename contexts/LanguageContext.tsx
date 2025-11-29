
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '../types';

type Translations = Record<string, Record<string, string>>;

const dictionary: Translations = {
  de: {
    // Auth
    "welcome_back": "Willkommen zurück",
    "create_account": "Konto erstellen",
    "login_subtitle": "Melde dich an, um deine Watchlist zu verwalten.",
    "register_subtitle": "Starte deine filmische Reise noch heute.",
    "username": "Benutzername",
    "email": "E-Mail Adresse",
    "password": "Passwort",
    "confirm_password": "Passwort bestätigen",
    "firstname": "Vorname (Optional)",
    "lastname": "Nachname (Optional)",
    "login_button": "Anmelden",
    "register_button": "Registrieren",
    "switch_to_register": "Noch kein Konto? Hier registrieren",
    "switch_to_login": "Bereits ein Konto? Hier anmelden",
    "generate_avatar": "Avatar generieren (AI)",
    "or_upload": "Oder hochladen",
    "generating": "Generiere...",
    "forgot_password": "Passwort vergessen?",
    "reset_password": "Passwort zurücksetzen",
    "reset_subtitle": "Gib deine Daten ein, um ein neues Passwort zu setzen.",
    "new_password": "Neues Passwort",
    "back_to_login": "Zurück zur Anmeldung",
    
    // Profile
    "profile": "Profil",
    "edit_profile": "Profil bearbeiten",
    "security": "Sicherheit",
    "current_password": "Aktuelles Passwort",
    "change_password": "Passwort ändern",
    "save_changes": "Änderungen speichern",
    "profile_updated": "Profil aktualisiert",
    "password_updated": "Passwort erfolgreich geändert",
    "password_reset_success": "Passwort wurde zurückgesetzt. Bitte neu anmelden.",

    // Navigation
    "overview": "Übersicht",
    "my_lists": "Meine Listen",
    "planned": "Geplant",
    "watching": "Dabei",
    "seen": "Gesehen",
    "favorites": "Favoriten",
    "add_button": "Hinzufügen",
    "settings": "Einstellungen",
    "logout": "Abmelden",
    "ai_tip": "AI Tipp",
    "new_rec": "Neu",
    "remember": "Merken",
    
    // Main Headers
    "collection": "Deine Sammlung",
    "collection_sub": "Verwalte deine Filme und Serien an einem Ort.",
    "fav_sub": "Deine absoluten Lieblinge.",
    "list_count": "Titel in dieser Liste.",
    "empty_state": "Noch nichts hier.",
    "empty_action": "Füge etwas hinzu!",
    
    // Sorting
    "sort_latest": "Neueste",
    "sort_rating": "Bewertung",
    "sort_year": "Jahr",
    "sort_title": "Titel (A-Z)",

    // Detail View
    "plot": "Handlung",
    "cast": "Hauptbesetzung",
    "creators": "Creator",
    "stream_available": "Als Stream verfügbar",
    "watch_now": "Jetzt anschauen",
    "no_stream": "Keine Streaming-Infos verfügbar",
    "original_title": "Originaltitel",
    "status": "Status",
    "language": "Sprache",
    "seasons": "Staffeln",
    "episodes": "Episoden",
    "part_of": "Teil von",
    "user_rating": "Bewertung",
    "your_vibe": "Wie ist dein Vibe?",
    "play_trailer": "Trailer abspielen",
    "close_trailer": "Schließen",
    "private_notes": "Private Notizen",
    "notes_placeholder": "Was hat dir gefallen? Was nicht? Diese Notizen helfen der AI, dir bessere Empfehlungen zu geben.",
    "ai_insight": "Deep Content Analysis",
    "analyzing_content": "Analysiere Inhalt...",

    // Actions
    "to_list": "Zur Liste hinzufügen",
    "favorite": "Favorit",
    "watchlist": "Watchlist",
    "your_rating": "Deine Bewertung",
    "rate": "Bewerten",
    "remove": "Entfernen",

    // Search
    "add_title": "Titel hinzufügen",
    "search_placeholder": "Film- oder Serientitel eingeben...",
    "search_button": "Suchen",
    "no_results": "Keine Ergebnisse gefunden.",
    "api_key_missing": "API Key fehlt",
    "api_key_req": "API Key erforderlich",
    "vision_search": "Foto scannen",

    // Custom Lists & Social
    "custom_lists": "Eigene Listen",
    "create_list": "Liste erstellen",
    "list_name": "Listenname",
    "create": "Erstellen",
    "cancel": "Abbrechen",
    "share": "Teilen",
    "shared_with": "Geteilt mit",
    "share_with_friends": "Mit Freunden teilen",
    "shared_by": "Geteilt von",
    "add_to_custom": "Zu Liste hinzufügen...",
    "delete_list": "Liste löschen",
    "delete_list_confirm": "Möchtest du diese Liste wirklich löschen?",
    "no_custom_lists": "Keine Listen vorhanden",
    "items_count": "Einträge",

    // Import
    "smart_import": "Smart Import",
    "import_desc": "Füge eine Liste von Titeln (einer pro Zeile) ein. Wir suchen automatisch die passenden Filme/Serien.",
    "import_placeholder": "Inception\nBreaking Bad\nDer Pate\n...",
    "analyze": "Analysieren",
    "import_preview": "Vorschau",
    "import_confirm": "Auswahl importieren",
    "analyzing": "Analysiere...",
    "no_match": "Kein Treffer",

    // Chat
    "chat_title": "CineChat AI",
    "chat_placeholder": "Frag mich nach 80er Horrorfilmen...",
    "chat_welcome": "Hallo! Ich bin dein CineLog Assistent. Frag mich etwas zu deiner Sammlung oder lass dir neue Filme empfehlen!",
  },
  en: {
    // Auth
    "welcome_back": "Welcome Back",
    "create_account": "Create Account",
    "login_subtitle": "Sign in to manage your watchlist.",
    "register_subtitle": "Start your cinematic journey today.",
    "username": "Username",
    "email": "Email Address",
    "password": "Password",
    "confirm_password": "Confirm Password",
    "firstname": "First Name (Optional)",
    "lastname": "Last Name (Optional)",
    "login_button": "Sign In",
    "register_button": "Register",
    "switch_to_register": "No account? Register here",
    "switch_to_login": "Already have an account? Sign in",
    "generate_avatar": "Generate Avatar (AI)",
    "or_upload": "Or upload",
    "generating": "Generating...",
    "forgot_password": "Forgot Password?",
    "reset_password": "Reset Password",
    "reset_subtitle": "Enter your details to set a new password.",
    "new_password": "New Password",
    "back_to_login": "Back to Login",

    // Profile
    "profile": "Profile",
    "edit_profile": "Edit Profile",
    "security": "Security",
    "current_password": "Current Password",
    "change_password": "Change Password",
    "save_changes": "Save Changes",
    "profile_updated": "Profile updated",
    "password_updated": "Password changed successfully",
    "password_reset_success": "Password reset successfully. Please login.",
    
    // Navigation
    "overview": "Overview",
    "my_lists": "My Lists",
    "planned": "Planned",
    "watching": "Watching",
    "seen": "Watched",
    "favorites": "Favorites",
    "add_button": "Add New",
    "settings": "Settings",
    "logout": "Logout",
    "ai_tip": "AI Tip",
    "new_rec": "New",
    "remember": "Save",

    // Main Headers
    "collection": "Your Collection",
    "collection_sub": "Manage your movies and series in one place.",
    "fav_sub": "Your absolute favorites.",
    "list_count": "titles in this list.",
    "empty_state": "Nothing here yet.",
    "empty_action": "Add something!",

    // Sorting
    "sort_latest": "Latest",
    "sort_rating": "Rating",
    "sort_year": "Year",
    "sort_title": "Title (A-Z)",

    // Detail View
    "plot": "Plot",
    "cast": "Main Cast",
    "creators": "Creators",
    "stream_available": "Streaming Available",
    "watch_now": "Watch Now",
    "no_stream": "No streaming info available",
    "original_title": "Original Title",
    "status": "Status",
    "language": "Language",
    "seasons": "Seasons",
    "episodes": "Episodes",
    "part_of": "Part of",
    "user_rating": "User Score",
    "your_vibe": "What's your vibe?",
    "play_trailer": "Play Trailer",
    "close_trailer": "Close",
    "private_notes": "Private Notes",
    "notes_placeholder": "What did you like? What not? These notes help the AI give you better recommendations.",
    "ai_insight": "Deep Content Analysis",
    "analyzing_content": "Analyzing content...",

    // Actions
    "to_list": "Add to List",
    "favorite": "Favorite",
    "watchlist": "Watchlist",
    "your_rating": "Your Rating",
    "rate": "Rate",
    "remove": "Remove",

    // Search
    "add_title": "Add Title",
    "search_placeholder": "Enter movie or series title...",
    "search_button": "Search",
    "no_results": "No results found.",
    "api_key_missing": "API Key Missing",
    "api_key_req": "API Key Required",
    "vision_search": "Scan Photo",

    // Custom Lists & Social
    "custom_lists": "Custom Lists",
    "create_list": "Create List",
    "list_name": "List Name",
    "create": "Create",
    "cancel": "Cancel",
    "share": "Share",
    "shared_with": "Shared with",
    "share_with_friends": "Share with friends",
    "shared_by": "Shared by",
    "add_to_custom": "Add to list...",
    "delete_list": "Delete List",
    "delete_list_confirm": "Are you sure you want to delete this list?",
    "no_custom_lists": "No lists created",
    "items_count": "items",

    // Import
    "smart_import": "Smart Import",
    "import_desc": "Paste a list of titles (one per line). We automatically find the matching movies/series.",
    "import_placeholder": "Inception\nBreaking Bad\nThe Godfather\n...",
    "analyze": "Analyze",
    "import_preview": "Preview",
    "import_confirm": "Import Selection",
    "analyzing": "Analyzing...",
    "no_match": "No match found",

    // Chat
    "chat_title": "CineChat AI",
    "chat_placeholder": "Ask about 80s horror movies...",
    "chat_welcome": "Hello! I am your CineLog assistant. Ask me about your collection or for recommendations!",
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

  const t = (key: string) => {
    return dictionary[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};
