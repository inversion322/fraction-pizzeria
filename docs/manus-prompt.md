# Manus prompt: "Пиццерия «Дробь»" — a fractions trainer for school students

Build the frontend of an educational web trainer for school students. This is a take-home assignment for an AI Product Builder role, judged on: functionality, logic, usability, and visual quality on both desktop and mobile. I need a finished, polished, working project, not a mockup.

**Language rule:** the code, comments and README are in English, but **all user-facing UI copy must be in Russian**. Every Russian string quoted below (task texts, labels, feedback) must be used verbatim.

## 1. Product

**Name:** «Пиццерия „Дробь"» (the "Fraction" pizzeria).
**Audience:** 5th–6th grade students (ages 10–12).
**Learning goal:** understand, compare, add and subtract common fractions, and recognise equivalent fractions.
**Concept:** the student works at Chef Tosha's pizzeria (in Russian: «шеф Тоша»). Customers send orders such as «половина + треть пиццы» or «отрежь 3/8», and the student fulfils them by cutting the pizza, picking slices and calculating. After every answer the student gets clear feedback: what is right, what is wrong, and **why**. At the end, an AI chef analyses the student's mistakes, names their typical misconception about fractions, and gives personal advice.

Tone: friendly, informal "ты", no baby talk (the audience is 11, not 5).

## 2. Technical requirements (mandatory)

- **React 18 + Vite + TypeScript + Tailwind CSS.** Animations via CSS or `framer-motion`; no other heavy libraries. No state-management libraries (`useReducer` + Context is enough).
- **Pure static build for GitHub Pages:** no backend, no SSR. Set `base: './'` in `vite.config.ts`. **No router** (or `HashRouter` only): screens switch via state, so there are no 404s on GitHub Pages.
- **The pizza is drawn in SVG** (circle, sector slices, simple-shape toppings). No pizza images from the internet.
- **Taps only on mobile, no drag-and-drop.** Slices are selected by tapping. Minimum touch target 44×44 px.
- Responsive from 360 px up to desktop. On mobile, everything is a single column and the «Проверить» (Check) button is always reachable without extra scrolling.
- Accessibility: keyboard operable, visible focus, `aria-label` on pizza slices, text contrast at least WCAG AA, respect `prefers-reduced-motion`.
- Progress is saved to `localStorage` (every access wrapped in try/catch; the site must work without it). Include a «Начать заново» (Start over) button.
- `npm run build` must pass with no TypeScript errors or warnings. Add a `README.md`: how to run, how to build, project structure.
- **No API keys in the code.** AI is called only through the module described in section 6.

### Project structure

```
src/
  data/tasks.ts           // ALL tasks, exactly as in section 4; do not invent your own
  data/misconceptions.ts  // the misconception catalogue from section 5
  lib/fractions.ts        // GCD, reduction, comparing fractions by value
  lib/checker.ts          // answer checking + misconception detection
  lib/ai.ts               // the single entry point for AI calls (section 6)
  lib/storage.ts          // localStorage
  components/Pizza.tsx    // SVG pizza: n slices, selection, highlighting
  components/...          // FractionInput, ChoiceList, FeedbackPanel, OrderTicket, etc.
  screens/                // Landing, LevelMap, Task, LevelComplete, FinalReport
```

## 3. Screens and flow

