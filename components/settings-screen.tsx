'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  ShieldCheck,
  KeyRound,
  Grid3x3,
  Lock,
  LogOut,
  Mail,
  User as UserIcon,
  ChevronRight,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePakVault, type LockType } from '@/components/pakvault-provider'
import { PinPad, PatternLock } from '@/components/lock-pad'
import { cn } from '@/lib/utils'

type Tab = 'general' | 'security'

export function SettingsScreen() {
  const { user, logout, setAppLockerEnabled, lockVault } = usePakVault()
  const [tab, setTab] = useState<Tab>('security')
  const [setupOpen, setSetupOpen] = useState(false)

  if (!user) return null

  function handleAppLockerToggle(next: boolean) {
    const res = setAppLockerEnabled(next)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    if (next) lockVault()
    toast.success(next ? 'App Locker enabled' : 'App Locker disabled')
  }

  return (
    <div className="relative flex min-h-full flex-col gap-5 px-5 pb-6 pt-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and security.
        </p>
      </header>

      {/* Segmented tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary p-1">
        <TabButton active={tab === 'general'} onClick={() => setTab('general')}>
          General
        </TabButton>
        <TabButton active={tab === 'security'} onClick={() => setTab('security')}>
          Security
        </TabButton>
      </div>

      {tab === 'general' ? (
        <section className="flex flex-col gap-3">
          <InfoRow icon={<UserIcon className="size-4" />} label="Name" value={user.name} />
          <InfoRow icon={<Mail className="size-4" />} label="Email" value={user.email} />
          <InfoRow
            icon={<ShieldCheck className="size-4" />}
            label="Coins"
            value={`${user.coins} coins`}
          />
          <Button
            variant="secondary"
            className="mt-2 h-11 w-full gap-2"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          {/* Lock status */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                {user.lock?.type === 'pattern' ? (
                  <Grid3x3 className="size-5" />
                ) : (
                  <KeyRound className="size-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Lock method</p>
                <p className="text-xs text-muted-foreground">
                  {user.lock
                    ? user.lock.type === 'pin'
                      ? 'PIN code'
                      : 'Pattern'
                    : 'Not set up yet'}
                </p>
              </div>
              <Button size="sm" onClick={() => setSetupOpen(true)}>
                {user.lock ? 'Change' : 'Set up'}
              </Button>
            </div>
          </div>

          {/* App Locker toggle */}
          <ToggleRow
            icon={<Lock className="size-5" />}
            title="App Locker"
            subtitle={
              user.lock
                ? 'Require your lock to open selected apps'
                : 'Set up a lock to enable this'
            }
            checked={user.appLockerEnabled}
            disabled={!user.lock}
            onChange={handleAppLockerToggle}
          />

          {/* Lock vault now */}
          {user.lock && (
            <button
              type="button"
              onClick={() => {
                lockVault()
                toast.success('Vault locked')
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Lock My Vault now</p>
                <p className="text-xs text-muted-foreground">
                  Require the lock next time the vault is opened
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          )}
        </section>
      )}

      {setupOpen && (
        <LockSetup
          hasLock={!!user.lock}
          currentType={user.lock?.type ?? 'pin'}
          onClose={() => setSetupOpen(false)}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function ToggleRow({
  icon,
  title,
  subtitle,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border bg-card p-4',
        disabled && 'opacity-70',
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-background transition-transform',
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

/* ----------------------- Lock setup flow ----------------------- */

type Step = 'verify' | 'choose' | 'enter' | 'confirm'

function LockSetup({
  hasLock,
  currentType,
  onClose,
}: {
  hasLock: boolean
  currentType: LockType
  onClose: () => void
}) {
  const { verifyLock, setLock, changeLock } = usePakVault()
  const [step, setStep] = useState<Step>(hasLock ? 'verify' : 'choose')
  const [method, setMethod] = useState<LockType>('pin')
  const [firstEntry, setFirstEntry] = useState('')
  const [currentSecret, setCurrentSecret] = useState('')
  const [error, setError] = useState('')

  function reset() {
    setFirstEntry('')
    setError('')
  }

  function handleVerify(secret: string) {
    if (verifyLock(secret)) {
      setCurrentSecret(secret)
      setStep('choose')
      setError('')
    } else {
      setError('Incorrect current lock. Try again.')
    }
  }

  function handleEnter(secret: string) {
    if (method === 'pin' && !/^\d{4,6}$/.test(secret)) {
      setError('PIN must be 4 to 6 digits.')
      return
    }
    if (method === 'pattern' && secret.length < 4) {
      setError('Connect at least 4 dots.')
      return
    }
    setFirstEntry(secret)
    setError('')
    setStep('confirm')
  }

  function handleConfirm(secret: string) {
    if (secret !== firstEntry) {
      setError(method === 'pin' ? 'PINs do not match.' : 'Patterns do not match.')
      setStep('enter')
      setFirstEntry('')
      return
    }
    const res = hasLock
      ? changeLock(currentSecret, method, secret)
      : setLock(method, secret)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success(hasLock ? 'Lock updated' : 'Lock created')
    onClose()
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-base font-semibold">
          {hasLock ? 'Change lock' : 'Set up lock'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-10">
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}

        {step === 'verify' && (
          <Stage
            title="Enter current lock"
            input={
              currentType === 'pin' ? (
                <PinPad onSubmit={handleVerify} />
              ) : (
                <PatternLock onComplete={handleVerify} />
              )
            }
          />
        )}

        {step === 'choose' && (
          <div className="flex w-full flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Choose a lock method</p>
            <div className="grid w-full grid-cols-2 gap-3">
              <MethodCard
                active={method === 'pin'}
                icon={<KeyRound className="size-6" />}
                label="PIN code"
                onClick={() => setMethod('pin')}
              />
              <MethodCard
                active={method === 'pattern'}
                icon={<Grid3x3 className="size-6" />}
                label="Pattern"
                onClick={() => setMethod('pattern')}
              />
            </div>
            <Button
              className="mt-2 h-11 w-full"
              onClick={() => {
                reset()
                setStep('enter')
              }}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 'enter' && (
          <Stage
            title={method === 'pin' ? 'Enter a new PIN' : 'Draw a new pattern'}
            input={
              method === 'pin' ? (
                <PinPad onSubmit={handleEnter} />
              ) : (
                <PatternLock onComplete={handleEnter} />
              )
            }
          />
        )}

        {step === 'confirm' && (
          <Stage
            title={method === 'pin' ? 'Re-enter your PIN' : 'Confirm your pattern'}
            input={
              method === 'pin' ? (
                <PinPad onSubmit={handleConfirm} />
              ) : (
                <PatternLock onComplete={handleConfirm} />
              )
            }
          />
        )}
      </div>
    </div>
  )
}

function Stage({ title, input }: { title: string; input: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-base font-semibold">{title}</p>
      {input}
    </div>
  )
}

function MethodCard({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border p-5 transition-colors',
        active
          ? 'border-primary bg-accent text-accent-foreground'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'flex size-12 items-center justify-center rounded-xl',
          active ? 'bg-primary/20 text-primary' : 'bg-secondary',
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  )
}
