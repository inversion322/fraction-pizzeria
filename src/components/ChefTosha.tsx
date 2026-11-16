/** Chef Tosha: a small drawn avatar (toque + moustache) instead of an emoji. */
export function ChefTosha({ size = 48, mood = 'calm', className = '' }: { size?: number; mood?: 'calm' | 'happy' | 'thinking'; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="rgb(var(--tomato-soft))" />
      {/* toque */}
      <path d="M20 26c-5 0-7-6-3-9 1-5 7-7 10-4 2-4 9-4 11 0 3-3 9-1 9 4 4 3 2 9-3 9Z" fill="#fff" stroke="rgb(var(--ink))" strokeWidth="2" strokeLinejoin="round" />
      <rect x="20" y="24" width="24" height="6" rx="2" fill="#fff" stroke="rgb(var(--ink))" strokeWidth="2" />
      {/* face */}
      <path d="M19 31h26v6a13 13 0 0 1-26 0Z" fill="#F4C9A4" />
      {mood === 'thinking'
        ? <><path d="M25 36h4M35 36h4" stroke="rgb(var(--ink))" strokeWidth="2.2" strokeLinecap="round" /></>
        : <><circle cx="27" cy="36" r="1.8" fill="rgb(var(--ink))" /><circle cx="37" cy="36" r="1.8" fill="rgb(var(--ink))" /></>}
      {/* moustache */}
      <path d="M32 41c-2-2.4-6-2.6-8-.4 2.6.4 4.6 2.6 8 1.4 3.4 1.2 5.4-1 8-1.4-2-2.2-6-2-8 .4Z" fill="rgb(var(--ink))" />
      {mood === 'happy' && <path d="M28.5 45c2 1.4 5 1.4 7 0" stroke="rgb(var(--tomato-ink))" strokeWidth="2" strokeLinecap="round" fill="none" />}
    </svg>
  )
}
