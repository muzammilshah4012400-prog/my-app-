'use client'

import { useCallback, useRef, useState } from 'react'
import { Delete, Check, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LockType } from '@/components/pakvault-provider'

/* ----------------------------- PIN pad ----------------------------- */

export function PinPad({
  onSubmit,
  maxLength = 6,
  minLength = 4,
  submitLabel = 'Confirm',
  autoSubmitLength,
}: {
  onSubmit: (value: string) => void
  maxLength?: number
  minLength?: number
  submitLabel?: string
  autoSubmitLength?: number
}) {
  const [value, setValue] = useState('')

  const press = (d: string) => {
    setValue((v) => {
      if (v.length >= maxLength) return v
      const next = v + d
      if (autoSubmitLength && next.length === autoSubmitLength) {
        // defer submit so the dot renders first
        setTimeout(() => onSubmit(next), 80)
      }
      return next
    })
  }

  const back = () => setValue((v) => v.slice(0, -1))

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="flex items-center gap-3" aria-label="PIN entry">
        {Array.from({ length: maxLength }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'size-3.5 rounded-full border transition-colors',
              i < value.length
                ? 'border-primary bg-primary'
                : 'border-muted-foreground/40 bg-transparent',
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <KeypadButton key={d} onClick={() => press(d)}>
            {d}
          </KeypadButton>
        ))}
        <KeypadButton onClick={back} aria-label="Delete" variant="ghost">
          <Delete className="size-6" />
        </KeypadButton>
        <KeypadButton onClick={() => press('0')}>0</KeypadButton>
        {autoSubmitLength ? (
          <span aria-hidden className="size-16" />
        ) : (
          <KeypadButton
            onClick={() => value.length >= minLength && onSubmit(value)}
            aria-label={submitLabel}
            variant="primary"
            disabled={value.length < minLength}
          >
            <Check className="size-6" />
          </KeypadButton>
        )}
      </div>
    </div>
  )
}

function KeypadButton({
  children,
  onClick,
  variant = 'default',
  disabled,
  ...rest
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'ghost' | 'primary'
  disabled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-16 items-center justify-center rounded-full text-2xl font-medium tabular-nums transition-colors active:scale-95 disabled:opacity-40',
        variant === 'default' && 'bg-secondary text-foreground hover:bg-secondary/70',
        variant === 'ghost' && 'text-muted-foreground hover:text-foreground',
        variant === 'primary' &&
          'bg-primary text-primary-foreground hover:bg-primary/90',
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* --------------------------- Pattern lock --------------------------- */

const DOTS = Array.from({ length: 9 }, (_, i) => i)

export function PatternLock({
  onComplete,
  minLength = 4,
}: {
  onComplete: (value: string) => void
  minLength?: number
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])
  const [path, setPath] = useState<number[]>([])
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const drawing = useRef(false)

  const dotCenter = useCallback((i: number) => {
    const grid = gridRef.current
    const dot = dotRefs.current[i]
    if (!grid || !dot) return null
    const g = grid.getBoundingClientRect()
    const d = dot.getBoundingClientRect()
    return {
      x: d.left - g.left + d.width / 2,
      y: d.top - g.top + d.height / 2,
    }
  }, [])

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const grid = gridRef.current
      if (!grid) return
      const g = grid.getBoundingClientRect()
      const x = clientX - g.left
      const y = clientY - g.top
      setPointer({ x, y })
      for (const i of DOTS) {
        if (path.includes(i)) continue
        const c = dotCenter(i)
        if (!c) continue
        const dist = Math.hypot(c.x - x, c.y - y)
        if (dist < 26) {
          setPath((p) => (p.includes(i) ? p : [...p, i]))
          break
        }
      }
    },
    [dotCenter, path],
  )

  const start = (clientX: number, clientY: number) => {
    drawing.current = true
    setPath([])
    setPointer(null)
    handleMove(clientX, clientY)
  }

  const end = () => {
    drawing.current = false
    setPointer(null)
    if (path.length >= minLength) {
      onComplete(path.join(''))
    }
    setTimeout(() => setPath([]), 150)
  }

  const lines = path
    .map((i) => dotCenter(i))
    .filter((c): c is { x: number; y: number } => !!c)

  return (
    <div
      ref={gridRef}
      className="relative mx-auto aspect-square w-64 touch-none select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        start(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => drawing.current && handleMove(e.clientX, e.clientY)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <svg className="pointer-events-none absolute inset-0 size-full">
        {lines.map((c, idx) => {
          if (idx === 0) return null
          const prev = lines[idx - 1]
          return (
            <line
              key={idx}
              x1={prev.x}
              y1={prev.y}
              x2={c.x}
              y2={c.y}
              className="stroke-primary"
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })}
        {drawing.current && lines.length > 0 && pointer && (
          <line
            x1={lines[lines.length - 1].x}
            y1={lines[lines.length - 1].y}
            x2={pointer.x}
            y2={pointer.y}
            className="stroke-primary/50"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}
      </svg>

      <div className="grid h-full grid-cols-3 place-items-center">
        {DOTS.map((i) => {
          const active = path.includes(i)
          return (
            <div
              key={i}
              ref={(el) => {
                dotRefs.current[i] = el
              }}
              className="flex size-16 items-center justify-center"
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full transition-all',
                  active
                    ? 'size-7 bg-primary'
                    : 'size-5 bg-muted-foreground/30',
                )}
              >
                {active && (
                  <span className="size-2.5 rounded-full bg-primary-foreground" />
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------------- Lock challenge -------------------------- */

export function LockChallenge({
  type,
  title,
  subtitle,
  onAttempt,
}: {
  type: LockType
  title: string
  subtitle?: string
  // Return true when the secret is correct.
  onAttempt: (secret: string) => boolean
}) {
  const [error, setError] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  const attempt = (secret: string) => {
    const ok = onAttempt(secret)
    if (!ok) {
      setError(true)
      setShakeKey((k) => k + 1)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <ShieldCheck className="size-7" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <p
        className={cn(
          'h-5 text-sm font-medium text-destructive transition-opacity',
          error ? 'opacity-100' : 'opacity-0',
        )}
      >
        Incorrect {type === 'pin' ? 'PIN' : 'pattern'}. Try again.
      </p>
      <div
        key={shakeKey}
        className={cn(error && 'animate-[shake_0.4s_ease-in-out]')}
      >
        {type === 'pin' ? (
          <PinPad onSubmit={attempt} autoSubmitLength={undefined} />
        ) : (
          <PatternLock onComplete={attempt} />
        )}
      </div>
    </div>
  )
}
