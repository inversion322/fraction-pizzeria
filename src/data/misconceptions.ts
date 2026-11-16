import type { MisconceptionCode } from '../types'

export interface Misconception {
  code: MisconceptionCode
  name: string
  explanation: string
  example: string
}

export const misconceptions: Record<MisconceptionCode, Misconception> = {
  DENOM_BIGGER: {
    code: 'DENOM_BIGGER',
    name: 'Больше знаменатель — больше кусок',
    explanation: 'Знаменатель — число частей. Чем их больше, тем каждая меньше.',
    example: '1/3 больше 1/4, потому что третья часть крупнее четверти.',
  },
  ADD_ACROSS: {
    code: 'ADD_ACROSS',
    name: 'Складываю числители и знаменатели',
    explanation: 'Знаменатель — размер куска, его не складывают. Сначала приводим к общему знаменателю, потом складываем числители.',
    example: '1/2 + 1/3 = 3/6 + 2/6 = 5/6, а не 2/5.',
  },
  NO_COMMON_DENOM: {
    code: 'NO_COMMON_DENOM',
    name: 'Забываю общий знаменатель',
    explanation: 'Складывать и вычитать можно только куски одного размера — приведи дроби к общему знаменателю.',
    example: '1/2 превращается в 2/4, чтобы сложить её с четвертью.',
  },
  EQUIV: {
    code: 'EQUIV',
    name: 'Не вижу равные дроби',
    explanation: '1/2 = 2/4 = 4/8: если умножить или разделить числитель и знаменатель на одно число, дробь не меняется.',
    example: '6/8 можно сократить на 2 и получить 3/4.',
  },
  WHOLE_PART: {
    code: 'WHOLE_PART',
    name: 'Путаюсь с целой частью',
    explanation: 'Переведи смешанное число в неправильную дробь: 1 1/2 = 3/2 = 6/4.',
    example: 'Полторы пиццы — это 6/4, если считаем четвертями.',
  },
  GENERIC: {
    code: 'GENERIC',
    name: 'Нужна ещё одна попытка',
    explanation: 'Разложи задачу на маленькие шаги и проверь, что показывает каждая цифра.',
    example: 'Запиши дроби рядом с рисунком пиццы и сравни размеры кусочков.',
  },
}

export function getMisconception(code?: MisconceptionCode): Misconception {
  return misconceptions[code ?? 'GENERIC']
}
