export type Level = 1 | 2 | 3

export type TaskType = 'choice' | 'slice' | 'fraction' | 'explain'

export type MisconceptionCode =
  | 'DENOM_BIGGER'
  | 'ADD_ACROSS'
  | 'NO_COMMON_DENOM'
  | 'EQUIV'
  | 'WHOLE_PART'
  | 'GENERIC'

export interface ChoiceOption {
  id: string
  label: string
  correct?: boolean
  misconception?: MisconceptionCode
  feedback?: string
  miniPizza?: string
}

export interface FractionValue {
  numerator: number
  denominator: number
}

export interface FractionPattern {
  answer: string
  misconception: MisconceptionCode
}

export interface Task {
  id: string
  level: Level
  type: TaskType
  topic: string
  customer: string
  order: string
  hint: string
  explain: string
  solution: string
  referenceIdea?: string
  options?: ChoiceOption[]
  answer?: string
  sliceAnswer?: { cuts: number; selected: number }
  cutsFixed?: number
  fractionAnswer?: FractionValue
  fractionFixedDenominator?: number
  fractionPatterns?: FractionPattern[]
  baseFractions?: [FractionValue, FractionValue]
}

export interface TaskResult {
  taskId: string
  level: Level
  topic: string
  correctFirstTry: boolean
  attempts: number
  usedHint: boolean
  earnedCoins: number
  misconceptions: MisconceptionCode[]
  explanation?: string
}

export interface StoredProgress {
  started: boolean
  currentTaskId: string
  queueIds: string[]
  coins: number
  results: TaskResult[]
}

export interface ExplainResult {
  verdict: 'correct' | 'partial' | 'incorrect'
  feedback: string
  misconception?: MisconceptionCode
  source: 'ai' | 'fallback'
}

export interface FinalReport {
  summary: string
  strengths: string[]
  focus: string[]
  nextSteps: string[]
  source: 'ai' | 'fallback'
}
