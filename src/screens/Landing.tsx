import { Icon } from '../components/Icon'
import { Pizza } from '../components/Pizza'

export function Landing({ onStart, hasProgress }: { onStart: () => void; hasProgress: boolean }) {
  const goals = [
    { icon: 'compare' as const, title: 'сравнивать дроби', text: 'Видеть, какой кусочек больше, даже если цифры путают.' },
    { icon: 'equal' as const, title: 'находить равные дроби', text: 'Замечать, что 1/2, 2/4 и 4/8 могут быть одной долей.' },
    { icon: 'plus' as const, title: 'складывать и вычитать', text: 'Собирать заказ из кусочков одного размера.' },
    { icon: 'bulb' as const, title: 'объяснять своё решение', text: 'Говорить о математике понятно — словами и рисунками.' },
  ]
  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-8 sm:pt-8 lg:px-12">
      <section className="relative overflow-hidden rounded-[30px] bg-[#3D2A20] px-6 py-8 text-[#FFF8EC] shadow-[0_20px_50px_rgba(61,42,32,.16)] sm:px-12 sm:py-12 lg:min-h-[460px] lg:px-16">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#D94F3D] opacity-90 blur-[1px] sm:h-96 sm:w-96" />
        <div className="absolute -bottom-24 right-48 h-48 w-48 rounded-full bg-[#F6C64C] opacity-80" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8EC] text-[#D94F3D]"><Icon name="pizza" size={23} /></span><span className="text-sm font-black uppercase tracking-[.16em] text-[#F6C64C]">смена начинается</span></div>
          <p className="eyebrow !text-[#F6C64C]">Тренажёр по дробям для 5–6 класса</p>
          <h1 className="mt-3 max-w-xl text-balance text-4xl font-black leading-[1.03] tracking-tight sm:text-6xl">Пиццерия<br /><span className="text-[#F6C64C]">«Дробь»</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#FBEBDD] sm:text-lg">Помоги шефу Тоше выполнить заказы: режь пиццу, сравнивай кусочки и объясняй свои решения.</p>
          <button type="button" onClick={onStart} className="mt-8 inline-flex min-h-[52px] items-center gap-3 rounded-2xl bg-[#D94F3D] px-6 py-3.5 text-base font-black text-white shadow-[0_5px_0_#8E3027] transition hover:-translate-y-0.5 hover:bg-[#e85d4a]">{hasProgress ? 'Продолжить смену' : 'Начать смену'} <Icon name="arrow" size={19} /></button>
          <p className="mt-4 text-sm font-bold text-[#DCC4B2]">12 заказов · 3 уровня · около 15 минут</p>
        </div>
        <div className="absolute bottom-5 right-7 hidden lg:block"><div className="relative rounded-full bg-[#FFF8EC]/10 p-5 backdrop-blur"><Pizza cuts={6} selected={[0, 1]} size={300} showLabels={false} disabled /></div><div className="absolute -bottom-1 -left-4 rotate-[-8deg] rounded-2xl bg-[#F6C64C] px-4 py-2 text-sm font-black text-[#3D2A20] shadow-lg">режем по-честному</div></div>
      </section>

      <section className="mt-14" aria-labelledby="learn-title">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">навыки смены</p><h2 id="learn-title" className="mt-2 text-3xl font-black tracking-tight text-[#3D2A20]">Чему ты научишься</h2></div><span className="rounded-full bg-[#FFF7D7] px-4 py-2 text-sm font-extrabold text-[#8A6419]">не зубрить, а понимать</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{goals.map((goal, index) => <article key={goal.title} className="paper-card group p-5 transition hover:-translate-y-1"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${index % 2 === 0 ? 'bg-[#FFF0EB] text-[#D94F3D]' : 'bg-[#EAF6ED] text-[#4D8B68]'}`}><Icon name={goal.icon} size={23} /></div><h3 className="mt-5 text-lg font-black text-[#3D2A20]">{goal.title}</h3><p className="mt-2 text-sm leading-6 text-[#8C776B]">{goal.text}</p></article>)}</div>
      </section>

      <section className="mt-14 grid items-stretch gap-5 lg:grid-cols-[.85fr_1.15fr]" aria-labelledby="how-title">
        <div className="rounded-[24px] bg-[#4D8B68] p-7 text-[#F4FFF6] sm:p-9"><p className="text-xs font-black uppercase tracking-[.16em] text-[#C8E8CF]">маршрут смены</p><h2 id="how-title" className="mt-3 text-3xl font-black">Как это работает</h2><div className="mt-7 space-y-5">{['Выполняй заказы', 'Получай разбор каждой ошибки', 'В конце шеф ставит «диагноз» и советует, что повторить'].map((step, index) => <div className="flex gap-4" key={step}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6C64C] text-sm font-black text-[#3D2A20]">{index + 1}</span><p className="pt-1 text-base font-extrabold leading-6">{step}</p></div>)}</div></div>
        <div className="paper-card flex flex-col justify-between p-7 sm:p-9"><div className="flex items-center justify-between"><div><p className="eyebrow">шеф Тоша обещает</p><h2 className="mt-2 text-2xl font-black text-[#3D2A20]">Ошибаться можно</h2></div><span className="sparkle text-4xl" aria-hidden="true">✦</span></div><p className="mt-5 max-w-xl text-lg leading-8 text-[#6d5546]">Каждый ответ — это маленькая проверка идеи. Если что-то не сработало, ты сразу увидишь почему и попробуешь снова.</p><div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full bg-[#FFF0EB] px-3 py-2 text-xs font-extrabold text-[#AC382B]">SVG-пицца</span><span className="rounded-full bg-[#EAF6ED] px-3 py-2 text-xs font-extrabold text-[#356B4D]">понятные подсказки</span><span className="rounded-full bg-[#FFF7D7] px-3 py-2 text-xs font-extrabold text-[#8A6419]">свой темп</span></div></div>
      </section>
    </main>
  )
}
