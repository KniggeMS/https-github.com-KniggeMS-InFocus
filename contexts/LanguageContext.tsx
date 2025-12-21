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
    facts: "Fakten",
    überblick: "Überblick",
    ai_tip: "AI Tipp",
    NEW_REC: "NEUE EMPFEHLUNG",
    analyzing: "Analysiere...",
    
    // Profile
    profile: "Profil",
    member_since: "Mitglied seit",
    role_admin: "Administrator",
    role_manager: "Manager",
    role_user: "Benutzer",
    profile_updated: "Profil erfolgreich aktualisiert",
    password_updated: "Passwort erfolgreich geändert",
    level: "Level",
    next_level: "Nächstes Level",
    stats: "Statistiken",
    total_time: "Gesamtzeit",
    hours: "Stunden",
    movies_watched: "Filme gesehen",
    series_watched: "Serien gesehen",
    achievements: "Errungenschaften",
    edit_profile: "Profil bearbeiten",
    generating: "Generiere...",
    or_upload: "oder Upload",
    firstname: "Vorname",
    lastname: "Nachname",
    username: "Benutzername",
    email: "E-Mail",
    public_stats: "Öffentliche Statistiken",
    public_stats_desc: "Andere Nutzer können deine Level sehen",
    save_changes: "Änderungen speichern",
    security: "Sicherheit",
    current_password: "Aktuelles Passwort",
    new_password: "Neues Passwort",
    confirm_password: "Passwort bestätigen",
    change_password: "Passwort ändern",

    // Achievements
    ach_first_blood_title: "Erster Schnitt",
    ach_first_blood_desc: "Markiere deinen ersten Film als gesehen.",
    ach_collector_novice_title: "Sammler",
    ach_collector_novice_desc: "Füge 10 Items zu deiner Sammlung hinzu.",
    ach_binge_master_title: "Binge Master",
    ach_binge_master_desc: "Schau dir 5 komplette Serien an.",
    ach_critic_title: "Kritiker",
    ach_critic_desc: "Bewerte 10 Filme oder Serien.",
    ach_genre_guru_title: "Genre Guru",
    ach_genre_guru_desc: "Schaue 10 Filme desselben Genres.",
    ach_time_traveler_title: "Zeitreisender",
    ach_time_traveler_desc: "Schaue 5 Filme, die vor 1990 erschienen sind.",
    ach_marathon_runner_title: "Marathon Läufer",
    ach_marathon_runner_desc: "Erreiche 100 Stunden reine Watchtime.",

    // User Management
    user_management: "Benutzerverwaltung",
    search_user: "Benutzer suchen...",
    role: "Rolle",
    registered: "Registriert",
    logins: "Logins",
    last_login: "Letzter Login",
    actions: "Aktionen",

    // Search
    api_key_req: "Bitte TMDB API Key eingeben",
    api_key_missing: "API Key fehlt",
    add_title: "Titel hinzufügen",
    search_placeholder: "Film, Serie oder Person suchen...",
    search_button: "Suchen",
    vision_search: "Fotografiere ein Poster, um den Film zu finden.",

    // Chat
    chat_welcome: "Hey! Ich bin dein Film-Assistent. Frag mich nach Empfehlungen oder Details zu deinen Filmen!",
    chat_title: "AI Film Assistent",
    chat_placeholder: "Schreib eine Nachricht...",

    // Auth
    welcome_back: "Willkommen zurück",
    login_subtitle: "Melde dich an, um deine Watchlist zu verwalten.",
    email_address: "E-Mail Adresse",
    password: "Passwort",
    forgot_password: "Passwort vergessen?",
    login_button: "Anmelden",
    no_account: "Noch kein Konto?",
    register_here: "Hier registrieren",
    create_account: "Konto erstellen",
    register_subtitle: "Starte deine filmische Reise noch heute.",
    optional: "Optional",
    username_placeholder: "Benutzername",
    password_placeholder: "Passwort wählen",
    register_button: "Registrieren",
    already_member: "Bereits Mitglied?",
    login_here: "Zurück zur Anmeldung",
    reset_password: "Passwort zurücksetzen",
    reset_subtitle: "Wir senden dir einen Link, um dein Passwort zurückzusetzen.",
    registration_success: "Registrierung erfolgreich! Du kannst dich jetzt anmelden.",
    reset_link_sent: "Link zum Zurücksetzen des Passworts wurde gesendet."
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
    facts: "Facts",
    überblick: "Overview",
    ai_tip: "AI Tip",
    NEW_REC: "NEW REC",
    analyzing: "Analyzing...",

    // Profile
    profile: "Profile",
    member_since: "Member since",
    role_admin: "Administrator",
    role_manager: "Manager",
    role_user: "User",
    profile_updated: "Profile updated successfully",
    password_updated: "Password changed successfully",
    level: "Level",
    next_level: "Next Level",
    stats: "Statistics",
    total_time: "Total Time",
    hours: "Hours",
    movies_watched: "Movies Watched",
    series_watched: "Series Watched",
    achievements: "Achievements",
    edit_profile: "Edit Profile",
    generating: "Generating...",
    or_upload: "or Upload",
    firstname: "First Name",
    lastname: "Last Name",
    username: "Username",
    email: "Email",
    public_stats: "Public Statistics",
    public_stats_desc: "Others can see your level",
    save_changes: "Save Changes",
    security: "Security",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirm Password",
    change_password: "Change Password",

    // Achievements
    ach_first_blood_title: "First Blood",
    ach_first_blood_desc: "Mark your first movie as watched.",
    ach_collector_novice_title: "Collector",
    ach_collector_novice_desc: "Add 10 items to your collection.",
    ach_binge_master_title: "Binge Master",
    ach_binge_master_desc: "Watch 5 complete series.",
    ach_critic_title: "Critic",
    ach_critic_desc: "Rate 10 movies or series.",
    ach_genre_guru_title: "Genre Guru",
    ach_genre_guru_desc: "Watch 10 movies of the same genre.",
    ach_time_traveler_title: "Time Traveler",
    ach_time_traveler_desc: "Watch 5 movies released before 1990.",
    ach_marathon_runner_title: "Marathon Runner",
    ach_marathon_runner_desc: "Reach 100 hours of total watchtime.",

    // User Management
    user_management: "User Management",
    search_user: "Search user...",
    role: "Role",
    registered: "Registered",
    logins: "Logins",
    last_login: "Last Login",
    actions: "Actions",

    // Search
    api_key_req: "Please enter TMDB API Key",
    api_key_missing: "API Key missing",
    add_title: "Add Title",
    search_placeholder: "Search for movies, series or people...",
    search_button: "Search",
    vision_search: "Take a photo of a poster to find the movie.",

    // Chat
    chat_welcome: "Hey! I'm your movie assistant. Ask me for recommendations or details about your movies!",
    chat_title: "AI Movie Assistant",
    chat_placeholder: "Type a message...",
    
    // Auth
    welcome_back: "Welcome back",
    login_subtitle: "Log in to manage your watchlist.",
    email_address: "Email Address",
    password: "Password",
    forgot_password: "Forgot password?",
    login_button: "Log In",
    no_account: "Don't have an account?",
    register_here: "Register here",
    create_account: "Create Account",
    register_subtitle: "Start your cinematic journey today.",
    optional: "Optional",
    username_placeholder: "Username",
    password_placeholder: "Choose a password",
    register_button: "Register",
    already_member: "Already a member?",
    login_here: "Back to login",
    reset_password: "Reset Password",
    reset_subtitle: "We'll send you a link to reset your password.",
    registration_success: "Registration successful! You can now log in.",
    reset_link_sent: "Password reset link has been sent."
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
