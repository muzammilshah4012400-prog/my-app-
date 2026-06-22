export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full max-w-[420px] flex-col overflow-hidden border-border bg-card shadow-2xl sm:h-[860px] sm:rounded-[2.5rem] sm:border-8 sm:border-secondary">
      {/* Status notch (visible only in framed mode) */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-secondary sm:block" />
      <div className="flex min-h-dvh flex-col sm:min-h-0 sm:flex-1">
        {children}
      </div>
    </div>
  )
}
