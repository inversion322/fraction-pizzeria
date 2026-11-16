export function ChefTosha({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'max-w-sm'}`}>
      <div className={`relative flex shrink-0 items-center justify-center rounded-full bg-[#FCE5D9] ${compact ? 'h-11 w-11 text-xl' : 'h-14 w-14 text-2xl'}`} aria-hidden="true">
        <span className="-translate-y-0.5">👨‍🍳</span>
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#4D8B68] text-[10px] text-white">✓</span>
      </div>
      {!compact && <div><p className="text-sm font-extrabold text-[#3D2A20]">Шеф Тоша</p><p className="text-xs leading-4 text-[#8C776B]">разбирает заказ вместе с тобой</p></div>}
    </div>
  )
}
