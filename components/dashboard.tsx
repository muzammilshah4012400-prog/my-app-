"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  LogOut,
  Clock,
  FolderLock,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePakVault, APP_CATALOG } from "@/components/pakvault-provider";
import type { Screen } from "@/components/bottom-nav";

export function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user, logout, inviteFriend, disableAdsForADay, toggleAppLock } =
    usePakVault();
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const clockDisplay = useMemo(
    () =>
      time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [time],
  );

  const lockApps = useMemo(
    () =>
      APP_CATALOG.filter((app) =>
        ["whatsapp", "facebook", "instagram"].includes(app.id),
      ),
    [],
  );

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      {/* 1. Header Section */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-lg font-semibold">{user?.name}</h1>
        </div>
        <button onClick={logout} className="p-2 bg-secondary rounded-full">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* 2. Social Apps Lock Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FolderLock className="w-6 h-6 text-blue-600" /> Social Apps Lock
        </h2>
        <div className="space-y-4">
          {lockApps.map((app) => {
            const locked = user.lockedApps.includes(app.id);
            return (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 border rounded-md bg-gray-50"
              >
                <span className="capitalize">{app.name}</span>
                <Button
                  variant={locked ? "destructive" : "default"}
                  onClick={() => toggleAppLock(app.id)}
                >
                  {locked ? "Locked" : "Unlocked"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
