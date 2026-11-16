import type { SVGProps } from 'react'

export type IconName = 'pizza' | 'compare' | 'equal' | 'plus' | 'bulb' | 'check' | 'arrow' | 'lock' | 'sparkle' | 'chef' | 'refresh' | 'book'

export function Icon({ name, size = 22, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...props }
  const paths: Record<IconName, JSX.Element> = {
    pizza: <><path d="M4 5.5c5.8-3 11.6-2.2 16 1.1L8.8 20.2A2 2 0 0 1 5.4 19z"/><circle cx="14" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="9.4" cy="12.6" r="1" fill="currentColor" stroke="none"/><path d="m16.3 10.4 2.2 2.2"/></>,
    compare: <><path d="M6 5v14M6 5l-3 3M6 5l3 3M18 19V5m0 14-3-3m3 3 3-3"/><path d="M10.5 9h4M10.5 15h4"/></>,
    equal: <><path d="M4 8h16M4 16h16"/><circle cx="7" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    bulb: <><path d="M9 18h6M10 21h4"/><path d="M8.5 15.5C7.6 14.7 7 13.5 7 12a5 5 0 0 1 10 0c0 1.5-.6 2.7-1.5 3.5-.6.6-.9 1.2-.9 2.1h-5.2c0-.9-.3-1.5-.9-2.1Z"/><path d="M12 3V1M4.9 4.9 3.5 3.5M19.1 4.9l1.4-1.4"/></>,
    check: <path d="m5 12 4.2 4L19 6.5"/>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    sparkle: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z"/></>,
    chef: <><path d="M7 10V7.8a2.8 2.8 0 0 1 4.1-2.5A3.1 3.1 0 0 1 17 7v3"/><path d="M5 10h14v4.5a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5Z"/><path d="M9 15c1.3 1 4.7 1 6 0"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M4 5.5v16M8 7h8M8 11h8"/></>,
  }
  return <svg aria-hidden="true" {...common}>{paths[name]}</svg>
}
