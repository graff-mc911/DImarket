/**
 * Myers / LCS line diff for admin review of official source changes.
 * Operates on lines — suitable for normalized legal text excerpts.
 */

export type LineDiffOp =
  | { type: 'equal'; line: string }
  | { type: 'insert'; line: string }
  | { type: 'delete'; line: string }

/** Longest common subsequence table (Myers-style line diff via LCS backtrack). */
function lcsTable(a: string[], b: string[]): number[][] {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }
  return dp
}

/** Compute ordered line diff ops from two texts. */
export function myersLineDiff(oldText: string, newText: string): LineDiffOp[] {
  const a = (oldText ?? '').split('\n')
  const b = (newText ?? '').split('\n')
  const dp = lcsTable(a, b)
  const ops: LineDiffOp[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', line: a[i] })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'delete', line: a[i] })
      i += 1
    } else {
      ops.push({ type: 'insert', line: b[j] })
      j += 1
    }
  }
  while (i < a.length) {
    ops.push({ type: 'delete', line: a[i] })
    i += 1
  }
  while (j < b.length) {
    ops.push({ type: 'insert', line: b[j] })
    j += 1
  }
  return ops
}

export function summarizeLineDiff(ops: LineDiffOp[]): {
  added: number
  removed: number
  unchanged: number
} {
  let added = 0
  let removed = 0
  let unchanged = 0
  for (const op of ops) {
    if (op.type === 'insert') added += 1
    else if (op.type === 'delete') removed += 1
    else unchanged += 1
  }
  return { added, removed, unchanged }
}

/** Group consecutive ops for side-by-side display. */
export function lineDiffSides(ops: LineDiffOp[]): {
  left: Array<{ kind: 'context' | 'delete'; text: string }>
  right: Array<{ kind: 'context' | 'insert'; text: string }>
} {
  const left: Array<{ kind: 'context' | 'delete'; text: string }> = []
  const right: Array<{ kind: 'context' | 'insert'; text: string }> = []
  for (const op of ops) {
    if (op.type === 'equal') {
      left.push({ kind: 'context', text: op.line })
      right.push({ kind: 'context', text: op.line })
    } else if (op.type === 'delete') {
      left.push({ kind: 'delete', text: op.line })
      right.push({ kind: 'context', text: '' })
    } else {
      left.push({ kind: 'context', text: '' })
      right.push({ kind: 'insert', text: op.line })
    }
  }
  return { left, right }
}
