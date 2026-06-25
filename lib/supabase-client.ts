import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, detectSessionInUrl: false },
      })
    : null;

export async function syncUserToSupabase(user: {
  email: string;
  name: string;
  appLockerEnabled: boolean;
  lockedApps: string[];
  adsWatched: number;
  adImpressions: number;
  adFreeUntil: number;
}) {
  if (!supabase) return;
  try {
    await supabase.from("pakvault_users").upsert(
      {
        email: user.email,
        name: user.name,
        app_locker_enabled: user.appLockerEnabled,
        locked_apps: user.lockedApps,
        ads_watched: user.adsWatched,
        ad_impressions: user.adImpressions,
        ad_free_until: user.adFreeUntil,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );
  } catch (error) {
    console.warn("Supabase sync failed", error);
  }
}
