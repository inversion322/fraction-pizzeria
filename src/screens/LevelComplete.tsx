import { Icon } from '../components/Icon'
import { levelInfo } from '../data/tasks'
import type { Level } from '../types'

export function LevelComplete({ level, stars, coins, isFinal, onNext, onMap }: { level: Level; stars: number; coins: number; isFinal: boolean; onNext: () => void; onMap: () => void }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-14 pt-9 text-center sm:px-8 sm:pt-14">
      <div className="relative"><div className="absolute -inset-8 rounded-full bg-[#FFF7D7] blur-2xl" /><div className="relative flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#F6C64C] text-5xl shadow-[0_9px_0_#D9A92D]">{isFinal ? '★' : '✦'}</div></div>
      <p className="eyebrow mt-10">{isFinal ? 'смена почти закончена' : `уровень ${level} пройден`}</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-[#3D2A20]">{isFinal ? 'Все заказы приняты!' : levelInfo[level].name}</h1>
      <p className="mt-4 max-w-lg text-lg leading-8 text-[#8C776B]">{isFinal ? 'Осталось заглянуть в разбор от шефа Тоши и узнать, что уже получается отлично.' : 'Четыре заказа на подносе. Ты отлично держал размер кусочков под контролем.'}</p>
      <div className="mt-8 flex gap-2 rounded-2xl bg-[#fffdf8] px-6 py-4 shadow-[0_8px_25px_rgba(103,69,48,.08)]"><span className="text-4xl tracking-[.12em]">{[1, 2, 3].map((star) => <span key={star} className={star <= stars ? 'text-[#F6C64C]' : 'text-[#E7D9CA]'}>★</span>)}</span></div>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#EAF6ED] px-4 py-2 text-sm font-black text-[#356B4D]"><span className="text-[#C69019]">●</span> За уровень: {coins} монет</div>
      <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{isFinal ? <button type="button" onClick={onNext} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#D94F3D] px-6 py-3 text-base font-black text-white shadow-[0_5px_0_#AC382B] transition hover:-translate-y-0.5">Открыть разбор <Icon name="arrow" size={18} /></button> : <button type="button" onClick={onNext} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#D94F3D] px-6 py-3 text-base font-black text-white shadow-[0_5px_0_#AC382B] transition hover:-translate-y-0.5">Следующий уровень <Icon name="arrow" size={18} /></button>}<button type="button" onClick={onMap} className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-[#eadac8] bg-[#fffdf8] px-6 py-3 text-base font-black text-[#6d5546] transition hover:border-[#D94F3D]">К карте смены</button></div>
    </main>
  )
}
