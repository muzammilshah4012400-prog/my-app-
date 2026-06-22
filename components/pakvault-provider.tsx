'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { putMedia, getMedia, deleteMedia } from '@/lib/vault-store'

export type Deposit = {
  id: string
  method: 'EasyPaisa' | 'JazzCash'
  trxId: string
  amount: number
  status: 'pending' | 'approved'
  createdAt: number
}

export type LockType = 'pin' | 'pattern'

export type Lock = {
  type: LockType
  secret: string
}

export type VaultItem = {
  id: string
  name: string
  kind: 'photo' | 'video'
  mime: string
  size: number
  createdAt: number
}

export type User = {
  name: string
  email: string
  password: string
  coins: number
  referralCode: string
  invitesSent: number
  deposits: Deposit[]
  adFreeUntil: number
  // Security
  lock: Lock | null
  appLockerEnabled: boolean
  lockedApps: string[]
  vaultItems: VaultItem[]
}

export type AppCatalogEntry = {
  id: string
  name: string
  category: string
}

// Representative catalog of "installed apps" for the App Locker. A browser app
// cannot enumerate or control real device apps, so this stands in for them.
export const APP_CATALOG: AppCatalogEntry[] = [
  { id: 'whatsapp', name: 'WhatsApp', category: 'Messaging' },
  { id: 'messenger', name: 'Messenger', category: 'Messaging' },
  { id: 'instagram', name: 'Instagram', category: 'Social' },
  { id: 'facebook', name: 'Facebook', category: 'Social' },
  { id: 'tiktok', name: 'TikTok', category: 'Social' },
  { id: 'gallery', name: 'Gallery', category: 'Media' },
  { id: 'youtube', name: 'YouTube', category: 'Media' },
  { id: 'gmail', name: 'Gmail', category: 'Productivity' },
  { id: 'chrome', name: 'Chrome', category: 'Productivity' },
  { id: 'easypaisa', name: 'EasyPaisa', category: 'Finance' },
  { id: 'jazzcash', name: 'JazzCash', category: 'Finance' },
  { id: 'settings', name: 'Settings', category: 'System' },
]

type StoredState = {
  users: Record<string, User>
  sessionEmail: string | null
}

type AuthResult = { ok: true } | { ok: false; error: string }

type PakVaultContextValue = {
  ready: boolean
  user: User | null
  signup: (name: string, email: string, password: string) => AuthResult
  login: (email: string, password: string) => AuthResult
  logout: () => void
  submitDeposit: (
    method: Deposit['method'],
    trxId: string,
    amount: number,
  ) => void
  inviteFriend: () => number
  disableAdsForADay: () => AuthResult
  // Security
  vaultUnlocked: boolean
  setLock: (type: LockType, secret: string) => AuthResult
  changeLock: (
    currentSecret: string,
    type: LockType,
    newSecret: string,
  ) => AuthResult
  verifyLock: (secret: string) => boolean
  unlockVault: (secret: string) => boolean
  lockVault: () => void
  setAppLockerEnabled: (enabled: boolean) => AuthResult
  toggleAppLock: (appId: string) => void
  addVaultItems: (files: File[]) => Promise<number>
  removeVaultItem: (id: string) => Promise<void>
  getVaultObjectUrl: (id: string) => Promise<string | null>
}

const STORAGE_KEY = 'pakvault_state_v1'
const COINS_PER_INVITE = 5
const AD_DISABLE_COST = 1
const DAY_MS = 24 * 60 * 60 * 1000

const PakVaultContext = createContext<PakVaultContextValue | null>(null)

