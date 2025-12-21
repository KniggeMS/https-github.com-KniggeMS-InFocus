
import { createClient } from '@supabase/supabase-js';

// ACHTUNG: Für Wartungsarbeiten wird der SERVICE_ROLE_KEY benötigt.
// Diesen niemals in Git committen!
// Ausführen mit: $env:SERVICE_KEY="dein_key"; node services/maintenance.js

const supabaseUrl = 'https://eeaeoxyjupqjpudhthxv.supabase.co';
const serviceKey = process.env.SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
    console.error("❌ Bitte SERVICE_KEY Umgebungsvariable setzen!");
    console.error("Beispiel (PowerShell): $env:SERVICE_KEY='dein_service_key'; node services/maintenance.js");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const TMDB_KEY = '4115939bdc412c5f7b0c4598fcf29b77'; // Public Key ist ok
const OMDB_KEY = '33df5dc9';

async function runMaintenance() {


    console.log("🚀 Starte Wartung...");

    const { data: items, error } = await supabase.from('media_items').select('*');
    if (error) {
        console.error("Fehler beim Laden:", error);
        return;
    }
    console.log(`📊 ${items.length} Filme in der Datenbank gefunden.`);

    const seen = new Map();
    const toDelete = [];

    items.forEach(item => {
        const key = `${item.user_id}-${item.tmdb_id}`;
        if (seen.has(key)) {
            const existing = seen.get(key);
            if (!existing.rt_score && item.rt_score) {
                toDelete.push(existing.id);
                seen.set(key, item);
            } else {
                toDelete.push(item.id);
            }
        } else {
            seen.set(key, item);
        }
    });

    if (toDelete.length > 0) {
        console.log(`🗑️ Lösche ${toDelete.length} Duplikate...`);
        for (const id of toDelete) {
            await supabase.from('media_items').delete().eq('id', id);
        }
    }

    const activeItems = Array.from(seen.values());
    console.log("💧 Starte Daten-Reparatur (Hydration)...");

    for (const item of activeItems) {
        let updates = {};
        let needed = false;

        try {
            const type = item.type === 'SERIES' ? 'tv' : 'movie';
            const url = `https://api.themoviedb.org/3/${type}/${item.tmdb_id}?api_key=${TMDB_KEY}&append_to_response=release_dates,content_ratings,watch/providers,credits&language=de-DE`;
            const res = await fetch(url);
            const data = await res.json();

            if (data && data.success !== false) {
                updates.runtime = data.runtime || (data.episode_run_time ? data.episode_run_time[0] : null);
                
                if (item.type === 'MOVIE') {
                    const release = data.release_dates?.results.find(r => r.iso_3166_1 === 'DE') || data.release_dates?.results.find(r => r.iso_3166_1 === 'US');
                    updates.certification = release?.release_dates[0]?.certification || null;
                } else {
                    const rating = data.content_ratings?.results.find(r => r.iso_3166_1 === 'DE') || data.content_ratings?.results.find(r => r.iso_3166_1 === 'US');
                    updates.certification = rating?.rating || null;
                }

                const providers = data['watch/providers']?.results?.DE?.flatrate || [];
                updates.providers = providers.map(p => ({
                    providerId: p.provider_id,
                    providerName: p.provider_name,
                    logoPath: p.logo_path
                }));

                updates.credits = data.credits?.cast?.slice(0, 10).map(c => ({
                    id: c.id,
                    name: c.name,
                    character: c.character,
                    profilePath: c.profile_path
                })) || [];

                needed = true;
            }
        } catch (e) {
            console.error(`TMDB Fehler bei ${item.title}:`, e.message);
        }

        if (OMDB_KEY && item.imdb_id && (!item.rt_score || item.rt_score === 'null' || item.rt_score === '')) {
            try {
                const res = await fetch(`https://www.omdbapi.com/?i=${item.imdb_id}&apikey=${OMDB_KEY}`);
                const data = await res.json();
                const rt = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value;
                if (rt) {
                    updates.rt_score = rt;
                    needed = true;
                }
            } catch (e) {
                console.error(`OMDb Fehler bei ${item.title}:`, e.message);
            }
        }

        if (needed) {
            console.log(`✅ Update für: ${item.title}`);
            await supabase.from('media_items').update(updates).eq('id', item.id);
        }
    }

    console.log("✨ Wartung abgeschlossen!");
}

runMaintenance();