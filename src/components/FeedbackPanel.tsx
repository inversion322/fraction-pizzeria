import { ChefTosha } from './ChefTosha'
import { Icon } from './Icon'

export function FeedbackPanel({ kind, title, text, detail, actionLabel, onAction, coinGain, loading = false }: { kind: 'correct' | 'almost' | 'solution' | 'ai'; title: string; text: string; detail?: string; actionLabel: string; onAction: () => void; coinGain?: number; loading?: boolean }) {
  const palette = kind === 'correct' ? 'border-[#b9dfc5] bg-[#f3fbf4]' : kind === 'almost' ? 'border-[#f2c0ae] bg-[#fff5f0]' : kind === 'solution' ? 'border-[#e7d29a] bg-[#fffaf0]' : 'border-[#c7d8ed] bg-[#f4f8fe]'
  return (
    <section className={`feedback-in paper-card ${palette} relative overflow-hidden p-5 sm:p-6`} aria-live="polite">
      <div className="flex items-start gap-3 sm:gap-4">
        <ChefTosha compact />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-[#3D2A20]">{title}</h3>
            {coinGain ? <span className="coin-pop inline-flex items-center gap-1 font-black text-[#C69019]">+{coinGain} <span aria-hidden="true">●</span></span> : null}
          </div>
          {loading ? <div className="mt-3 space-y-2"><div className="h-3 w-11/12 animate-pulse rounded-full bg-[#d9e4f1]" /><div className="h-3 w-8/12 animate-pulse rounded-full bg-[#d9e4f1]" /></div> : <p className="mt-2 text-base leading-6 text-[#5e493c]">{text}</p>}
          {detail && !loading ? <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-bold leading-5 text-[#6d5546]">{detail}</p> : null}
          <button type="button" disabled={loading} onClick={onAction} className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#D94F3D] px-5 py-3 text-sm font-black text-white shadow-[0_4px_0_#AC382B] transition hover:-translate-y-0.5 hover:bg-[#c94535] disabled:cursor-wait disabled:opacity-60">
            {actionLabel} <Icon name="arrow" size={17} />
          </button>
        </div>
        <span className={`hidden shrink-0 rounded-full p-2 sm:flex ${kind === 'correct' ? 'bg-[#DFF2E3] text-[#4D8B68]' : kind === 'almost' ? 'bg-[#FCE5D9] text-[#D36A4E]' : 'bg-white text-[#D94F3D]'}`} aria-hidden="true"><Icon name={kind === 'correct' ? 'check' : kind === 'ai' ? 'sparkle' : 'bulb'} size={22} /></span>
      </div>
    </section>
  )
}
