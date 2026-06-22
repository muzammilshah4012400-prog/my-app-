'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, LockOpen, ShieldAlert, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  usePakVault,
  APP_CATALOG,
  type AppCatalogEntry,
} from '@/components/pakvault-provider'
import { LockChallenge } from '@/components/lock-pad'
import type { Screen } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'

// Deterministic accent color per app so avatars look distinct but on-theme.
const AVATAR_TONES = [
  'bg-chart-1/20 text-chart-1',
  'bg-chart-2/20 text-chart-2',
  'bg-chart-3/20 text-chart-3',
  'bg-chart-4/20 text-chart-4',
  'bg-chart-5/20 text-chart-5',
]
function tone(id: string) {
  let h = 0
  for (const c of id) h = (h + c.charCodeAt(0)) % AVATAR_TONES.length
  return AVATAR_TONES[h]
}

export function AppLockerScreen({
  onNavigate,
}: {
  onNavigate: (s: Screen) => void
}) {
  const { user, verifyLock, toggleAppLock } = usePakVault()
  const [challenge, setChallenge] = useState<AppCatalogEntry | null>(null)

  if (!user) return null

  const lockedCount = user.lockedApps.length

  // No lock configured yet.
  if (!user.lock) {
    return (
      <ScreenShell>
        <EmptyState
          icon={<ShieldAlert className="size-7" />}
          title="Set up your lock first"
          body="Create a PIN or pattern in Security settings to start locking apps."
          action={
            <Button className="mt-4 h-11" onClick={() => onNavigate('settings')}>
              Go to Security settings
            </Button>
          }
        />
      </ScreenShell>
    )
  }

  // Lock exists but App Locker disabled.
  if (!user.appLockerEnabled) {
    return (
      <ScreenShell>
        <EmptyState
          icon={<Lock className="size-7" />}
          title="App Locker is off"
          body="Enable App Locker in Security settings, then choose which apps to protect."
          action={
            <Button className="mt-4 h-11" onClick={() => onNavigate('settings')}>
              Enable in settings
            </Button>
          }
        />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell>
      <div className="flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary" />
        <p>
          Locked apps require your {user.lock.type === 'pin' ? 'PIN' : 'pattern'}{' '}
          to open. Tap a locked app below to preview the unlock screen.
        </p>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold">
          {lockedCount} app{lockedCount === 1 ? '' : 's'} locked
        </p>
        <span className="text-xs text-muted-foreground">
          {APP_CATALOG.length} apps
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {APP_CATALOG.map((app) => {
          const locked = user.lockedApps.includes(app.id)
          return (
            <li
              key={app.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <button
                type="button"
                onClick={() => locked && setChallenge(app)}
                className="flex flex-1 items-center gap-3 text-left"
                aria-label={locked ? `Open ${app.name}` : app.name}
              >
                <span
                  className={cn(
                    'flex size-11 items-center justify-center rounded-xl text-base font-semibold',
                    tone(app.id),
                  )}
                >
                  {app.name.slice(0, 1)}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{app.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {app.category}
                  </span>
                </span>
                {locked && (
                  <ChevronRight className="ml-1 size-4 text-muted-foreground" />
                )}
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={locked}
                aria-label={`${locked ? 'Unlock' : 'Lock'} ${app.name}`}
                onClick={() => {
                  toggleAppLock(app.id)
                  toast.success(
                    locked ? `${app.name} unlocked` : `${app.name} locked`,
                  )
                }}
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl transition-colors',
                  locked
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {locked ? (
                  <Lock className="size-5" />
                ) : (
                  <LockOpen className="size-5" />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {challenge && (
        <div className="absolute inset-0 z-20 bg-background">
          <LockChallenge
            type={user.lock.type}
            title={`Unlock ${challenge.name}`}
            subtitle={`Enter your ${user.lock.type === 'pin' ? 'PIN' : 'pattern'} to continue`}
            onAttempt={(secret) => {
              if (verifyLock(secret)) {
                toast.success(`${challenge.name} unlocked`)
                setChallenge(null)
                return true
              }
              return false
            }}
          />
          <button
            type="button"
            onClick={() => setChallenge(null)}
            className="absolute left-1/2 bottom-8 -translate-x-1/2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
    </ScreenShell>
  )
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-col gap-4 px-5 pb-6 pt-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight">App Locker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Protect sensitive apps behind your lock.
        </p>
      </header>
      {children}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        {icon}
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  )
}
