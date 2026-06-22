'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Coins,
  UserPlus,
  ArrowDownToLine,
  ShieldOff,
  LogOut,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  Sparkles,
  Lock,
  FolderLock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  usePakVault,
  PAKVAULT_CONSTANTS,
  type Deposit,
} from '@/components/pakvault-provider'
import type { Screen } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'

export function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user, logout, inviteFriend, disableAdsForADay } = usePakVault()
  const [copied, setCopied] = useState(false)

  if (!user) return null

  const adFree = user.adFreeUntil > Date.now()

  function handleInvite() {
    if (!user) return
    const code = user.referralCode
    const shareText = `Join me on PakVault and earn Digital Coins! Use my code ${code} to sign up.`
    const earned = inviteFriend()
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      navigator.share({ title: 'PakVault', text: shareText }).catch(() => {})
    }
    toast.success(`Invite sent! You earned ${earned} coins.`)
  }

  function handleCopy() {
    if (!user) return
    navigator.clipboard?.writeText(user.referralCode).then(() => {
      setCopied(true)
      toast.success('Referral code copied')
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function handleDisableAds() {
    const result = disableAdsForADay()
    if (!result.ok) {
      toast.error(result.error + ' Top up to get more coins.')
      return
    }
    toast.success('Ads disabled for 1 day. 1 coin spent.')
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-lg font-semibold tracking-tight">{user.name}</h1>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Log out"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      {/* Balance card */}
      <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground">
        <div className="absolute -right-6 -top-6 size-28 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-10 -left-4 size-32 rounded-full bg-primary-foreground/5" />
        <div className="relative flex items-center gap-2 text-sm font-medium opacity-80">
          <Coins className="size-4" />
          Digital Coins Balance
        </div>
        <div className="relative mt-3 flex items-end gap-2">
          <span className="text-5xl font-bold tabular-nums tracking-tight">
            {user.coins}
          </span>
          <span className="mb-1.5 text-base font-medium opacity-80">coins</span>
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-xs font-medium opacity-80">
          <Sparkles className="size-3.5" />
          Earn {PAKVAULT_CONSTANTS.COINS_PER_INVITE} coins for every friend you
          invite
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <ActionTile
          icon={<UserPlus className="size-5" />}
          label="Invite Friend"
          sub={`+${PAKVAULT_CONSTANTS.COINS_PER_INVITE} coins`}
          onClick={handleInvite}
          accent
        />
        <ActionTile
          icon={<ArrowDownToLine className="size-5" />}
          label="Deposit"
          sub="EasyPaisa / JazzCash"
          onClick={() => onNavigate('deposit')}
        />
        <ActionTile
          icon={<Lock className="size-5" />}
          label="App Locker"
          sub="Protect your apps"
          onClick={() => onNavigate('locker')}
        />
        <ActionTile
          icon={<FolderLock className="size-5" />}
          label="My Vault"
          sub="Hide photos & videos"
          onClick={() => onNavigate('vault')}
        />
      </section>

      {/* Referral code */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your referral code
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <code className="font-mono text-lg font-semibold tracking-wider">
            {user.referralCode}
          </code>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5"
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {user.invitesSent} friend{user.invitesSent === 1 ? '' : 's'} invited
          so far
        </p>
      </section>

      {/* Disable ads */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <ShieldOff className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Ad-free experience</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {adFree
                ? `Ads are disabled until ${new Date(
                    user.adFreeUntil,
                  ).toLocaleString()}.`
                : `Spend ${PAKVAULT_CONSTANTS.AD_DISABLE_COST} coin to remove ads for a full day.`}
            </p>
          </div>
        </div>
        {adFree && <AdFreeCountdown until={user.adFreeUntil} />}
        <Button
          type="button"
          onClick={handleDisableAds}
          variant={adFree ? 'secondary' : 'default'}
          className="mt-4 h-11 w-full"
        >
          {adFree
            ? 'Extend ad-free by 1 more day (1 coin)'
            : 'Spend 1 Coin to Disable Ads for 1 Day'}
        </Button>
      </section>

      {/* Recent deposits */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold">Recent deposits</h2>
        {user.deposits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No deposits yet. Tap Deposit to top up your coins.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {user.deposits.slice(0, 4).map((d) => (
              <DepositRow key={d.id} deposit={d} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function ActionTile({
  icon,
  label,
  sub,
  onClick,
  accent,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-3 rounded-2xl border border-border p-4 text-left transition-colors',
        accent
          ? 'bg-accent text-accent-foreground hover:bg-accent/80'
          : 'bg-card hover:bg-secondary',
      )}
    >
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-xl',
          accent ? 'bg-primary/20 text-primary' : 'bg-secondary',
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}

function DepositRow({ deposit }: { deposit: Deposit }) {
  const pending = deposit.status === 'pending'
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          pending ? 'bg-secondary text-muted-foreground' : 'bg-accent text-accent-foreground',
        )}
      >
        {pending ? (
          <Clock className="size-4" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          Rs {deposit.amount.toLocaleString()}{' '}
          <span className="text-muted-foreground">via {deposit.method}</span>
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          Trx: {deposit.trxId}
        </p>
      </div>
      <span
        className={cn(
          'rounded-full px-2.5 py-1 text-xs font-medium capitalize',
          pending
            ? 'bg-secondary text-muted-foreground'
            : 'bg-primary/15 text-primary',
        )}
      >
        {deposit.status}
      </span>
    </li>
  )
}

function AdFreeCountdown({ until }: { until: number }) {
  const [remaining, setRemaining] = useState(until - Date.now())

  useEffect(() => {
    const t = setInterval(() => setRemaining(until - Date.now()), 1000)
    return () => clearInterval(t)
  }, [until])

  if (remaining <= 0) return null
  const totalSeconds = Math.floor(remaining / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm">
      <Clock className="size-4 text-primary" />
      <span className="font-mono tabular-nums">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
      <span className="text-xs text-muted-foreground">remaining ad-free</span>
    </div>
  )
}
