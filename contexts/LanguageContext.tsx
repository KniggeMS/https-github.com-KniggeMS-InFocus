
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
    "reset_subtitle": "Gib deine E-Mail Adresse ein, um einen Link zum Zurücksetzen zu erhalten.",
    "send_reset_link": "Link senden",
    "reset_link_sent": "E-Mail gesendet! Bitte überprüfe deinen Posteingang und klicke auf den Link.",
    "new_password": "Neues Passwort",
    "set_new_password": "Neues Passwort festlegen",
    "set_password_btn": "Passwort speichern & Anmelden",
    "back_to_login": "Zurück zur Anmeldung",
    "registration_success": "Registrierung erfolgreich! Bitte überprüfe deine E-Mails und melde dich an.",
    
    // Profile & Gamification
    "profile": "Profil",
    "edit_profile": "Profil bearbeiten",
    "security": "Sicherheit",
    "current_password": "Aktuelles Passwort",
    "change_password": "Passwort ändern",
    "save_changes": "Änderungen speichern",
    "profile_updated": "Profil aktualisiert",
    "password_updated": "Passwort erfolgreich geändert",
    "password_reset_success": "Passwort wurde zurückgesetzt. Bitte neu anmelden.",
    "level": "Level",
    "next_level": "Nächstes Level",
    "xp": "XP",
    "stats": "Deine Statistiken",
    "total_time": "Gesehene Zeit",
    "hours": "Std.",
    "movies_watched": "Filme gesehen",
    "series_watched": "Serien gesehen",
    "achievements": "Trophäen",
    "locked": "Gesperrt",
    "reviews_written": "Rezensionen verfasst",
    
    // Status
    "to_watch": "Geplant",
    "watching": "Dabei",
    "watched": "Gesehen",

    // Privacy & Roles
    "privacy_settings": "Privatsphäre",
    "public_stats": "Statistiken öffentlich sichtbar",
    "public_stats_desc": "Andere Benutzer können dein Level und deine Trophäen sehen.",
    "role": "Rolle",
    "role_admin": "Admin",
    "role_manager": "Manager",
    "role_user": "Benutzer",
    "access_denied": "Zugriff verweigert",
    "private_profile": "Dieses Profil ist privat.",
    "member_since": "Mitglied seit",
    
    // User Management
    "user_management": "Benutzerverwaltung",
    "manage_users": "Benutzer verwalten",
    "users_count": "Registrierte Benutzer",
    "search_user": "Benutzer suchen...",
    "delete_user": "Benutzer löschen",
    "delete_user_confirm": "Möchtest du diesen Benutzer und alle seine Daten wirklich unwiderruflich löschen?",
    "role_updated": "Rolle erfolgreich aktualisiert",
    "user_deleted": "Benutzer gelöscht",
    "actions": "Aktionen",
    "cant_edit_self": "Eigenes Profil hier nicht bearbeitbar",
    "cant_edit_admin": "Admins können nicht von Managern bearbeitet werden",

    // Achievement Titles (DE)
    "ach_first_blood_title": "Erster Schritt",
    "ach_first_blood_desc": "Markiere deinen ersten film als gesehen.",
    "ach_collector_novice_title": "Sammler",
    "ach_collector_novice_desc": "Habe 10 Items in deiner Sammlung.",
    "ach_binge_master_title": "Binge Master",
    "ach_binge_master_desc": "Schau dir 5 komplette Serien an.",
    "ach_critic_title": "Kritiker",
    "ach_critic_desc": "Bewerte 10 Filme oder Serien.",
    "ach_genre_guru_title": "Genre Guru",
    "ach_genre_guru_desc": "Schau 10 Filme desselben Genres.",
    "ach_time_traveler_title": "Zeitreisender",
    "ach_time_traveler_desc": "Schau 5 Filme vor 1990.",
    "ach_marathon_runner_title": "Marathonläufer",
    "ach_marathon_runner_desc": "Erreiche 100 Stunden Wiedergabezeit.",

    // Navigation
    "overview": "Übersicht",
    "my_lists": "Meine Listen",
    "planned": "Geplant",
    "favorites": "Favoriten",
    "add_button": "Hinzufügen",
    "settings": "Einstellungen",
    "logout": "Abmelden",
    "ai_tip": "AI Tipp",
    "new_rec": "Neu",
    "remember": "Merken",
    
    // Theme
    "appearance": "Erscheinungsbild",
    "theme_dark": "Dark",
    "theme_light": "Light",
    "theme_glass": "iOS Glass",

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
    
    // Reviews
    "public_review": "Deine Rezension",
    "review_placeholder": "Teile deine Meinung mit der Community! Was hat dir gefallen? Was nicht? Deine Rezension hilft auch der AI.",
    "review_public_badge": "Öffentlich sichtbar",
    "review_saved": "Veröffentlicht",
    "review_saving": "Speichere...",
    "community_reviews": "Community Stimmen",
    
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
    "chat_welcome": "Hallo! Ich bin dein InFocus CineLog Assistent. Frag mich etwas zu deiner Sammlung oder lass dir neue Filme empfehlen!",
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
    "reset_subtitle": "Enter your email address to receive a reset link.",
    "send_reset_link": "Send Link",
    "reset_link_sent": "Email sent! Please check your inbox and click the link.",
    "new_password": "New Password",
    "set_new_password": "Set New Password",
    "set_password_btn": "Save Password & Login",
    "back_to_login": "Back to Login",
    "registration_success": "Registration successful! Please check your email and log in.",

    // Profile & Gamification
    "profile": "Profile",
    "edit_profile": "Edit Profile",
    "security": "Security",
    "current_password": "Current Password",
    "change_password": "Change Password",
    "save_changes": "Save Changes",
    "profile_updated": "Profile updated",
    "password_updated": "Password changed successfully",
    "password_reset_success": "Password reset successfully. Please login.",
    "level": "Level",
    "next_level": "Next Level",
    "xp": "XP",
    "stats": "Your Stats",
    "total_time": "Total Time",
    "hours": "Hrs",
    "movies_watched": "Movies Watched",
    "series_watched": "Series Watched",
    "achievements": "Trophies",
    "locked": "Locked",
    "reviews_written": "Reviews Written",
    
    // Status
    "to_watch": "Planned",
    "watching": "Watching",
    "watched": "Watched",

    // Privacy & Roles
    "privacy_settings": "Privacy",
    "public_stats": "Public Statistics",
    "public_stats_desc": "Other users can see your level and trophies.",
    "role": "Role",
    "role_admin": "Admin",
    "role_manager": "Manager",
    "role_user": "User",
    "access_denied": "Access Denied",
    "private_profile": "This profile is private.",
    "member_since": "Member since",
    
    // User Management
    "user_management": "User Management",
    "manage_users": "Manage Users",
    "users_count": "Registered Users",
    "search_user": "Search users...",
    "delete_user": "Delete User",
    "delete_user_confirm": "Are you sure you want to permanently delete this user and all their data?",
    "role_updated": "Role updated successfully",
    "user_deleted": "User deleted",
    "actions": "Actions",
    "cant_edit_self": "Can't edit yourself here",
    "cant_edit_admin": "Managers cannot edit Admins",

    // Achievement Titles (EN)
    "ach_first_blood_title": "First Step",
    "ach_first_blood_desc": "Mark your first movie as watched.",
    "ach_collector_novice_title": "Collector",
    "ach_collector_novice_desc": "Have 10 items in your collection.",
    "ach_binge_master_title": "Binge Master",
    "ach_binge_master_desc": "Watch 5 complete series.",
    "ach_critic_title": "The Critic",
    "ach_critic_desc": "Rate 10 movies or series.",
    "ach_genre_guru_title": "Genre Guru",
    "ach_genre_guru_desc": "Watch 10 items of the same genre.",
    "ach_time_traveler_title": "Time Traveler",
    "ach_time_traveler_desc": "Watch 5 movies from before 1990.",
    "ach_marathon_runner_title": "Marathon Runner",
    "ach_marathon_runner_desc": "Reach 100 hours of watch time.",
    
    // Navigation
    "overview": "Overview",
    "my_lists": "My Lists",
    "planned": "Planned",
    "seen": "Watched",
    "favorites": "Favorites",
    "add_button": "Add New",
    "settings": "Settings",
    "logout": "Logout",
    "ai_tip": "AI Tip",
    "new_rec": "New",
    "remember": "Save",
    
    // Theme
    "appearance": "Appearance",
    "theme_dark": "Dark",
    "theme_light": "Light",
    "theme_glass": "iOS Glass",

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
    
    // Reviews
    "public_review": "Your Review",
    "review_placeholder": "Share your opinion with the community! What did you like? This review also helps the AI.",
    "review_public_badge": "Publicly Visible",
    "review_saved": "Published",
    "review_saving": "Publishing...",
    "community_reviews": "Community Reviews",
    
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
    "chat_welcome": "Hello! I am your InFocus CineLog assistant. Ask me about your collection or for recommendations!",
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
