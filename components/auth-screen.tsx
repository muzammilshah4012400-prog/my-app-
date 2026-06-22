'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Vault, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePakVault } from '@/components/pakvault-provider'

type Mode = 'login' | 'signup'

export function AuthScreen() {
  const { login, signup } = usePakVault()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result =
      mode === 'login'
        ? login(email, password)
        : signup(name, email, password)
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(
      mode === 'login' ? 'Welcome back!' : 'Account created. You got 10 coins!',
    )
  }

  return (
    <div className="flex h-full flex-col px-6 pb-10 pt-16">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <Vault className="size-8 text-primary" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance">
          {mode === 'login' ? 'Welcome to PakVault' : 'Create your account'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          {mode === 'login'
            ? 'Sign in to manage your Digital Coins, top up via EasyPaisa or JazzCash, and invite friends.'
            : 'Join PakVault and get 10 Digital Coins to start. Top up anytime via EasyPaisa or JazzCash.'}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
        {(['login', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={
              'rounded-lg py-2 text-sm font-medium capitalize transition-colors ' +
              (mode === m
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground')
            }
          >
            {m === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === 'signup' && (
          <Field
            id="name"
            label="Full name"
            icon={<UserIcon className="size-4" />}
          >
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ali Khan"
              className="pl-9"
              autoComplete="name"
            />
          </Field>
        )}

        <Field id="email" label="Email" icon={<Mail className="size-4" />}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-9"
            autoComplete="email"
          />
        </Field>

        <Field id="password" label="Password" icon={<Lock className="size-4" />}>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-9 pr-10"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </Field>

        <Button type="submit" className="mt-2 h-11 text-base" disabled={loading}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>

      <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        By continuing you agree to PakVault&apos;s Terms &amp; Privacy Policy.
      </p>
    </div>
  )
}

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}
