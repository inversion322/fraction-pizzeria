import type { FractionValue } from '../types'

export function gcd(a: number, b: number): number {
  let left = Math.abs(Math.trunc(a))
  let right = Math.abs(Math.trunc(b))
  while (right !== 0) {
    const next = left % right
    left = right
    right = next
  }
  return left || 1
}

export function reduceFraction(fraction: FractionValue): FractionValue {
  if (fraction.denominator === 0) return fraction
  const sign = fraction.denominator < 0 ? -1 : 1
  const divisor = gcd(fraction.numerator, fraction.denominator)
  return { numerator: sign * (fraction.numerator / divisor), denominator: sign * (fraction.denominator / divisor) }
}

export function compareFractions(a: FractionValue, b: FractionValue): number {
  if (a.denominator === 0 || b.denominator === 0) return Number.NaN
  const difference = a.numerator * b.denominator - b.numerator * a.denominator
  return difference === 0 ? 0 : difference > 0 ? 1 : -1
}

export function fractionEquals(a: FractionValue, b: FractionValue): boolean {
  return compareFractions(a, b) === 0
}

export function parseFraction(value: string): FractionValue | null {
  const normalized = value.trim().replace(/\s+/g, '')
  const match = normalized.match(/^(-?\d+)\/(\d+)$/)
  if (!match) return null
  const numerator = Number(match[1])
  const denominator = Number(match[2])
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null
  return { numerator, denominator }
}

export function formatFraction(fraction: FractionValue, reduced = true): string {
  const value = reduced ? reduceFraction(fraction) : fraction
  return `${value.numerator}/${value.denominator}`
}

export function isEquivalent(a: FractionValue, b: FractionValue): boolean {
  return fractionEquals(a, b)
}

/** Parses "3/4", "1 1/2" or "2" into an (unreduced) fraction. */
export function parseMixed(value: string): FractionValue {
  const mixed = value.trim().match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) {
    const whole = Number(mixed[1]); const n = Number(mixed[2]); const d = Number(mixed[3])
    return { numerator: whole * d + n, denominator: d }
  }
  return parseFraction(value) ?? { numerator: Number(value) || 0, denominator: 1 }
}

export function addFractions(values: FractionValue[]): FractionValue {
  return reduceFraction(values.reduce((sum, f) => ({ numerator: sum.numerator * f.denominator + f.numerator * sum.denominator, denominator: sum.denominator * f.denominator }), { numerator: 0, denominator: 1 }))
}

export function toNumber(fraction: FractionValue): number {
  return fraction.numerator / fraction.denominator
}
