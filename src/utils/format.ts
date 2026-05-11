/** Format yuan value as 万元 display string */
export function fmtWan(value: number): string {
  const wan = value / 10000
  if (Math.abs(wan) < 1) {
    return `${wan.toFixed(2)}万`
  }
  return `${wan.toLocaleString(undefined, { maximumFractionDigits: 2 })}万`
}

/** Format yuan value with 万元 suffix */
export function fmtWanFull(value: number): string {
  return `${fmtWan(value)}元`
}
