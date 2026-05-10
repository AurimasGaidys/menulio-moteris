export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--brand-cream)' }}
    >
      <div className="mb-8 text-center">
        <span
          className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-wide"
          style={{ color: 'var(--brand-green)' }}
        >
          Menulio Moteris
        </span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