### 3.1 Landing page
- Hero: name, subtitle «Тренажёр по дробям для 5–6 класса», an SVG pizza illustration, a «Начать смену» (Start shift) button.
- «Чему научишься» (What you'll learn) block: 4 items with icons — «сравнивать дроби»; «находить равные дроби»; «складывать и вычитать»; «объяснять своё решение».
- «Как это работает» (How it works) block, 3 steps: «Выполняй заказы» → «Получай разбор каждой ошибки» → «В конце шеф ставит „диагноз“ и советует, что повторить».
- A short line: «12 заказов · 3 уровня · около 15 минут».

### 3.2 Level map
Three level cards: name, description, progress (x/4), coins earned. Levels unlock in order. A tip-coin counter at the top.

1. **«Первые куски»** (First slices): what a fraction is, comparison, equivalent fractions.
2. **«Собери заказ»** (Build the order): addition and subtraction.
3. **«Час пик»** (Rush hour): word problems, reduction, mixed numbers.

### 3.3 Task screen (the main one)
- Top bar: level, progress bar «Заказ 3 из 4», coins.
- **Order ticket** (styled as a paper receipt): customer name and order text.
- **Work area:** pizza(s) and the answer control, depending on the task type (see below).
- Buttons: «Проверить» (primary), «Подсказка» (Hint, secondary).
- **Feedback panel** slides up from the bottom after checking:
  - ✅ Correct: short praise + one line on why it is correct (the task's `explain` field) + a «Следующий заказ» (Next order) button.
  - ❌ Wrong, 1st attempt: a gentle «Почти!», a specific explanation of *this particular* mistake (from the option's `feedback` / the misconception), and a «Попробовать ещё» (Try again) button.
  - ❌ Wrong, 2nd attempt: show the correct step-by-step solution (the `solution` field), visualised on the pizza, and a «Дальше» (Continue) button.
- Coins: correct on 1st attempt = 10, on 2nd attempt = 5, minus 3 if a hint was used (minimum 1). A «+10» animation by the counter.

#### Task types
- `choice` — 2–4 option cards, each may show a mini pizza.
- `slice` — interactive pizza. If `cutsFixed` is not set, the student first chooses how many pieces to cut (buttons 2, 3, 4, 6, 8) and the pizza is cut with an animation; then the student taps slices to select them. A live caption under the pizza: «Выбрано: 3/8».
- `fraction` — fraction input: two fields (numerator above the bar, denominator below), with a pizza beside it that renders the entered fraction in real time (if the denominator ≤ 12). Answers are compared **by value**: a correct but unreduced fraction (10/12 instead of 5/6) is accepted, with the note «Верно! А можно сократить до 5/6».
- `explain` — a question + a free-text field «Объясни своими словами» (min 15 characters, with a counter). Checked by AI via `lib/ai.ts`. While waiting, show the animation «Шеф Тоша читает твой ответ…». The AI returns a verdict `correct | partial | incorrect` + feedback text; `partial` and `incorrect` allow one more attempt.

### 3.4 Level complete
Stars (3 = everything right on 1st attempt, 2 = at most one mistake, 1 = otherwise), coins for the level, a «Следующий уровень» (Next level) button.

### 3.5 Final report «Разбор смены от шефа Тоши» (Chef Tosha's shift review)
- Totals: coins, correct on 1st attempt X of 12, pizzeria rating (stars).
- **«Диагноз» (Diagnosis) block:** the main misconception (from counting misconception codes) with its name, explanation, and an example of correct reasoning. If there are no mistakes, show «Мастер дробей» (Fraction master).
- **AI block** (`getFinalReport`): personal summary, «Получается хорошо» (strengths), «Стоит потренировать» (focus areas), «Что сделать дальше» (next steps). Show a skeleton while loading. If the AI is unavailable, only the local diagnosis is shown, with no errors in the UI.
- Buttons: «Пройти заново» (Play again), «Повторить только ошибки» (Retry mistakes only — replays the tasks not solved on the 1st attempt).

## 4. Tasks (use exactly this data)

Each task has: `id`, `level`, `type`, `customer`, `order` (order text), answer data, `hint`, `explain` (why the answer is correct), `solution` (step-by-step), and for wrong options, `misconception` and `feedback`. Write any missing `hint`/`feedback` texts in Russian in the same tone, consistent with the misconception catalogue.

### Level 1 «Первые куски»
1. **choice** — Customer Миша: «Хочу кусок побольше: 1/3 пиццы или 1/4?» Options: `1/3` ✅ · `1/4` ❌ (DENOM_BIGGER) · `Одинаковые` ❌ (DENOM_BIGGER). Explain: «Чем на большее число частей режем пиццу, тем меньше каждый кусок. 1/3 — пицца на 3 части, 1/4 — на 4, поэтому 1/3 больше». Show two mini pizzas.
2. **slice** (free cutting) — Customer Аня: «Мне 3/8 пиццы, пожалуйста». Correct: cut into 8, 3 selected. If not cut into 8 — feedback «Знаменатель 8 показывает, на сколько равных частей резать пиццу». Hint: «Знаменатель — это на сколько частей режем, числитель — сколько берём».
3. **slice** (`cutsFixed: 8`) — Customer Гоша: «Пицца уже нарезана на 8 кусков. Дайте мне ровно половину». Correct: any 4 slices selected. If 2 selected — EQUIV. Explain: «4/8 = 1/2: если умножить числитель и знаменатель 1/2 на 4, получится 4/8».
4. **explain** — Шеф Тоша: «Стажёр спорит со мной: „1/4 больше, чем 1/3, ведь 4 больше 3!“ Объясни стажёру, почему он неправ». Reference idea: the denominator is the number of pieces; more pieces means each piece is smaller; so 1/3 > 1/4.

### Level 2 «Собери заказ»
5. **choice** — Customer Лиза: «Положите мне 1/4 пиццы, а потом ещё 2/4. Сколько всего?» Options: `3/4` ✅ · `3/8` ❌ (ADD_ACROSS) · `2/4` ❌ (GENERIC).
6. **fraction** — Customer Дима: «Мне 1/2 пиццы с грибами и 1/4 с сыром. Какая часть пиццы получится?» Answer: 3/4. Wrong patterns: 2/6 → ADD_ACROSS; 2/4 → NO_COMMON_DENOM. Solution: «1/2 = 2/4 → 2/4 + 1/4 = 3/4».
7. **fraction** — Customer Соня: «1/2 пиццы маргариты и 1/3 пепперони — какая часть пиццы это вместе?» Answer: 5/6 (10/12 accepted with a suggestion to reduce). Wrong: 2/5 → ADD_ACROSS; 2/6 → NO_COMMON_DENOM. Solution: «Общий знаменатель 6: 1/2 = 3/6, 1/3 = 2/6 → 3/6 + 2/6 = 5/6».
8. **choice** — Customer Петя: «Было 3/4 пиццы, я съел 1/2. Сколько осталось?» Options: `1/4` ✅ · `2/2` ❌ (ADD_ACROSS) · `2/4` ❌ (NO_COMMON_DENOM) · `1/2` ❌ (GENERIC). Solution: «1/2 = 2/4 → 3/4 − 2/4 = 1/4».

### Level 3 «Час пик»
9. **choice** — A group of friends: «Аня съест 1/3 пиццы, Боря — 1/6, Вика — 1/2. Хватит одной пиццы?» Options: `Хватит ровно` ✅ · `Хватит, ещё останется` ❌ (GENERIC) · `Не хватит` ❌ (GENERIC). Solution: «Общий знаменатель 6: 2/6 + 1/6 + 3/6 = 6/6 = 1 — ровно одна пицца».
10. **fraction** (denominator fixed at 4; the student enters only the numerator) — Шеф: «На тарелке 6/8 пиццы. Сколько это в четвертях?» Answer: 3/4. Wrong 6 → EQUIV. Solution: «Делим числитель и знаменатель на 2: 6/8 = 3/4».
11. **choice** — Customer Рома: «Мы заказали 1 1/2 пиццы и съели 3/4. Сколько осталось?» Options: `3/4` ✅ · `1/4` ❌ (WHOLE_PART) · `1 1/4` ❌ (WHOLE_PART) · `2/2` ❌ (ADD_ACROSS). Solution: «1 1/2 = 6/4 → 6/4 − 3/4 = 3/4». Show 1.5 pizzas.
12. **explain** — Шеф Тоша: «Новый повар посчитал: 1/2 + 1/3 = 2/5, „ведь 1 + 1 = 2 и 2 + 3 = 5“. Объясни ему, в чём ошибка и сколько будет на самом деле». Reference idea: denominators must not be added; convert to the common denominator 6; 3/6 + 2/6 = 5/6; besides, 2/5 is less than 1/2, even though we were adding pizza.

## 5. Misconception catalogue (`misconceptions.ts`)

| Code | Name (UI, Russian) | Explanation for the student (UI, Russian) |
|---|---|---|
| `DENOM_BIGGER` | «Больше знаменатель — больше кусок» | «Знаменатель — число частей. Чем их больше, тем каждая меньше.» |
| `ADD_ACROSS` | «Складываю числители и знаменатели» | «Знаменатель — размер куска, его не складывают. Сначала приводим к общему знаменателю, потом складываем числители.» |
| `NO_COMMON_DENOM` | «Забываю общий знаменатель» | «Складывать и вычитать можно только куски одного размера — приведи дроби к общему знаменателю.» |
| `EQUIV` | «Не вижу равные дроби» | «1/2 = 2/4 = 4/8: если умножить или разделить числитель и знаменатель на одно число, дробь не меняется.» |
| `WHOLE_PART` | «Путаюсь с целой частью» | «Переведи смешанное число в неправильную дробь: 1 1/2 = 3/2 = 6/4.» |
| `GENERIC` | — | A general mistake; not counted in the diagnosis. |

For `fraction` tasks, `checker.ts` detects ADD_ACROSS on its own (the answer equals (a+c)/(b+d)) and NO_COMMON_DENOM (via the task's patterns).

## 6. AI module (`src/lib/ai.ts`): use exactly this interface

I will connect the backend myself later. For now, build the module with this interface and a **working mock**.

```ts
export type MisconceptionCode =
  'DENOM_BIGGER' | 'ADD_ACROSS' | 'NO_COMMON_DENOM' | 'EQUIV' | 'WHOLE_PART' | 'GENERIC';

export interface ExplainRequest {
  taskId: string;
  question: string;
  referenceIdea: string;
  studentAnswer: string;
}
export interface ExplainResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  feedback: string;             // 1–3 sentences in Russian, informal "ты"
  misconception?: MisconceptionCode;
  source: 'ai' | 'fallback';
}

export interface TaskResult {
  taskId: string;
  level: 1 | 2 | 3;
  topic: string;                // e.g. «сложение с разными знаменателями»
  correctFirstTry: boolean;
  attempts: number;
  usedHint: boolean;
  misconceptions: MisconceptionCode[];
  explanation?: string;         // the student's text for explain tasks
}
export interface FinalReport {
  summary: string;
  strengths: string[];
  focus: string[];
  nextSteps: string[];
  source: 'ai' | 'fallback';
}

export async function evaluateExplanation(req: ExplainRequest): Promise<ExplainResult>;
export async function getFinalReport(results: TaskResult[]): Promise<FinalReport>;
```

- The backend URL comes from `import.meta.env.VITE_AI_ENDPOINT` (POST `${endpoint}/explain` and `${endpoint}/report`, JSON).
- If the variable is empty, the request fails, or 15 seconds pass, **silently** fall back to a local implementation (`source: 'fallback'`):
  - `evaluateExplanation`: keyword check (task 4: «частей», «меньше», «больше»; task 12: «общ», «знаменат», «5/6» / «6»). 2+ matches → `correct`, 1 → `partial`, 0 → `incorrect`, with meaningful Russian feedback text.
  - `getFinalReport`: built from the stats and the misconception catalogue.
- Add `.env.example` containing `VITE_AI_ENDPOINT=`.

## 7. Visual style

- Warm pizzeria palette: cream background, tomato red (primary), basil green (success), cheese yellow (accents, coins), dark brown text. Errors use a soft red-orange, not a screaming red. Define colours as CSS variables / Tailwind tokens.
- A soft, rounded font with Cyrillic support: Nunito (Google Fonts), bold headings.
- 16–24 px corner radius, soft shadows, an order ticket with a zigzag "torn receipt" edge.
- Chef Tosha: a simple SVG character (chef's hat, moustache) or an emoji avatar; appears in the feedback.
- Micro-animations: pizza cutting, slice selection (slight lift), «+10» coins, confetti on the final screen (disabled under `prefers-reduced-motion`).
- Clean and tidy, not overloaded: this is a learning tool, not a casino.

## 8. Self-check before delivery

- Play all 12 tasks correctly, incorrectly and with hints, at 375 px and 1440 px widths.
- Every wrong option shows its own explanation, not a generic «неверно».
- The AI fallback works without `VITE_AI_ENDPOINT`; explain tasks and the final report do not break.
- Progress survives a page reload; «Начать заново» resets it.
- No console errors; `npm run build` passes.

**Deliverable:** the full project source code (repository or archive) with a README.
