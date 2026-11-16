export type Level = 1 | 2 | 3

export type TaskType = 'choice' | 'slice' | 'fraction' | 'puzzle'

/** A fraction piece in a puzzle; ids are unique even when values repeat (two 1/8 pieces). */
export interface PuzzlePiece {
  id: string
  value: string // "3/4" or "1 1/2"
}

/** Level 1: line the pieces up from the smallest to the largest. */
export interface OrderPuzzle {
  kind: 'order'
  pieces: PuzzlePiece[]
}

/** Level 2: pick pieces that add up to exactly one whole pizza. */
export interface WholePuzzle {
  kind: 'whole'
  pieces: PuzzlePiece[]
  solution: string[] // piece ids shown when the answer is revealed
}

/** Level 3: put every order into the box with the equal fraction. */
export interface BoxesPuzzle {
  kind: 'boxes'
  items: Array<PuzzlePiece & { box: string }>
  boxes: string[]
}

export type Puzzle = OrderPuzzle | WholePuzzle | BoxesPuzzle

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
  puzzle?: Puzzle
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
  /** Puzzle moves in plain words, for the AI review (e.g. «поставил 1/4 раньше 1/6»). */
  moves?: string[]
}

export interface StoredProgress {
  started: boolean
  currentTaskId: string
  queueIds: string[]
  coins: number
  results: TaskResult[]
  /** True while the current shift was started from scratch (counts for the chef chat). */
  fresh?: boolean
}

export interface PuzzleReview {
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