function generateReferralCode(name: string) {
  const base = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'PAK'
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base}-${rand}`
}

// Backfill security fields for accounts created before this upgrade.
function normalizeUser(u: User): User {
  return {
    ...u,
    lock: u.lock ?? null,
    appLockerEnabled: u.appLockerEnabled ?? false,
    lockedApps: u.lockedApps ?? [],
    vaultItems: u.vaultItems ?? [],
  }
}

export function PakVaultProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredState>({
    users: {},
    sessionEmail: null,
  })
  const [ready, setReady] = useState(false)
  const [vaultUnlocked, setVaultUnlocked] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState
        const users: Record<string, User> = {}
        for (const [k, v] of Object.entries(parsed.users ?? {})) {
          users[k] = normalizeUser(v as User)
        }
        setState({ users, sessionEmail: parsed.sessionEmail ?? null })
      }
    } catch {
      // ignore corrupt storage
    }
    setReady(true)
  }, [])

  const persist = useCallback((next: StoredState) => {
    setState(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore quota errors
    }
  }, [])

  const user = state.sessionEmail
    ? state.users[state.sessionEmail] ?? null
    : null

  const updateUser = useCallback(
    (email: string, updater: (u: User) => User) => {
      setState((prev) => {
        const existing = prev.users[email]
        if (!existing) return prev
        const next: StoredState = {
          ...prev,
          users: { ...prev.users, [email]: updater(existing) },
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // ignore
        }
        return next
      })
    },
    [],
  )

  const signup = useCallback(
    (name: string, email: string, password: string): AuthResult => {
      const key = email.trim().toLowerCase()
      if (!name.trim()) return { ok: false, error: 'Please enter your name.' }
      if (!key) return { ok: false, error: 'Please enter your email.' }
      if (password.length < 6)
        return { ok: false, error: 'Password must be at least 6 characters.' }
      if (state.users[key])
        return { ok: false, error: 'An account with this email already exists.' }

      const newUser: User = {
        name: name.trim(),
        email: key,
        password,
        coins: 10,
        referralCode: generateReferralCode(name),
        invitesSent: 0,
        deposits: [],
        adFreeUntil: 0,
        lock: null,
        appLockerEnabled: false,
        lockedApps: [],
        vaultItems: [],
      }
      persist({
        users: { ...state.users, [key]: newUser },
        sessionEmail: key,
      })
      return { ok: true }
    },
    [persist, state.users],
  )

  const login = useCallback(
    (email: string, password: string): AuthResult => {
      const key = email.trim().toLowerCase()
      const found = state.users[key]
      if (!found || found.password !== password)
        return { ok: false, error: 'Invalid email or password.' }
      setVaultUnlocked(false)
      persist({ ...state, sessionEmail: key })
      return { ok: true }
    },
    [persist, state],
  )

  const logout = useCallback(() => {
    setVaultUnlocked(false)
    persist({ ...state, sessionEmail: null })
  }, [persist, state])

  const submitDeposit = useCallback(
    (method: Deposit['method'], trxId: string, amount: number) => {
      if (!state.sessionEmail) return
      const deposit: Deposit = {
        id: Math.random().toString(36).slice(2, 10),
        method,
        trxId: trxId.trim(),
        amount,
        status: 'pending',
        createdAt: Date.now(),
      }
      updateUser(state.sessionEmail, (u) => ({
        ...u,
        deposits: [deposit, ...u.deposits],
      }))
    },
    [state.sessionEmail, updateUser],
  )

  const inviteFriend = useCallback(() => {
    if (!state.sessionEmail) return 0
    updateUser(state.sessionEmail, (u) => ({
      ...u,
      coins: u.coins + COINS_PER_INVITE,
      invitesSent: u.invitesSent + 1,
    }))
    return COINS_PER_INVITE
  }, [state.sessionEmail, updateUser])

  const disableAdsForADay = useCallback((): AuthResult => {
    if (!user) return { ok: false, error: 'Not signed in.' }
    if (user.coins < AD_DISABLE_COST)
      return { ok: false, error: 'Not enough coins.' }
    const base = Math.max(user.adFreeUntil, Date.now())
    updateUser(user.email, (u) => ({
      ...u,
      coins: u.coins - AD_DISABLE_COST,
      adFreeUntil: base + DAY_MS,
    }))
    return { ok: true }
  }, [user, updateUser])

  // ---- Security ----
  const setLock = useCallback(
    (type: LockType, secret: string): AuthResult => {
      if (!user) return { ok: false, error: 'Not signed in.' }
      if (type === 'pin' && !/^\d{4,6}$/.test(secret))
        return { ok: false, error: 'PIN must be 4 to 6 digits.' }
      if (type === 'pattern' && secret.length < 4)
        return { ok: false, error: 'Connect at least 4 dots.' }
      updateUser(user.email, (u) => ({ ...u, lock: { type, secret } }))
      return { ok: true }
    },
    [user, updateUser],
  )

  const changeLock = useCallback(
    (currentSecret: string, type: LockType, newSecret: string): AuthResult => {
      if (!user) return { ok: false, error: 'Not signed in.' }
      if (user.lock && user.lock.secret !== currentSecret)
        return { ok: false, error: 'Current lock is incorrect.' }
      if (type === 'pin' && !/^\d{4,6}$/.test(newSecret))
        return { ok: false, error: 'PIN must be 4 to 6 digits.' }
      if (type === 'pattern' && newSecret.length < 4)
        return { ok: false, error: 'Connect at least 4 dots.' }
      updateUser(user.email, (u) => ({ ...u, lock: { type, secret: newSecret } }))
      return { ok: true }
    },
    [user, updateUser],
  )

  const verifyLock = useCallback(
    (secret: string) => !!user?.lock && user.lock.secret === secret,
    [user],
  )

  const unlockVault = useCallback(
    (secret: string) => {
      if (verifyLock(secret)) {
        setVaultUnlocked(true)
        return true
      }
      return false
    },
    [verifyLock],
  )

  const lockVault = useCallback(() => setVaultUnlocked(false), [])

  const setAppLockerEnabled = useCallback(
    (enabled: boolean): AuthResult => {
      if (!user) return { ok: false, error: 'Not signed in.' }
      if (enabled && !user.lock)
        return { ok: false, error: 'Set a lock PIN or pattern first.' }
      updateUser(user.email, (u) => ({ ...u, appLockerEnabled: enabled }))
      return { ok: true }
    },
    [user, updateUser],
  )

  const toggleAppLock = useCallback(
    (appId: string) => {
      if (!user) return
      updateUser(user.email, (u) => ({
        ...u,
        lockedApps: u.lockedApps.includes(appId)
          ? u.lockedApps.filter((a) => a !== appId)
          : [...u.lockedApps, appId],
      }))
    },
    [user, updateUser],
  )

  const addVaultItems = useCallback(
    async (files: File[]): Promise<number> => {
      if (!user) return 0
      const added: VaultItem[] = []
      for (const file of files) {
        const isVideo = file.type.startsWith('video/')
        const isImage = file.type.startsWith('image/')
        if (!isVideo && !isImage) continue
        const id = Math.random().toString(36).slice(2, 12)
        await putMedia(id, file)
        added.push({
          id,
          name: file.name,
          kind: isVideo ? 'video' : 'photo',
          mime: file.type,
          size: file.size,
          createdAt: Date.now(),
        })
      }
      if (added.length) {
        updateUser(user.email, (u) => ({
          ...u,
          vaultItems: [...added, ...u.vaultItems],
        }))
      }
      return added.length
    },
    [user, updateUser],
  )

  const removeVaultItem = useCallback(
    async (id: string) => {
      if (!user) return
      await deleteMedia(id)
      updateUser(user.email, (u) => ({
        ...u,
        vaultItems: u.vaultItems.filter((v) => v.id !== id),
      }))
    },
    [user, updateUser],
  )

  const getVaultObjectUrl = useCallback(async (id: string) => {
    const blob = await getMedia(id)
    return blob ? URL.createObjectURL(blob) : null
  }, [])

  const value = useMemo<PakVaultContextValue>(
    () => ({
      ready,
      user,
      signup,
      login,
      logout,
      submitDeposit,
      inviteFriend,
      disableAdsForADay,
      vaultUnlocked,
      setLock,
      changeLock,
      verifyLock,
      unlockVault,
      lockVault,
      setAppLockerEnabled,
      toggleAppLock,
      addVaultItems,
      removeVaultItem,
      getVaultObjectUrl,
    }),
    [
      ready,
      user,
      signup,
      login,
      logout,
      submitDeposit,
      inviteFriend,
      disableAdsForADay,
      vaultUnlocked,
      setLock,
      changeLock,
      verifyLock,
      unlockVault,
      lockVault,
      setAppLockerEnabled,
      toggleAppLock,
      addVaultItems,
      removeVaultItem,
      getVaultObjectUrl,
    ],
  )

  return (
    <PakVaultContext.Provider value={value}>
      {children}
    </PakVaultContext.Provider>
  )
}

export function usePakVault() {
  const ctx = useContext(PakVaultContext)
  if (!ctx)
    throw new Error('usePakVault must be used within a PakVaultProvider')
  return ctx
}

export const PAKVAULT_CONSTANTS = {
  COINS_PER_INVITE,
  AD_DISABLE_COST,
  DAY_MS,
}
