import { Fragment, type ReactNode } from 'react'

/** A stacked fraction (numerator over a bar), as children see it in a textbook. */
export function Frac({ n, d, whole, className = '' }: { n: number | string; d: number | string; whole?: number | string; className?: string }) {
  const label = `${whole ? `${whole} целая ` : ''}${n}/${d}`
  return (
    <span className={`inline-flex items-center gap-[0.12em] align-middle ${className}`} role="math" aria-label={label}>
      {whole !== undefined && <span className="tabular">{whole}</span>}
      <span className="inline-flex flex-col items-center text-[0.78em] font-extrabold leading-[1.02] tabular" aria-hidden="true">
        <span className="px-[0.1em]">{n}</span>
        <span className="h-[0.09em] min-h-[1.5px] w-full rounded-full bg-current" />
        <span className="px-[0.1em]">{d}</span>
      </span>
    </span>
  )
}

// "1 1/2" (mixed number) or "3/4"
const FRACTION = /(\d+)\s(\d+)\/(\d+)|(\d+)\/(\d+)/g

/** Renders a string, turning every "a/b" and "w a/b" into a stacked fraction. */
export function MathText({ children, className }: { children: string; className?: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of children.matchAll(FRACTION)) {
    const index = match.index ?? 0
    if (index > last) parts.push(children.slice(last, index))
    parts.push(match[1]
      ? <Frac key={index} whole={match[1]} n={match[2]} d={match[3]} />
      : <Frac key={index} n={match[4]} d={match[5]} />)
    last = index + match[0].length
  }
  if (last < children.length) parts.push(children.slice(last))
  return <span className={className}>{parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)}</span>
}
