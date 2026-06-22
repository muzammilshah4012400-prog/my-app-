'use client'

import { Home, ArrowDownToLine, Lock, FolderLock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Screen = 'home' | 'deposit' | 'locker' | 'vault' | 'settings'

const items: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'locker', label: 'Locker', icon: Lock },
  { id: 'vault', label: 'Vault', icon: FolderLock },
  { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function BottomNav({
  active,
  onNavigate,
}: {
  active: Screen
  onNavigate: (s: Screen) => void
}) {
  return (
    <nav className="flex shrink-0 items-center justify-around border-t border-border bg-card px-1 pb-6 pt-3 sm:pb-3">
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[0.7rem] font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
