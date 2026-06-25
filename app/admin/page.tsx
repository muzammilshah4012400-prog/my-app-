"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Users, Lock, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type AdminStats = {
  total_users: number;
  app_locker_enabled: number;
  total_ads_watched: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      const client = supabase;

      if (!client) {
        if (!isMounted) return;
        setError(
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        );
        setLoading(false);
        return;
      }

      const {
        data,
        error: fetchError,
        count,
      } = await client
        .from("pakvault_users")
        .select("email, app_locker_enabled, ads_watched", {
          count: "exact",
          head: false,
        });

      if (!isMounted) return;

      if (fetchError || !data) {
        setError(fetchError?.message ?? "Unable to load admin statistics.");
        setLoading(false);
        return;
      }

      type UserStatsRow = {
        app_locker_enabled?: boolean;
        ads_watched?: number;
      };

      const rows = data as UserStatsRow[];
      const appLockerEnabled = rows.filter(
        (row) => row.app_locker_enabled,
      ).length;
      const totalAdsWatched = rows.reduce(
        (sum, row) => sum + (row.ads_watched ?? 0),
        0,
      );

      setStats({
        total_users: count ?? data.length,
        app_locker_enabled: appLockerEnabled,
        total_ads_watched: totalAdsWatched,
      });
      setLoading(false);
    };

    fetchStats();
    const interval = window.setInterval(fetchStats, 5000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-sm text-foreground">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="size-7 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Hidden admin monitoring page for Supabase-backed statistics.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary p-10 text-center">
            Loading admin data…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-destructive bg-destructive/10 p-6 text-destructive">
            {error}
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<Users />}
              label="Total users"
              value={stats.total_users}
            />
            <StatCard
              icon={<Lock />}
              label="App Lock active"
              value={stats.app_locker_enabled}
            />
            <StatCard
              icon={<PlayCircle />}
              label="Total ads watched"
              value={stats.total_ads_watched}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-border bg-background/80 p-5 shadow-sm">
      <div className="flex items-center gap-3 text-primary">{icon}</div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
