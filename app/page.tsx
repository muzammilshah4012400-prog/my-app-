'use client'

import { useState } from 'react'
import { usePakVault } from '@/components/pakvault-provider'
import { AuthScreen } from '@/components/auth-screen'
import { Dashboard } from '@/components/dashboard'
import { DepositScreen } from '@/components/deposit-screen'
import { AppLockerScreen } from '@/components/app-locker-screen'
import { VaultScreen } from '@/components/vault-screen'
import { SettingsScreen } from '@/components/settings-screen'
import { PhoneFrame } from '@/components/phone-frame'
import { BottomNav, type Screen } from '@/components/bottom-nav'
import { Vault } from 'lucide-react'

export default function Page() {
  const { ready, user } = usePakVault()
  const [screen, setScreen] = useState<Screen>('home')

  return (
    <main className="flex min-h-dvh items-stretch justify-center bg-background sm:items-center sm:p-6">
      <PhoneFrame>
        {!ready ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Vault className="size-8 animate-pulse text-primary" />
            <p className="text-sm">Loading PakVault…</p>
          </div>
        ) : !user ? (
          <AuthScreen />
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto">
              {screen === 'home' && <Dashboard onNavigate={setScreen} />}
              {screen === 'deposit' && (
                <DepositScreen onBack={() => setScreen('home')} />
              )}
              {screen === 'locker' && (
                <AppLockerScreen onNavigate={setScreen} />
              )}
              {screen === 'vault' && <VaultScreen onNavigate={setScreen} />}
              {screen === 'settings' && <SettingsScreen />}
            </div>
            <BottomNav active={screen} onNavigate={setScreen} />
          </div>
        )}
      </PhoneFrame>
    </main>
  )
}
