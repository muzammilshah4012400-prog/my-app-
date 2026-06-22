'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  ShieldAlert,
  Upload,
  Lock,
  Play,
  Trash2,
  X,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePakVault, type VaultItem } from '@/components/pakvault-provider'
import { LockChallenge } from '@/components/lock-pad'
import type { Screen } from '@/components/bottom-nav'

export function VaultScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const {
    user,
    vaultUnlocked,
    unlockVault,
    lockVault,
    addVaultItems,
    removeVaultItem,
  } = usePakVault()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [viewing, setViewing] = useState<VaultItem | null>(null)

  if (!user) return null

  // No lock configured.
  if (!user.lock) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-base font-semibold">Secure your vault</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Set a PIN or pattern in Security settings to start hiding photos and
            videos.
          </p>
          <Button className="mt-4 h-11" onClick={() => onNavigate('settings')}>
            Go to Security settings
          </Button>
        </div>
      </Shell>
    )
  }

  // Locked.
  if (!vaultUnlocked) {
    return (
      <Shell>
        <LockChallenge
          type={user.lock.type}
          title="My Vault is locked"
          subtitle={`Enter your ${user.lock.type === 'pin' ? 'PIN' : 'pattern'} to view your files`}
          onAttempt={(secret) => unlockVault(secret)}
        />
      </Shell>
    )
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    setBusy(true)
    try {
      const count = await addVaultItems(Array.from(list))
      if (count > 0) toast.success(`${count} item${count === 1 ? '' : 's'} added to your vault`)
      else toast.error('Only photos and videos can be added.')
    } catch {
      toast.error('Could not save files. Please try again.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const items = user.vaultItems

  return (
    <Shell
      action={
        <button
          type="button"
          onClick={lockVault}
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Lock vault"
        >
          <Lock className="size-4" />
        </button>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Button
        className="h-12 w-full gap-2"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        <Upload className="size-5" />
        {busy ? 'Adding…' : 'Add photos or videos'}
      </Button>

      <p className="px-1 text-sm font-semibold">
        {items.length} hidden item{items.length === 1 ? '' : 's'}
      </p>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <ImageIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Your vault is empty. Add files to keep them hidden and protected.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setViewing(item)}
                className="relative block aspect-square w-full overflow-hidden rounded-xl border border-border bg-secondary"
              >
                <VaultThumb item={item} />
                {item.kind === 'video' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/30">
                    <Play className="size-6 text-foreground" fill="currentColor" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {viewing && (
        <VaultViewer
          item={viewing}
          onClose={() => setViewing(null)}
          onDelete={async () => {
            await removeVaultItem(viewing.id)
            setViewing(null)
            toast.success('Removed from vault')
          }}
        />
      )}
    </Shell>
  )
}

function Shell({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-full flex-col gap-4 px-5 pb-6 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">My Vault</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Private, hidden photos and videos.
          </p>
        </div>
        {action}
      </header>
      {children}
    </div>
  )
}

function VaultThumb({ item }: { item: VaultItem }) {
  const { getVaultObjectUrl } = usePakVault()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let created: string | null = null
    getVaultObjectUrl(item.id).then((u) => {
      if (active && u) {
        created = u
        setUrl(u)
      }
    })
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [item.id, getVaultObjectUrl])

  if (!url) {
    return <span className="block size-full animate-pulse bg-muted" />
  }
  if (item.kind === 'video') {
    return (
      <video
        src={url}
        className="size-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
    )
  }
  return (
    <img
      src={url || '/placeholder.svg'}
      alt={item.name}
      className="size-full object-cover"
    />
  )
}

function VaultViewer({
  item,
  onClose,
  onDelete,
}: {
  item: VaultItem
  onClose: () => void
  onDelete: () => void
}) {
  const { getVaultObjectUrl } = usePakVault()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let created: string | null = null
    getVaultObjectUrl(item.id).then((u) => {
      if (active && u) {
        created = u
        setUrl(u)
      }
    })
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [item.id, getVaultObjectUrl])

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        {!url ? (
          <div className="size-10 animate-pulse rounded-full bg-muted" />
        ) : item.kind === 'video' ? (
          <video src={url} controls autoPlay className="max-h-full max-w-full rounded-xl" />
        ) : (
          <img
            src={url || '/placeholder.svg'}
            alt={item.name}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        )}
      </div>
      <p className="truncate px-4 pb-6 text-center text-sm text-muted-foreground">
        {item.name}
      </p>
    </div>
  )
}
