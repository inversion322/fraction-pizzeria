import type { SVGProps } from 'react'

export type IconName =
  | 'pizza' | 'compare' | 'equal' | 'plus' | 'bulb' | 'check' | 'x' | 'arrow' | 'back'
  | 'lock' | 'refresh' | 'book' | 'star' | 'coin' | 'message' | 'target' | 'route'

/** One stroke family (1.9px, round caps) for every icon in the product. */
export function Icon({ name, size = 22, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...props }
  const paths: Record<IconName, JSX.Element> = {
    pizza: <><path d="M4 5.5c5.8-3 11.6-2.2 16 1.1L8.8 20.2A2 2 0 0 1 5.4 19z" /><circle cx="14" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="9.4" cy="12.6" r="1" fill="currentColor" stroke="none" /><path d="m16.3 10.4 2.2 2.2" /></>,
    compare: <><path d="M12 4v16" /><path d="M8 9 4 12l4 3" /><path d="m16 9 4 3-4 3" /></>,
    equal: <><path d="M5 9h14M5 15h14" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    bulb: <><path d="M9 18h6M10 21h4" /><path d="M8.5 15.5C7.6 14.7 7 13.5 7 12a5 5 0 0 1 10 0c0 1.5-.6 2.7-1.5 3.5-.6.6-.9 1.2-.9 2.1h-5.2c0-.9-.3-1.5-.9-2.1Z" /></>,
    check: <path d="m5 12.5 4.2 4L19 7" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    back: <path d="M15 5l-7 7 7 7" />,
    lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4" /><path d="M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M4 5.5v16" /></>,
    star: <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8Z" />,
    coin: <><circle cx="12" cy="12" r="8.5" /><path d="M14.6 9.3c-.5-.8-1.5-1.3-2.6-1.3-1.5 0-2.6.8-2.6 2s1.1 1.6 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.1 0-2.1-.5-2.6-1.3M12 6.5V8M12 16v1.5" /></>,
    message: <path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 3.5V17H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".8" fill="currentColor" /></>,
    route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" /></>,
  }
  return <svg aria-hidden="true" {...common}>{paths[name]}</svg>
}
